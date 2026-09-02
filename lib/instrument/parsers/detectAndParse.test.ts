import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { detectAndParse, parseTranscript } from "./index.ts";
import { ParseError, MAX_CHARS } from "./shared.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const read = (name: string) =>
  readFileSync(join(HERE, "fixtures", name), "utf8");

test("routes a ChatGPT export to the ChatGPT parser", () => {
  const result = parseTranscript(read("chatgpt-export.json"));
  assert.equal(result.format, "ChatGPT export");
  assert.equal(result.turns.length, 4);
});

test("routes a Claude export to the Claude parser", () => {
  const result = parseTranscript(read("claude-export.json"));
  assert.equal(result.format, "Claude export");
  assert.equal(result.turns.length, 4);
});

test("routes a generic message list to the JSON transcript parser", () => {
  const result = parseTranscript(
    JSON.stringify([
      { role: "user", content: "a first substantive message here" },
      { role: "assistant", content: "a first substantive reply here" },
    ]),
  );
  assert.equal(result.format, "JSON transcript");
  assert.equal(result.turns.length, 2);
});

test("routes labelled plain text to the plain-text parser", () => {
  const result = parseTranscript("You: hello there\nAssistant: hello back");
  assert.equal(result.format, "labelled text");
  assert.equal(result.turns.length, 2);
});

test("falls through to plain text when the input is not JSON", () => {
  const turns = detectAndParse(
    "First message from the person.\n\nReply from the model.\n\nSecond message.",
  );
  assert.equal(turns.length, 3);
  assert.equal(turns[0].role, "user");
});

test("falls through to plain text on a JSON syntax error", () => {
  // Starts with '{' but is not valid JSON; the labelled text still parses.
  const turns = detectAndParse(
    "{ this was meant to be json\nYou: but it is really a transcript\nAssistant: understood",
  );
  assert.equal(turns.length, 2);
  assert.equal(turns[0].role, "user");
});

test("oversized input throws ParseError", () => {
  const huge = "You: " + "word ".repeat(MAX_CHARS) + "\nAssistant: ok";
  assert.throws(
    () => detectAndParse(huge),
    (error: unknown) =>
      error instanceof ParseError &&
      /larger than the prototype/.test(error.message),
  );
});

test("empty input throws ParseError", () => {
  assert.throws(() => detectAndParse("   \n  "), ParseError);
});
