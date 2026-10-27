/**
 * The OpenRouter-backed LLM turn-splitter.
 *
 * `makeOpenRouterSplitter()` returns a `Splitter` (the same contract
 * `llmSplit.ts`'s `makeLlmSplitter()` fulfils) that splits raw pasted text
 * into turns through OpenRouter's single OpenAI-compatible chat-completions
 * endpoint. It reuses `llmSplit.ts`'s system prompt, user-prompt builder,
 * turns schema, and raw-turns coercion verbatim, so a Claude split and an
 * OpenRouter split read the pasted text under identical instructions and are
 * interchangeable in `core.ts`.
 *
 * Unlike the judge backends, this one tries two models in order: a primary
 * pick for cost, and a backup for when the primary's output never validates
 * or the primary itself fails. Splitting is a cheap, low-stakes task (copy
 * text back out, labelled) next to scoring, so a cross-model fallback is
 * worth the extra round trip here in a way it would not be for the judge.
 *
 * Plain `fetch` rather than a client library: OpenRouter is one HTTP
 * endpoint, so a dependency buys nothing here.
 *
 * Never a hard dependency: a missing key, a transport failure, a non-2xx
 * response, or output that will not parse after both models have each taken
 * one retry all throw `SplitUnavailableError`, which the route catches and
 * reports as the transcript not being splittable.
 *
 * It may import `./llmSplit.ts`, `./types.ts`, and `./parsers/shared.ts`. It
 * must not import anything under `app/`.
 */

import {
  RETRY_NOTE,
  SYSTEM_PROMPT,
  SplitUnavailableError,
  TURNS_SCHEMA,
  buildUserPrompt,
  coerceRawTurns,
  turnsAreVerbatim,
  type Splitter,
} from "./llmSplit.ts";
import { finalizeTurns } from "./parsers/shared.ts";
import type { Turn } from "./types.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Primary pick: cheap, fast, large context, reliable JSON-schema adherence —
 *  this step only copies text back out and labels it, so cost matters more
 *  than raw capability. Overridable via `INSTRUMENT_SPLIT_MODEL`. */
const DEFAULT_PRIMARY_MODEL = "google/gemini-2.5-flash-lite";

/** Tried only if the primary model fails outright or its output never
 *  validates after its own retry. Overridable via
 *  `INSTRUMENT_SPLIT_BACKUP_MODEL`. */
const DEFAULT_BACKUP_MODEL = "openai/gpt-4o-mini";

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
 * One model, one retry on unparseable output — the same shape as a single
 * judge backend. Returns the turns on success; returns `null` when this
 * model's output never validated (the caller falls back to the next model);
 * throws `SplitUnavailableError` on a transport, auth, or rate-limit failure
 * (the caller still falls back to the next model, but keeps the error in case
 * every model fails).
 */
async function trySplitWithModel(
  model: string,
  apiKey: string,
  basePrompt: string,
  sourceText: string,
): Promise<Turn[] | null> {
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
            json_schema: { name: "turns", strict: true, schema: TURNS_SCHEMA },
          },
        }),
      });
    } catch (err) {
      throw new SplitUnavailableError(
        "the splitting service could not be reached",
        { cause: err },
      );
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new SplitUnavailableError("the splitting service is rate limited");
      }
      if (response.status === 401 || response.status === 403) {
        throw new SplitUnavailableError(
          "the splitting service rejected the credentials",
        );
      }
      throw new SplitUnavailableError(
        `the splitting service returned an error (${response.status})`,
      );
    }

    let body: OpenRouterResponse;
    try {
      body = (await response.json()) as OpenRouterResponse;
    } catch {
      continue;
    }

    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string") continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      continue;
    }

    const raw = coerceRawTurns(parsed);
    if (raw && turnsAreVerbatim(raw, sourceText)) {
      const turns = finalizeTurns(raw);
      if (turns.length >= 2) return turns;
    }
  }

  return null;
}

/**
 * Build an OpenRouter-backed `Splitter`.
 *
 * Tries `opts.model` (else `INSTRUMENT_SPLIT_MODEL`, else
 * `google/gemini-2.5-flash-lite`) first, then falls back to `opts.backupModel`
 * (else `INSTRUMENT_SPLIT_BACKUP_MODEL`, else `openai/gpt-4o-mini`) if the
 * first model fails outright or its output never validates. The key is read
 * from `OPENROUTER_API_KEY`; its absence throws `SplitUnavailableError`
 * immediately (synchronously, from this factory) so `core.ts`'s existing
 * "no key configured" handling applies the same way.
 */
export function makeOpenRouterSplitter(opts?: {
  model?: string;
  backupModel?: string;
}): Splitter {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new SplitUnavailableError("OPENROUTER_API_KEY is not set");
  }
  const primary =
    opts?.model ?? process.env.INSTRUMENT_SPLIT_MODEL ?? DEFAULT_PRIMARY_MODEL;
  const backup =
    opts?.backupModel ??
    process.env.INSTRUMENT_SPLIT_BACKUP_MODEL ??
    DEFAULT_BACKUP_MODEL;
  const models = primary === backup ? [primary] : [primary, backup];

  return async function openRouterSplitter(text: string): Promise<Turn[]> {
    const basePrompt = buildUserPrompt(text);
    let lastError: unknown = null;

    for (const model of models) {
      try {
        const turns = await trySplitWithModel(model, apiKey, basePrompt, text);
        if (turns) return turns;
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError instanceof SplitUnavailableError) throw lastError;
    throw new SplitUnavailableError(
      "the splitting service returned output that did not match the schema",
    );
  };
}
