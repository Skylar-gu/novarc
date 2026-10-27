/**
 * Plain-text transcript parsing.
 *
 * Three heuristics, tried in priority order:
 *   1. Explicit role markers at the start of a line (`You:`, `Assistant:`, and
 *      the common variants). Everything under a marker, until the next marker,
 *      belongs to that turn.
 *   2. Bare speaker-name lines with no colon — the shape a chat UI produces
 *      when its own transcript is copied straight out: the model's name and
 *      the person's own account name sit on their own line above each
 *      message. Anchored on a recognized model name; whatever other short
 *      line recurs in the same way is taken as the person's turns.
 *   3. Failing that, blocks separated by a blank line, assigned alternating
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

/** Model display names a chat UI inserts above its own messages when a
 *  conversation is copied straight off the page, with no colon attached. */
const AI_NAME_LINES = new Set([
  "claude", "chatgpt", "gpt", "gpt-4", "gpt-4o", "gpt-5", "gpt-5.1",
  "gemini", "bard", "copilot", "microsoft copilot", "assistant", "ai",
  "meta ai", "llama", "grok", "deepseek", "mistral", "mistral ai", "pi",
  "perplexity",
]);

function isAiNameLine(trimmed: string): boolean {
  return AI_NAME_LINES.has(trimmed.toLowerCase());
}

/** A line reads as a bare speaker label — short, not a sentence — rather than
 *  message content. */
function isLabelCandidate(trimmed: string): boolean {
  if (trimmed.length === 0 || trimmed.length > 50) return false;
  if (trimmed.split(/\s+/).length > 6) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  return true;
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

  const named = parseByNameLines(text);
  if (named) return { turns: requireExchange(named), shape: "labelled text" };

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

/**
 * Bare-name heuristic. Returns `null` unless a recognized model name turns up
 * as its own line — the anchor that tells this apart from ordinary prose.
 * The person's label is whatever other short line recurs most often; it is
 * never assumed to read "You" or "Human".
 */
function parseByNameLines(text: string): RawTurn[] | null {
  const lines = text.split("\n");

  const hasAiLine = lines.some((line) => isAiNameLine(line.trim()));
  if (!hasAiLine) return null;

  const counts = new Map<string, number>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (isAiNameLine(trimmed) || !isLabelCandidate(trimmed)) continue;
    const key = trimmed.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let userLabel: string | null = null;
  let best = 0;
  for (const [key, count] of counts) {
    if (count > best) {
      best = count;
      userLabel = key;
    }
  }
  if (!userLabel) return null;

  const raw: RawTurn[] = [];
  let current: RawTurn | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (isAiNameLine(trimmed)) {
      current = { role: "assistant", text: "" };
      raw.push(current);
    } else if (trimmed.toLowerCase() === userLabel) {
      current = { role: "user", text: "" };
      raw.push(current);
    } else if (current) {
      current.text += current.text.length > 0 ? `\n${line}` : line;
    }
    // A line before the first marker is preamble; dropped, as in parseByMarkers.
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
