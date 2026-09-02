import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGenericJson } from "./genericJson.ts";
import { ParseError } from "./shared.ts";

test("parses a bare [{ role, content }] array", () => {
  const turns = parseGenericJson([
    { role: "user", content: "what is the failure mode here" },
    { role: "assistant", content: "a partial write left the index inconsistent" },
    { role: "user", content: "so the fix is to make the write atomic" },
  ]);

  assert.deepEqual(
    turns.map((t) => [t.role, t.index, t.text]),
    [
      ["user", 0, "what is the failure mode here"],
      ["assistant", 1, "a partial write left the index inconsistent"],
      ["user", 2, "so the fix is to make the write atomic"],
    ],
  );
});

test("parses { messages: [...] } with human/ai roles and text field", () => {
  const turns = parseGenericJson({
    messages: [
      { role: "human", text: "first" },
      { role: "ai", text: "second" },
    ],
  });
  assert.deepEqual(
    turns.map((t) => t.role),
    ["user", "assistant"],
  );
});

test("skips messages whose role is not recognised", () => {
  const turns = parseGenericJson([
    { role: "system", content: "you are a helpful assistant" },
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi" },
  ]);
  assert.equal(turns.length, 2);
});

test("rejects JSON that is not a message list", () => {
  assert.throws(() => parseGenericJson({ foo: "bar" }), ParseError);
  assert.throws(() => parseGenericJson([{ a: 1 }, { b: 2 }]), ParseError);
});
