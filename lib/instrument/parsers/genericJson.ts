/**
 * Generic JSON transcript parsing.
 *
 * Accepts either a bare array of messages or `{ messages: [...] }`. Each message
 * carries a `role` (`user` / `assistant` / `human` / `ai`, normalised) and its
 * text under `content` or `text`. Messages with an unrecognised role are
 * skipped; a shape that is not a message list is rejected.
 */

import type { Turn } from "../types.ts";
import {
  ParseError,
  extractText,
  finalizeTurns,
  isRecord,
  normaliseRole,
  type RawTurn,
} from "./shared.ts";

const NOT_GENERIC =
  "This JSON is not a transcript. Expected a list of messages, each with a " +
  "'role' and 'content'.";

export function parseGenericJson(json: unknown): Turn[] {
  const messages = messageList(json);

  const raw: RawTurn[] = [];
  for (const message of messages) {
    if (!isRecord(message)) continue;
    const role = normaliseRole(message.role ?? message.sender ?? message.from);
    if (!role) continue;
    const text = extractText(
      message.content ?? message.text ?? message.message,
    ).trim();
    if (text.length === 0) continue;
    raw.push({ role, text });
  }

  if (raw.length === 0) throw new ParseError(NOT_GENERIC);

  return finalizeTurns(raw);
}

function messageList(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (isRecord(json)) {
    if (Array.isArray(json.messages)) return json.messages;
    if (Array.isArray(json.conversation)) return json.conversation;
    if (Array.isArray(json.turns)) return json.turns;
  }
  throw new ParseError(NOT_GENERIC);
}
