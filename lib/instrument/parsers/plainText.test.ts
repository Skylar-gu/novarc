import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlainText, parsePlainTextWithShape } from "./plainText.ts";
import { ParseError } from "./shared.ts";

test("splits on You: / Assistant: markers and indexes from 0", () => {
  const turns = parsePlainText(
    [
      "You: I want to move sessions to Redis.",
      "Assistant: Confirm the mechanism before switching stores.",
      "You: Fair. What test would tell me it is lock contention?",
    ].join("\n"),
  );

  assert.deepEqual(turns, [
    { role: "user", text: "I want to move sessions to Redis.", index: 0 },
    {
      role: "assistant",
      text: "Confirm the mechanism before switching stores.",
      index: 1,
    },
    {
      role: "user",
      text: "Fair. What test would tell me it is lock contention?",
      index: 2,
    },
  ]);
});

test("lines under one marker join into that turn", () => {
  const turns = parsePlainText(
    [
      "You: first thought",
      "second thought on the same turn",
      "AI: a reply",
    ].join("\n"),
  );

  assert.equal(turns.length, 2);
  assert.equal(turns[0].text, "first thought\nsecond thought on the same turn");
});

test("recognises Human: and AI: markers (case-insensitive)", () => {
  const turns = parsePlainText("human: what breaks here\nai: the retry loop");
  assert.deepEqual(
    turns.map((t) => t.role),
    ["user", "assistant"],
  );
  assert.equal(
    parsePlainTextWithShape("Me: hi\nClaude: hello").shape,
    "labelled text",
  );
});

test("markers in the middle of a line do not start a new turn", () => {
  const turns = parsePlainText(
    [
      "You: I told them You: stop and they did not",
      "Assistant: noted, the embedded marker is literal text",
    ].join("\n"),
  );

  assert.equal(turns.length, 2);
  assert.equal(turns[0].text, "I told them You: stop and they did not");
});

test("blank-line blocks alternate starting with the user", () => {
  const result = parsePlainTextWithShape(
    "What is causing the p99 spike?\n\nLikely lock contention on refresh.\n\nHow do I confirm that?",
  );

  assert.equal(result.shape, "blank-line blocks");
  assert.deepEqual(
    result.turns.map((t) => [t.role, t.index]),
    [
      ["user", 0],
      ["assistant", 1],
      ["user", 2],
    ],
  );
});

test("collapses three or more newlines within a turn", () => {
  const turns = parsePlainText(
    "You: line one\n\n\n\nline two\n\nAssistant: ok",
  );
  assert.equal(turns[0].text, "line one\n\nline two");
});

test("an unlabelled single block is rejected", () => {
  assert.throws(
    () => parsePlainText("just one wall of text with no structure at all"),
    (error: unknown) => error instanceof ParseError,
  );
});

test("a single marker (one side only) is rejected", () => {
  assert.throws(
    () => parsePlainText("You: only my side is here\nand a follow-on line"),
    ParseError,
  );
});
