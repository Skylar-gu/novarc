import { test } from "node:test";
import assert from "node:assert/strict";

import { cleanUserText, parseSession } from "./parseSession.ts";

/** Build a `.jsonl` body from event objects. */
function jsonl(...events: unknown[]): string {
  return events.map((e) => JSON.stringify(e)).join("\n") + "\n";
}

const userStr = (content: string, extra: Record<string, unknown> = {}) => ({
  type: "user",
  message: { role: "user", content },
  ...extra,
});
const asst = (blocks: unknown[]) => ({
  type: "assistant",
  message: { role: "assistant", content: blocks },
});

test("plain user + assistant text become two turns", () => {
  const turns = parseSession(
    jsonl(
      userStr("what indexes should orders_v2 have?"),
      asst([{ type: "text", text: "Depends on the read patterns." }]),
    ),
  );
  assert.deepEqual(turns, [
    { role: "user", text: "what indexes should orders_v2 have?", index: 0 },
    { role: "assistant", text: "Depends on the read patterns.", index: 1 },
  ]);
});

test("assistant thinking and tool_use blocks are dropped, text kept", () => {
  const turns = parseSession(
    jsonl(
      userStr("go"),
      asst([
        { type: "thinking", thinking: "hmm" },
        { type: "text", text: "Here is the plan." },
        { type: "tool_use", name: "Bash", input: {} },
      ]),
    ),
  );
  assert.equal(turns[1].text, "Here is the plan.");
});

test("a tool result echoed as a user turn is ignored", () => {
  const turns = parseSession(
    jsonl(
      userStr("run the tests"),
      asst([{ type: "text", text: "Running." }]),
      {
        type: "user",
        toolUseResult: { stdout: "ok" },
        message: {
          role: "user",
          content: [{ type: "tool_result", content: "ok", is_error: false }],
        },
      },
      userStr("thanks, now ship it"),
    ),
  );
  assert.deepEqual(
    turns.map((t) => t.role),
    ["user", "assistant", "user"],
  );
  assert.equal(turns[2].text, "thanks, now ship it");
});

test("meta and compact-summary user turns are skipped", () => {
  const turns = parseSession(
    jsonl(
      userStr("<command-name>/login</command-name>", { isMeta: true }),
      userStr("This session is being continued…", { isCompactSummary: true }),
      userStr("real question here"),
    ),
  );
  assert.equal(turns.length, 1);
  assert.equal(turns[0].text, "real question here");
});

test("injected wrappers are stripped from user text", () => {
  const turns = parseSession(
    jsonl(
      userStr(
        "real ask <system-reminder>you are being watched</system-reminder> end",
      ),
    ),
  );
  assert.equal(turns[0].text, "real ask end");
});

test("a user turn that is only a wrapper is skipped entirely", () => {
  const turns = parseSession(
    jsonl(
      userStr("<system-reminder>noise</system-reminder>"),
      userStr("[Request interrupted by user]"),
      userStr("kept"),
    ),
  );
  assert.deepEqual(turns.map((t) => t.text), ["kept"]);
});

test("sidechain (subagent) events are excluded", () => {
  const turns = parseSession(
    jsonl(
      userStr("main question"),
      { ...userStr("subagent prompt"), isSidechain: true },
      { ...asst([{ type: "text", text: "subagent reply" }]), isSidechain: true },
      asst([{ type: "text", text: "main reply" }]),
    ),
  );
  assert.deepEqual(
    turns.map((t) => t.text),
    ["main question", "main reply"],
  );
});

test("consecutive same-role turns are merged", () => {
  const turns = parseSession(
    jsonl(
      userStr("first"),
      userStr("second"),
      asst([{ type: "text", text: "a" }]),
      asst([{ type: "text", text: "b" }]),
    ),
  );
  assert.deepEqual(turns, [
    { role: "user", text: "first\n\nsecond", index: 0 },
    { role: "assistant", text: "a\n\nb", index: 1 },
  ]);
});

test("non-JSON lines are skipped, not fatal", () => {
  const body =
    JSON.stringify(userStr("hi")) +
    "\n{ this is not json\n" +
    JSON.stringify(asst([{ type: "text", text: "yo" }])) +
    "\n";
  const turns = parseSession(body);
  assert.equal(turns.length, 2);
});

test("cleanUserText collapses whitespace and drops command blocks", () => {
  assert.equal(
    cleanUserText("a\n\n  b <command-message>/x</command-message> c"),
    "a b c",
  );
});
