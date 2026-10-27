import { test } from "node:test";
import assert from "node:assert/strict";

import { POST } from "./route.ts";
import { handleSplitRequest, type CoreResult } from "./core.ts";
import { SplitUnavailableError } from "../../../../lib/instrument/llmSplit.ts";
import type { Splitter } from "../../../../lib/instrument/llmSplit.ts";
import type { Turn } from "../../../../lib/instrument/types.ts";

function turnsBody(result: CoreResult): Turn[] {
  assert.equal(result.status, 200);
  return (result.body as { turns: Turn[] }).turns;
}

test("malformed request body is rejected with 400 invalid_request", async () => {
  const response = await POST(
    new Request("http://test/api/instrument/split", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    }),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_request" });
});

test("a non-object body is rejected with 400", async () => {
  const result = await handleSplitRequest(["not", "an", "object"]);
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: "invalid_request" });
});

test("missing or empty text is rejected with 422", async () => {
  assert.equal((await handleSplitRequest({})).status, 422);
  assert.equal((await handleSplitRequest({ text: "   " })).status, 422);
  assert.equal((await handleSplitRequest({ text: 5 })).status, 422);
});

test("over-long text is rejected with 413", async () => {
  const result = await handleSplitRequest({ text: "x".repeat(60_001) });
  assert.equal(result.status, 413);
  assert.deepEqual(result.body, { error: "transcript_too_large" });
});

test("no API key configured reports 503 split_unavailable", async () => {
  const result = await handleSplitRequest(
    { text: "whatever someone pasted" },
    { apiKeyPresent: false },
  );
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { error: "split_unavailable" });
});

test("a working splitter returns 200 with the turns it produced", async () => {
  const fakeSplitter: Splitter = async () => [
    { role: "user", text: "hello there", index: 0 },
    { role: "assistant", text: "hi, how can I help", index: 1 },
  ];
  const result = await handleSplitRequest(
    { text: "Skylar Gu\nhello there\n\nClaude\nhi, how can I help" },
    { apiKeyPresent: true, makeSplitter: () => fakeSplitter },
  );
  const turns = turnsBody(result);
  assert.equal(turns.length, 2);
  assert.equal(turns[0].role, "user");
  assert.equal(turns[1].role, "assistant");
});

test("a failing splitter reports 502 split_failed", async () => {
  const failingSplitter: Splitter = async () => {
    throw new SplitUnavailableError("forced for test", {
      cause: new Error("network down"),
    });
  };
  const result = await handleSplitRequest(
    { text: "some pasted text" },
    { apiKeyPresent: true, makeSplitter: () => failingSplitter },
  );
  assert.equal(result.status, 502);
  assert.deepEqual(result.body, { error: "split_failed" });
});

test("POST end to end rejects empty text with 422", async () => {
  const response = await POST(
    new Request("http://test/api/instrument/split", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "" }),
    }),
  );
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: "invalid_transcript" });
});
