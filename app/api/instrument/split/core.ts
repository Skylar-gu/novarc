/**
 * The turn-splitting route's core, factored out of `route.ts` so it can be
 * tested without a running server, an API key, or the network.
 *
 * This is the fallback layer behind the free, local heuristics in
 * `lib/instrument/parsers/`: the client calls this only after those have
 * already failed to tell the two sides of a pasted conversation apart. A
 * smaller model reads the raw text once and returns it split into turns.
 * Nothing here persists anything, and the text is never echoed back beyond
 * the turns derived from it.
 *
 * Two splitter backends share the same `Splitter` contract: `OPENROUTER_API_KEY`
 * selects the OpenRouter splitter (`openrouterSplit.ts`, primary
 * `google/gemini-2.5-flash-lite` with `openai/gpt-4o-mini` as a backup model);
 * otherwise `ANTHROPIC_API_KEY` selects the Claude splitter (`llmSplit.ts`).
 * Neither is a hard dependency — either one's absence or failure reports the
 * transcript could not be split.
 */

import {
  makeLlmSplitter,
  SplitUnavailableError,
  type Splitter,
} from "../../../../lib/instrument/llmSplit.ts";
import { makeOpenRouterSplitter } from "../../../../lib/instrument/openrouterSplit.ts";
import {
  MAX_CHARS,
  ParseError,
} from "../../../../lib/instrument/parsers/shared.ts";
import type { Turn } from "../../../../lib/instrument/types.ts";

export type ErrorCode =
  | "invalid_request"
  | "invalid_transcript"
  | "transcript_too_large"
  | "split_unavailable"
  | "split_failed";

export interface CoreResult {
  status: number;
  /** Either `{ turns: Turn[] }` (200) or `{ error: ErrorCode }`. */
  body: { turns: Turn[] } | { error: ErrorCode };
}

/** Injection points for tests. Production supplies neither. */
export interface SplitDeps {
  /** Overrides whether `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` is present. */
  apiKeyPresent?: boolean;
  /** Overrides the real LLM splitter factory. */
  makeSplitter?: () => Splitter;
}

function errorResult(status: number, error: ErrorCode): CoreResult {
  return { status, body: { error } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function handleSplitRequest(
  body: unknown,
  deps: SplitDeps = {},
): Promise<CoreResult> {
  if (!isRecord(body)) return errorResult(400, "invalid_request");

  const text = (body as { text?: unknown }).text;
  if (typeof text !== "string" || text.trim().length === 0) {
    return errorResult(422, "invalid_transcript");
  }
  if (text.length > MAX_CHARS) {
    return errorResult(413, "transcript_too_large");
  }

  const apiKeyPresent =
    deps.apiKeyPresent ??
    Boolean(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY);
  if (!apiKeyPresent) return errorResult(503, "split_unavailable");

  const makeSplitter =
    deps.makeSplitter ??
    (() =>
      process.env.OPENROUTER_API_KEY
        ? makeOpenRouterSplitter()
        : makeLlmSplitter());

  try {
    const turns = await makeSplitter()(text);
    return { status: 200, body: { turns } };
  } catch (err) {
    if (err instanceof ParseError) return errorResult(413, "transcript_too_large");
    if (err instanceof SplitUnavailableError) return errorResult(502, "split_failed");
    return errorResult(502, "split_failed");
  }
}
