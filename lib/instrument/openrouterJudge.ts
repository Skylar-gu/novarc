/**
 * The OpenRouter-backed LLM judge.
 *
 * `makeOpenRouterJudge()` returns a `Judge` (the same contract `judge.ts`'s
 * `makeLlmJudge()` fulfils) that scores a transcript on a cheaper model
 * through OpenRouter's single OpenAI-compatible chat-completions endpoint.
 * It reuses `judge.ts`'s system prompt, user-prompt builder, raw-score
 * schema, and raw-score coercion verbatim, so a Claude judge and an
 * OpenRouter judge read the transcript under identical instructions and are
 * interchangeable in `core.ts`. It does NOT verify receipt spans — as with
 * the Claude judge, `score.ts` routes every raw score through
 * `validateResult`, the single place a fabricated receipt is caught.
 *
 * Plain `fetch` rather than a client library: OpenRouter is one HTTP
 * endpoint, so a dependency buys nothing here.
 *
 * Never a hard dependency: a missing key, a transport failure, a non-2xx
 * response, or output that will not parse after one retry all throw
 * `JudgeUnavailableError`, which the scoring route catches and falls back to
 * the deterministic heuristic engine.
 *
 * It may import `./judge.ts`, `./types.ts`, and `./score.ts` (for the `Judge`
 * type). It must not import anything under `app/`.
 */

import {
  JudgeUnavailableError,
  RAW_SCORE_SCHEMA,
  RETRY_NOTE,
  SYSTEM_PROMPT,
  buildUserPrompt,
  coerceRawScore,
} from "./judge.ts";
import type { Judge } from "./score.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** The default model. Overridable per call or via `INSTRUMENT_MODEL`. Picked
 *  for cheap, high-volume structured-output scoring: strong JSON-schema
 *  adherence, large context, a fraction of Claude's per-token cost. */
const DEFAULT_MODEL = "google/gemini-2.5-flash";

interface OpenRouterMessage {
  content?: string | null;
}
interface OpenRouterChoice {
  message?: OpenRouterMessage;
}
interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
}

/**
 * Build an OpenRouter-backed `Judge`.
 *
 * The model is `opts.model`, else `process.env.INSTRUMENT_MODEL`, else
 * `google/gemini-2.5-flash`. The key is read from `OPENROUTER_API_KEY`; its
 * absence throws `JudgeUnavailableError` immediately (synchronously, from
 * this factory) so `core.ts`'s existing fallback-to-heuristic path handles a
 * missing key exactly like any other judge failure.
 */
export function makeOpenRouterJudge(opts?: { model?: string }): Judge {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new JudgeUnavailableError("OPENROUTER_API_KEY is not set");
  }
  const model = opts?.model ?? process.env.INSTRUMENT_MODEL ?? DEFAULT_MODEL;

  return async function openRouterJudge(turns, rubricText, { coached }) {
    const basePrompt = buildUserPrompt(rubricText, turns);
    let lastMalformed: unknown = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const userPrompt = attempt === 0 ? basePrompt : basePrompt + RETRY_NOTE;

      let response: Response;
      try {
        response = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "raw_score",
                strict: true,
                schema: RAW_SCORE_SCHEMA,
              },
            },
          }),
        });
      } catch (err) {
        throw new JudgeUnavailableError(
          "the scoring service could not be reached",
          { cause: err },
        );
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new JudgeUnavailableError(
            "the scoring service is rate limited",
          );
        }
        if (response.status === 401 || response.status === 403) {
          throw new JudgeUnavailableError(
            "the scoring service rejected the credentials",
          );
        }
        throw new JudgeUnavailableError(
          `the scoring service returned an error (${response.status})`,
        );
      }

      let body: OpenRouterResponse;
      try {
        body = (await response.json()) as OpenRouterResponse;
      } catch (err) {
        lastMalformed = err;
        continue;
      }

      const content = body.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        lastMalformed = body;
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        lastMalformed = content;
        continue;
      }

      const raw = coerceRawScore(parsed, coached);
      if (raw) return raw;
      lastMalformed = parsed;
    }

    throw new JudgeUnavailableError(
      "the scoring service returned output that did not match the schema",
      { cause: lastMalformed },
    );
  };
}
