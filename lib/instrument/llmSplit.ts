/**
 * The Claude-backed LLM turn-splitter.
 *
 * `makeLlmSplitter()` returns a function that takes raw pasted conversation
 * text the deterministic heuristics in `./parsers/` could not segment, and
 * asks a smaller, cheaper model to split it into `user`/`assistant` turns.
 * This is a fallback layer only: `parseTranscript` always runs the free,
 * local, synchronous heuristics first (see `./parsers/index.ts`); the API
 * route calls this module when, and only when, those have already failed.
 *
 * It uses a smaller model than the scoring judge (`judge.ts`) on purpose —
 * this step only decides where one message ends and the next begins and
 * which side said it, it does not reason about the content.
 *
 * The prompt, schema, and raw-turns coercion (`SYSTEM_PROMPT`,
 * `buildUserPrompt`, `TURNS_SCHEMA`, `coerceRawTurns`, `RETRY_NOTE`) are
 * exported so `openrouterSplit.ts` — a cheaper, OpenAI-compatible splitter
 * backend with its own two-model fallback — can reuse them and stay
 * interchangeable behind the same `Splitter` contract.
 *
 * Like `judge.ts`, this is an enhancement, never a hard dependency: on any
 * failure — network, rate limit, auth, or output that will not parse after
 * one retry — it throws `SplitUnavailableError`. The route catches that and
 * reports the pasted text could not be split, leaving the person to label it
 * by hand instead.
 */

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import type { Turn } from "./types.ts";
import { finalizeTurns, type RawTurn } from "./parsers/shared.ts";
import { collapseWhitespace } from "./normalize.ts";

/** Smaller and cheaper than the scoring judge's default model. Overridable
 *  per call or via the environment. */
const DEFAULT_MODEL = "claude-haiku-5";

/** Splitting needs no extended thinking; this is comfortably enough for a
 *  60,000-character transcript echoed back verbatim. */
const MAX_TOKENS = 8000;

export class SplitUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "SplitUnavailableError";
  }
}

export const TURNS_SCHEMA = {
  type: "object",
  properties: {
    turns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          text: { type: "string" },
        },
        required: ["role", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["turns"],
  additionalProperties: false,
} as const;

/** Shared across splitter backends so a Claude split and an OpenRouter split
 *  read the pasted text under the same instructions. */
export const SYSTEM_PROMPT = [
  "You split a pasted AI chat conversation into an ordered list of turns. You",
  "do not summarize, translate, correct, or reword anything: every turn's text",
  "is copied verbatim, character for character, from the input. You only",
  "decide where one message ends and the next begins, and which side said",
  "it — the person ('user') or the model ('assistant'). Drop timestamps, UI",
  "chrome, speaker-name headers, and anything that is not message content.",
].join(" ");

export function buildUserPrompt(text: string): string {
  return [
    "Split the conversation below into turns, in original order. Do not force",
    "strict alternation if one side sent consecutive messages — only merge",
    "lines that genuinely belong to the same message.",
    "",
    "--- CONVERSATION ---",
    text,
  ].join("\n");
}

/** Appended to the user prompt on the one retry after unparseable output.
 *  Exported so other splitter backends (e.g. `openrouterSplit.ts`) share it. */
export const RETRY_NOTE =
  "\n\n--- NOTE ---\nYour previous reply did not parse as the required " +
  "structured object. Return only a JSON object matching the schema.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Map the parsed model output to `RawTurn[]`, or `null` when the top-level
 * shape is unusable (which triggers a retry, or a fallback to the next
 * backend).
 */
export function coerceRawTurns(parsed: unknown): RawTurn[] | null {
  if (!isRecord(parsed) || !Array.isArray(parsed.turns)) return null;
  const raw: RawTurn[] = [];
  for (const entry of parsed.turns) {
    if (!isRecord(entry)) return null;
    if (entry.role !== "user" && entry.role !== "assistant") return null;
    if (typeof entry.text !== "string") return null;
    raw.push({ role: entry.role, text: entry.text });
  }
  return raw;
}

/**
 * The splitter's anti-fabrication check, the same principle `normalize.ts`'s
 * `spanOccursInTurn` applies to a receipt: every returned turn's text must
 * occur verbatim (whitespace-collapsed) in the original pasted text. Observed
 * failure mode this catches — a model echoing its own system or user prompt
 * back as if it were a turn of the conversation, instead of only the pasted
 * text. A response that fails this is treated as malformed, the same as
 * unparseable output: the caller retries or falls back to the next backend,
 * never accepts turns whose content was not actually in what was pasted.
 */
export function turnsAreVerbatim(raw: RawTurn[], sourceText: string): boolean {
  const haystack = collapseWhitespace(sourceText);
  return raw.every((turn) => {
    const needle = collapseWhitespace(turn.text);
    return needle.length > 0 && haystack.includes(needle);
  });
}

function toSplitUnavailable(err: unknown): SplitUnavailableError {
  if (err instanceof SplitUnavailableError) return err;
  if (err instanceof Anthropic.RateLimitError) {
    return new SplitUnavailableError("the splitting service is rate limited", {
      cause: err,
    });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return new SplitUnavailableError(
      "the splitting service rejected the credentials",
      { cause: err },
    );
  }
  if (err instanceof Anthropic.APIError) {
    return new SplitUnavailableError(
      "the splitting service returned an error",
      { cause: err },
    );
  }
  return new SplitUnavailableError(
    "the splitting service could not be reached",
    { cause: err },
  );
}

export type Splitter = (text: string) => Promise<Turn[]>;

/**
 * Build an LLM-backed `Splitter`.
 *
 * The model is `opts.model`, else `process.env.INSTRUMENT_SPLIT_MODEL`, else
 * `claude-haiku-5`. Credentials are resolved by the SDK from the environment;
 * this function does not read a key directly.
 */
export function makeLlmSplitter(opts?: { model?: string }): Splitter {
  const model =
    opts?.model ?? process.env.INSTRUMENT_SPLIT_MODEL ?? DEFAULT_MODEL;
  const format = jsonSchemaOutputFormat(TURNS_SCHEMA);

  return async function llmSplitter(text: string): Promise<Turn[]> {
    const client = new Anthropic();
    const basePrompt = buildUserPrompt(text);

    let lastMalformed: unknown = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const userPrompt = attempt === 0 ? basePrompt : basePrompt + RETRY_NOTE;
      let parsed: unknown;
      try {
        const response = await client.messages.parse({
          model,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
          output_config: { format },
        });
        parsed = response.parsed_output;
      } catch (err) {
        // Transport, rate-limit, and auth failures are terminal.
        if (err instanceof Anthropic.APIError) throw toSplitUnavailable(err);
        // A non-API `AnthropicError` here is the structured-output helper
        // failing to parse the response body: treat it as malformed and let
        // the loop take its one retry.
        if (err instanceof Anthropic.AnthropicError) {
          lastMalformed = err;
          continue;
        }
        throw toSplitUnavailable(err);
      }

      const raw = coerceRawTurns(parsed);
      if (raw && turnsAreVerbatim(raw, text)) {
        const turns = finalizeTurns(raw);
        if (turns.length >= 2) return turns;
      }
      lastMalformed = parsed;
    }

    throw new SplitUnavailableError(
      "the splitting service returned output that did not match the schema",
      { cause: lastMalformed },
    );
  };
}
