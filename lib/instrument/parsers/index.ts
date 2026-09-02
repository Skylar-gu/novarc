/**
 * Transcript ingest.
 *
 * Pure functions that turn a pasted or uploaded transcript into the normalized
 * `Turn[]` the scoring core consumes. No React, no network, no filesystem. Each
 * parser returns `Turn[]` with `index` assigned from 0, or throws `ParseError`
 * with a message written for a person to read.
 *
 * Formats handled:
 *   - plain text with `You:` / `Assistant:` style markers, or blank-line blocks;
 *   - a ChatGPT export (single conversation `mapping`, or an array of them);
 *   - a Claude export (`chat_messages`, or an array of conversations);
 *   - a generic message list (`[{ role, content }]` or `{ messages: [...] }`).
 */

import type { Turn } from "../types.ts";
import {
  MAX_CHARS,
  OVERSIZE_MESSAGE,
  ParseError,
  UNRECOGNISED_MESSAGE,
} from "./shared.ts";
import { parseChatGptExport } from "./chatgpt.ts";
import { parseClaudeExport } from "./claude.ts";
import { parseGenericJson } from "./genericJson.ts";
import { parsePlainTextWithShape } from "./plainText.ts";

export { ParseError, MAX_TURNS, MAX_CHARS } from "./shared.ts";
export { parsePlainText } from "./plainText.ts";
export { parseChatGptExport } from "./chatgpt.ts";
export { parseClaudeExport } from "./claude.ts";
export { parseGenericJson } from "./genericJson.ts";

/** A short label for the route that parsed the transcript, for the input UI. */
export type TranscriptFormat =
  | "ChatGPT export"
  | "Claude export"
  | "JSON transcript"
  | "labelled text"
  | "blank-line blocks";

export interface ParsedTranscript {
  turns: Turn[];
  format: TranscriptFormat;
}

const JSON_ROUTES: ReadonlyArray<{
  format: TranscriptFormat;
  parse: (json: unknown) => Turn[];
}> = [
  { format: "ChatGPT export", parse: parseChatGptExport },
  { format: "Claude export", parse: parseClaudeExport },
  { format: "JSON transcript", parse: parseGenericJson },
];

/**
 * Detect the format and parse. If the input starts with `{` or `[`, JSON is
 * parsed and the ChatGPT, Claude, and generic routes are tried in that order —
 * the first that yields at least two turns wins. On a JSON syntax error, or
 * when no JSON route reaches two turns, parsing falls through to plain text.
 * Throws `ParseError` with the most useful message when every route fails.
 */
export function parseTranscript(input: string): ParsedTranscript {
  const trimmed = input.trim();
  if (trimmed.length === 0) throw new ParseError(UNRECOGNISED_MESSAGE);
  if (trimmed.length > MAX_CHARS) throw new ParseError(OVERSIZE_MESSAGE);

  const looksJson = trimmed[0] === "{" || trimmed[0] === "[";
  let jsonError: ParseError | null = null;

  if (looksJson) {
    let parsed: unknown;
    let jsonOk = true;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      jsonOk = false;
    }

    if (jsonOk) {
      let best: ParsedTranscript | null = null;
      for (const route of JSON_ROUTES) {
        try {
          const turns = route.parse(parsed);
          if (turns.length >= 2) return { turns, format: route.format };
          if (!best || turns.length > best.turns.length) {
            best = { turns, format: route.format };
          }
        } catch (error) {
          if (error instanceof ParseError && isOversize(error)) throw error;
          if (error instanceof ParseError && !jsonError) jsonError = error;
        }
      }
      if (best && best.turns.length >= 2) return best;
    }
  }

  try {
    const { turns, shape } = parsePlainTextWithShape(trimmed);
    return { turns, format: shape };
  } catch (error) {
    if (error instanceof ParseError && isOversize(error)) throw error;
    // Prefer a specific JSON complaint over the generic plain-text one when the
    // input clearly meant to be JSON.
    if (jsonError && looksJson) throw jsonError;
    throw error instanceof ParseError
      ? error
      : new ParseError(UNRECOGNISED_MESSAGE);
  }
}

/**
 * The mandated entry point: parse a transcript to `Turn[]` or throw
 * `ParseError`. See `parseTranscript` for the detection order; this is that
 * function without the format label.
 */
export function detectAndParse(input: string): Turn[] {
  return parseTranscript(input).turns;
}

function isOversize(error: ParseError): boolean {
  return error.message === OVERSIZE_MESSAGE;
}
