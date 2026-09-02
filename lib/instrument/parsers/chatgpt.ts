/**
 * ChatGPT export parsing.
 *
 * Handles the single-conversation object — `{ title?, mapping, ... }` where
 * `mapping` is a map of node id to `{ id, message, parent, children }` — and an
 * array of such objects (the `conversations.json` file), taking the first.
 *
 * Message order: when every message node carries a numeric `create_time`, nodes
 * are sorted by it; otherwise the `children` tree is walked from its root(s).
 * `system` and `tool` messages are skipped, as are messages with no text.
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

interface MappingNode {
  id?: string;
  parent?: string | null;
  children?: string[];
  message?: unknown;
}

const NOT_CHATGPT =
  "This does not look like a ChatGPT export. Expected an object with a " +
  "'mapping', or a list of conversations.";

export function parseChatGptExport(json: unknown): Turn[] {
  const conversation = firstConversation(json);
  const mapping = conversation.mapping;
  if (!isRecord(mapping)) throw new ParseError(NOT_CHATGPT);

  const nodes = new Map<string, MappingNode>();
  for (const [id, value] of Object.entries(mapping)) {
    if (isRecord(value)) nodes.set(id, value as MappingNode);
  }
  if (nodes.size === 0) throw new ParseError(NOT_CHATGPT);

  const raw: RawTurn[] = [];
  for (const node of orderNodes(nodes)) {
    const turn = nodeToTurn(node.message);
    if (turn) raw.push(turn);
  }

  if (raw.length === 0) {
    throw new ParseError(
      "This ChatGPT export contains no user or assistant messages.",
    );
  }

  return finalizeTurns(raw);
}

function firstConversation(json: unknown): Record<string, unknown> {
  if (Array.isArray(json)) {
    if (json.length === 0) {
      throw new ParseError("This ChatGPT export contains no conversations.");
    }
    const first = json[0];
    if (!isRecord(first) || !("mapping" in first)) {
      throw new ParseError(NOT_CHATGPT);
    }
    return first;
  }
  if (!isRecord(json) || !("mapping" in json)) {
    throw new ParseError(NOT_CHATGPT);
  }
  return json;
}

/** Message nodes in conversation order. */
function orderNodes(nodes: Map<string, MappingNode>): MappingNode[] {
  const withMessage = [...nodes.values()].filter((n) => isRecord(n.message));

  const allTimed =
    withMessage.length > 0 &&
    withMessage.every(
      (n) =>
        typeof (n.message as Record<string, unknown>).create_time === "number",
    );
  if (allTimed) {
    return [...withMessage].sort((a, b) => createTime(a) - createTime(b));
  }

  const walked = walkTree(nodes);
  return walked.length > 0 ? walked : withMessage;
}

/** Depth-first from every parent-less (or dangling-parent) root, in order. */
function walkTree(nodes: Map<string, MappingNode>): MappingNode[] {
  const roots: string[] = [];
  for (const [id, node] of nodes) {
    if (node.parent == null || !nodes.has(node.parent)) roots.push(id);
  }

  const out: MappingNode[] = [];
  const seen = new Set<string>();
  const stack = [...roots];
  while (stack.length > 0) {
    const id = stack.shift() as string;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = nodes.get(id);
    if (!node) continue;
    out.push(node);
    const children = Array.isArray(node.children) ? node.children : [];
    stack.unshift(...children);
  }

  return out;
}

function createTime(node: MappingNode): number {
  const message = node.message;
  if (isRecord(message) && typeof message.create_time === "number") {
    return message.create_time;
  }
  return Number.POSITIVE_INFINITY;
}

function nodeToTurn(message: unknown): RawTurn | null {
  if (!isRecord(message)) return null;

  const author = isRecord(message.author) ? message.author.role : undefined;
  const role = normaliseRole(author);
  if (!role) return null;

  const content = message.content;
  const text = isRecord(content)
    ? extractText(content.parts ?? content.text ?? content)
    : extractText(content);

  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  return { role, text: trimmed };
}
