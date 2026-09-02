/**
 * Shared plumbing for the transcript parsers.
 *
 * Every parser in this directory is a pure function: no React, no network, no
 * filesystem. Each turns some external transcript representation into the
 * normalized `Turn[]` the scoring core expects, or throws `ParseError` with a
 * message written to be shown to a person.
 */

import type { Turn } from "../types.ts";

/** The size the prototype will parse. Not a product limit, a guard rail. */
export const MAX_TURNS = 200;
export const MAX_CHARS = 60_000;

/** Shown when either guard trips. */
export const OVERSIZE_MESSAGE =
  "This transcript is larger than the prototype accepts. Shorten it to " +
  "about 200 messages or 60,000 characters and try again.";

/** Shown when nothing usable was found by any route. */
export const UNRECOGNISED_MESSAGE =
  "Could not tell the two sides of the conversation apart. Label them with " +
  "'You:' and 'Assistant:' or separate each message with a blank line.";

/**
 * A parse failure carrying a human-readable reason. The UI renders `message`
 * directly, so it must read as a sentence, not a stack-trace fragment.
 */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/** One turn before whitespace normalisation and indexing. */
export interface RawTurn {
  role: "user" | "assistant";
  text: string;
}

/** Normalise CR/LF and collapse any run of three or more newlines to two. */
function collapseNewlines(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * Clean, drop, merge, and index a list of raw turns:
 *   - collapse 3+ newlines, trim each turn;
 *   - drop turns that are empty after trimming;
 *   - merge consecutive turns that share a role (a split assistant message, two
 *     `You:` lines in a row) into one;
 *   - assign `index` sequentially from 0.
 *
 * Throws `ParseError` if the result exceeds either size guard.
 */
export function finalizeTurns(raw: RawTurn[]): Turn[] {
  const merged: RawTurn[] = [];
  for (const entry of raw) {
    const text = collapseNewlines(entry.text).trim();
    if (text.length === 0) continue;
    const last = merged[merged.length - 1];
    if (last && last.role === entry.role) {
      last.text = `${last.text}\n\n${text}`;
    } else {
      merged.push({ role: entry.role, text });
    }
  }

  if (merged.length > MAX_TURNS) throw new ParseError(OVERSIZE_MESSAGE);

  const totalChars = merged.reduce((sum, t) => sum + t.text.length, 0);
  if (totalChars > MAX_CHARS) throw new ParseError(OVERSIZE_MESSAGE);

  return merged.map((entry, index) => ({
    role: entry.role,
    text: entry.text,
    index,
  }));
}

/** True when `value` is a non-null object (and not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Best-effort text extraction from the many content shapes exports use:
 *   - a plain string;
 *   - an array of strings and/or `{ text }` / `{ type, text }` blocks;
 *   - a single `{ text }` block.
 * Anything else yields the empty string, which `finalizeTurns` then drops.
 */
export function extractText(value: unknown): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((part) => {
        if (typeof part === "string") return part;
        if (isRecord(part) && typeof part.text === "string") return part.text;
        return "";
      })
      .filter((part) => part.length > 0)
      .join("\n");
  }

  if (isRecord(value) && typeof value.text === "string") return value.text;

  return "";
}

/**
 * Normalise a free-form role token to the two roles the core knows, or `null`
 * for a role that should be skipped (`system`, `tool`, anything unexpected).
 */
export function normaliseRole(role: unknown): "user" | "assistant" | null {
  if (typeof role !== "string") return null;
  const key = role.trim().toLowerCase();
  if (key === "user" || key === "human" || key === "customer") return "user";
  if (key === "assistant" || key === "ai" || key === "bot" || key === "model") {
    return "assistant";
  }
  return null;
}
