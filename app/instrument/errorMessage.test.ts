import { test } from "node:test";
import assert from "node:assert/strict";

import {
  NETWORK_ERROR,
  scoreErrorMessage,
} from "../../components/instrument/errorMessage.ts";

test("each documented error code maps to a distinct non-empty message", () => {
  const codes = [
    "invalid_request",
    "invalid_transcript",
    "transcript_too_large",
    "rate_limited",
    "scoring_failed",
  ] as const;
  const seen = new Set<string>();
  for (const code of codes) {
    const message = scoreErrorMessage(code, 400);
    assert.ok(message.length > 0);
    assert.ok(!message.includes("!"));
    seen.add(message);
  }
  assert.equal(seen.size, codes.length);
});

test("429 without a usable code still yields the rate-limit wording", () => {
  const message = scoreErrorMessage(undefined, 429);
  assert.match(message, /faster than the prototype allows/);
});

test("the body code wins over the status", () => {
  assert.equal(
    scoreErrorMessage("rate_limited", 500),
    scoreErrorMessage("rate_limited", 429),
  );
});

test("an unknown code with a 5xx status degrades to the scoring-failed line", () => {
  assert.equal(
    scoreErrorMessage("something_new", 503),
    scoreErrorMessage("scoring_failed", 500),
  );
});

test("an unknown code with an unmapped 4xx status returns a generic line", () => {
  const message = scoreErrorMessage(null, 418);
  assert.ok(message.length > 0);
  assert.match(message, /try again/i);
});

test("NETWORK_ERROR is a plain sentence", () => {
  assert.ok(NETWORK_ERROR.length > 0);
  assert.ok(!NETWORK_ERROR.includes("!"));
});
