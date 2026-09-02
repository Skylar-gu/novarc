/**
 * Plain-text transcript parsing.
 *
 * Two heuristics, tried in priority order:
 *   1. Explicit role markers at the start of a line (`You:`, `Assistant:`, and
 *      the common variants). Everything under a marker, until the next marker,
 *      belongs to that turn.
 *   2. Failing that, blocks separated by a blank line, assigned alternating
 *      roles starting with the user.
 *
 * A transcript that yields fewer than two turns either way is rejected with a
 * message telling the person how to label it.
 */

import type { Turn } from "../types.ts";
import {
  MAX_CHARS,
  OVERSIZE_MESSAGE,
  ParseError,
  UNRECOGNISED_MESSAGE,
  finalizeTurns,
  type RawTurn,
} from "./shared.ts";

/** Which plain-text heuristic produced the turns. */
export type PlainTextShape = "labelled text" | "blank-line blocks";

/** Line-leading role marker. Case-insensitive; an optional single space or tab
 *  may follow the colon before the message text. */
const MARKER_RE =
  /^[ \t]*(you|me|user|human|assistant|ai|chatgpt|claude|gemini)[ \t]*:[ \t]?/i;

const USER_MARKERS = new Set(["you", "me", "user", "human"]);

function markerRole(token: string): "user" | "assistant" {
  return USER_MARKERS.has(token.toLowerCase()) ? "user" : "assistant";
}

/** `parsePlainText` plus the heuristic it used, for the input UI's format hint. */
export function parsePlainTextWithShape(input: string): {
  turns: Turn[];
  shape: PlainTextShape;
} {
  if (input.length > MAX_CHARS) throw new ParseError(OVERSIZE_MESSAGE);

  const text = input.replace(/\r\n?/g, "\n").trim();
  if (text.length === 0) throw new ParseError(UNRECOGNISED_MESSAGE);

  const marked = parseByMarkers(text);
  if (marked) return { turns: requireExchange(marked), shape: "labelled text" };

  const blocked = parseByBlankLines(text);
  return { turns: requireExchange(blocked), shape: "blank-line blocks" };
}

/**
 * Turn a pasted plain-text conversation into `Turn[]`. See the module comment
 * for the heuristics; throws `ParseError` when the two sides cannot be told
 * apart or too few turns survive.
 */
export function parsePlainText(input: string): Turn[] {
  return parsePlainTextWithShape(input).turns;
}

/**
 * Marker heuristic. Returns `null` unless the text is a genuine two-sided
 * labelled exchange — at least two marker lines covering both roles. A lone
 * line that happens to start with `ai:` or `me:` inside an otherwise
 * blank-line-separated transcript does not count, and the blank-line heuristic
 * gets its turn instead.
 */
function parseByMarkers(text: string): RawTurn[] | null {
  const lines = text.split("\n");

  const raw: RawTurn[] = [];
  let current: RawTurn | null = null;

  for (const line of lines) {
    const match = line.match(MARKER_RE);
    if (match) {
      current = { role: markerRole(match[1]), text: line.slice(match[0].length) };
      raw.push(current);
    } else if (current) {
      current.text += `\n${line}`;
    }
    // A line before the first marker is preamble; drop it.
  }

  if (raw.length < 2) return null;
  const hasUser = raw.some((t) => t.role === "user");
  const hasAssistant = raw.some((t) => t.role === "assistant");
  if (!hasUser || !hasAssistant) return null;

  return raw;
}

/** Blank-line heuristic: alternating roles, user first. */
function parseByBlankLines(text: string): RawTurn[] {
  const blocks = text
    .split(/\n[ \t]*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  if (blocks.length < 2) throw new ParseError(UNRECOGNISED_MESSAGE);

  return blocks.map((block, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    text: block,
  }));
}

function requireExchange(raw: RawTurn[]): Turn[] {
  const turns = finalizeTurns(raw);
  if (turns.length < 2) throw new ParseError(UNRECOGNISED_MESSAGE);
  return turns;
}
