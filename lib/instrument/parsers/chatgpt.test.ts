import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseChatGptExport } from "./chatgpt.ts";
import { ParseError } from "./shared.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const exportFixture = JSON.parse(
  readFileSync(join(HERE, "fixtures/chatgpt-export.json"), "utf8"),
) as unknown;

test("parses a single-conversation mapping in tree order, skipping system", () => {
  const turns = parseChatGptExport(exportFixture);

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
  assert.match(turns[0].text, /^I need to pick an eviction policy/);
  assert.match(turns[3].text, /keep LRU unless the plot/);
});

test("accepts the array-wrapped (conversations.json) form, taking the first", () => {
  const turns = parseChatGptExport([exportFixture, { mapping: {} }]);
  assert.equal(turns.length, 4);
  assert.equal(turns[0].role, "user");
});

test("orders by create_time when the tree cannot be walked", () => {
  const flat = {
    mapping: {
      b: {
        id: "b",
        parent: "x",
        children: [],
        message: {
          author: { role: "assistant" },
          create_time: 200,
          content: { content_type: "text", parts: ["second"] },
        },
      },
      a: {
        id: "a",
        parent: "x",
        children: [],
        message: {
          author: { role: "user" },
          create_time: 100,
          content: { content_type: "text", parts: ["first"] },
        },
      },
    },
  };

  const turns = parseChatGptExport(flat);
  assert.deepEqual(
    turns.map((t) => t.text),
    ["first", "second"],
  );
});

test("rejects an object with no mapping", () => {
  assert.throws(() => parseChatGptExport({ title: "x" }), ParseError);
});

test("rejects an empty conversation array", () => {
  assert.throws(() => parseChatGptExport([]), ParseError);
});
