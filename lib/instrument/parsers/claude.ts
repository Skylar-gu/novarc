/**
 * Claude export parsing.
 *
 * Handles a single conversation — `{ chat_messages: [{ sender, text | content }] }`
 * where `sender` is `"human"` or `"assistant"` — and an array of such
 * conversations, taking the first. `human` maps to `user`. Messages with no
 * text are skipped.
 */

import type { Turn } from "../types.ts";
import {
  ParseError,
  extractText,
  finalizeTurns,
  isRecord,
  type RawTurn,
} from "./shared.ts";

const NOT_CLAUDE =
  "This does not look like a Claude export. Expected an object with " +
  "'chat_messages', or a list of conversations.";

export function parseClaudeExport(json: unknown): Turn[] {
  const conversation = firstConversation(json);
  const messages = conversation.chat_messages;
  if (!Array.isArray(messages)) throw new ParseError(NOT_CLAUDE);

  const raw: RawTurn[] = [];
  for (const message of messages) {
    const turn = messageToTurn(message);
    if (turn) raw.push(turn);
  }

  if (raw.length === 0) {
    throw new ParseError(
      "This Claude export contains no human or assistant messages.",
    );
  }

  return finalizeTurns(raw);
}

function firstConversation(json: unknown): Record<string, unknown> {
  if (Array.isArray(json)) {
    if (json.length === 0) {
      throw new ParseError("This Claude export contains no conversations.");
    }
    const first = json[0];
    if (!isRecord(first)) throw new ParseError(NOT_CLAUDE);
    return first;
  }
  if (!isRecord(json) || !("chat_messages" in json)) {
    throw new ParseError(NOT_CLAUDE);
  }
  return json;
}

function messageToTurn(message: unknown): RawTurn | null {
  if (!isRecord(message)) return null;

  const sender =
    typeof message.sender === "string"
      ? message.sender.trim().toLowerCase()
      : "";
  const role: "user" | "assistant" | null =
    sender === "human" || sender === "user"
      ? "user"
      : sender === "assistant"
        ? "assistant"
        : null;
  if (!role) return null;

  let text = extractText(message.text);
  if (text.trim().length === 0) text = extractText(message.content);

  text = text.trim();
  if (text.length === 0) return null;

  return { role, text };
}
