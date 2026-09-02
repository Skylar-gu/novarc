import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseClaudeExport } from "./claude.ts";
import { ParseError } from "./shared.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const exportFixture = JSON.parse(
  readFileSync(join(HERE, "fixtures/claude-export.json"), "utf8"),
) as unknown;

test("maps human -> user and keeps chat_messages order", () => {
  const turns = parseClaudeExport(exportFixture);

  assert.equal(turns.length, 4);
  assert.deepEqual(
    turns.map((t) => [t.role, t.index]),
    [
      ["user", 0],
      ["assistant", 1],
      ["user", 2],
      ["assistant", 3],
    ],
  );
  assert.match(turns[0].text, /^Where should the rate limiter live/);
});

test("reads text from a content block array when top-level text is absent", () => {
  const turns = parseClaudeExport({
    chat_messages: [
      {
        sender: "human",
        content: [{ type: "text", text: "block form question" }],
      },
      {
        sender: "assistant",
        content: [{ type: "text", text: "block form answer" }],
      },
    ],
  });
  assert.deepEqual(
    turns.map((t) => t.text),
    ["block form question", "block form answer"],
  );
});

test("accepts an array of conversations, taking the first", () => {
  const turns = parseClaudeExport([exportFixture, { chat_messages: [] }]);
  assert.equal(turns.length, 4);
});

test("skips empty messages", () => {
  const turns = parseClaudeExport({
    chat_messages: [
      { sender: "human", text: "real question" },
      { sender: "assistant", text: "   " },
      { sender: "assistant", text: "real answer" },
    ],
  });
  assert.equal(turns.length, 2);
  assert.deepEqual(
    turns.map((t) => t.role),
    ["user", "assistant"],
  );
});

test("rejects an object with no chat_messages", () => {
  assert.throws(() => parseClaudeExport({ messages: [] }), ParseError);
});
