import { test } from "node:test";
import assert from "node:assert/strict";

import { POST } from "./route.ts";
import {
  handleScoreRequest,
  MAX_TURNS,
  type CoreResult,
} from "./core.ts";
import { JudgeUnavailableError } from "../../../../lib/instrument/judge.ts";
import type { Judge } from "../../../../lib/instrument/score.ts";
import type { RawScore, ScoreResult } from "../../../../lib/instrument/types.ts";
import { fixture } from "../../../../lib/instrument/fixtures/index.ts";

const FIXED_CLOCK = () => new Date("2026-03-01T00:00:00.000Z");
const rich = fixture("rich-reasoning");

/** Every scoring path must return exactly the §2 contract shape. */
function assertContractShape(body: ScoreResult): void {
  assert.equal(typeof body.scored, "boolean");
  assert.ok(body.reasonIfUnscored === null || typeof body.reasonIfUnscored === "string");
  assert.ok(body.load === null || typeof body.load.value === "number");
  assert.ok(body.rigor === null || typeof body.rigor.value === "number");
  assert.equal(body.drift, null);
  assert.equal(typeof body.coached, "boolean");
  assert.ok(body.engineMode === "heuristic" || body.engineMode === "llm");
  assert.equal(typeof body.scoredAt, "string");
}

function scoreBody(result: CoreResult): ScoreResult {
  assert.equal(result.status, 200);
  return result.body as ScoreResult;
}

test("malformed request body is rejected with 400 invalid_request", async () => {
  const response = await POST(
    new Request("http://test/api/instrument/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    }),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_request" });
});

test("a non-object body is rejected with 400", async () => {
  const result = await handleScoreRequest(["not", "an", "object"]);
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: "invalid_request" });
});

test("a body with no turns is rejected with 422 invalid_transcript", async () => {
  const result = await handleScoreRequest({ coached: false });
  assert.equal(result.status, 422);
  assert.deepEqual(result.body, { error: "invalid_transcript" });
});

test("an empty turns array is rejected with 422", async () => {
  const result = await handleScoreRequest({ turns: [] });
  assert.equal(result.status, 422);
});

test("a turn missing role or text is rejected with 422", async () => {
  const result = await handleScoreRequest({
    turns: [{ text: "hello", index: 0 }],
  });
  assert.equal(result.status, 422);
  assert.deepEqual(result.body, { error: "invalid_transcript" });
});

test("too many turns is rejected with 413 transcript_too_large", async () => {
  const turns = Array.from({ length: MAX_TURNS + 1 }, (_unused, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    text: "a line of transcript",
    index: i,
  }));
  const result = await handleScoreRequest({ turns });
  assert.equal(result.status, 413);
  assert.deepEqual(result.body, { error: "transcript_too_large" });
});

test("an over-long transcript is rejected with 413", async () => {
  const turns = [
    { role: "user", text: "x".repeat(40_000), index: 0 },
    { role: "assistant", text: "y".repeat(10_000), index: 1 },
    { role: "user", text: "z".repeat(20_000), index: 2 },
  ];
  const result = await handleScoreRequest({ turns });
  assert.equal(result.status, 413);
});

test("a valid transcript with no key scores on the heuristic engine", async () => {
  const result = await handleScoreRequest(
    { turns: rich.turns, coached: false },
    { apiKeyPresent: false, now: FIXED_CLOCK },
  );
  const body = scoreBody(result);
  assert.equal(body.engineMode, "heuristic");
  assert.equal(body.scored, true);
  assertContractShape(body);
});

test("POST end to end returns 200 and the contract for a valid transcript", async () => {
  const response = await POST(
    new Request("http://test/api/instrument/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ turns: rich.turns, history: [{ anything: true }] }),
    }),
  );
  assert.equal(response.status, 200);
  const body = (await response.json()) as ScoreResult;
  assertContractShape(body);
  // No transcript is echoed back.
  assert.equal("turns" in body, false);
});

test("when the LLM judge is unavailable the route falls back to the heuristic", async () => {
  const failingJudge: Judge = async () => {
    throw new JudgeUnavailableError("forced for test", {
      cause: new Error("network down"),
    });
  };
  const result = await handleScoreRequest(
    { turns: rich.turns },
    { apiKeyPresent: true, makeJudge: () => failingJudge, now: FIXED_CLOCK },
  );
  const body = scoreBody(result);
  assert.equal(body.engineMode, "heuristic");
  assert.equal(body.scored, true);
  assertContractShape(body);
});

test("validation still applies on the judge path: a fabricated receipt is stripped", async () => {
  const lyingJudge: Judge = async (_turns, _rubric, opts) =>
    ({
      scored: true,
      reasonIfUnscored: null,
      load: {
        value: 0.9,
        receipts: [
          {
            quote: "this exact string appears in no turn of the transcript",
            turnRef: 0,
            rationale: "fabricated",
          },
        ],
      },
      rigor: null,
      drift: null,
      intervention: null,
      coached: opts.coached,
    }) satisfies RawScore;

  const result = await handleScoreRequest(
    { turns: rich.turns },
    { apiKeyPresent: true, makeJudge: () => lyingJudge, now: FIXED_CLOCK },
  );
  const body = scoreBody(result);
  // Load lost its only (fake) receipt -> nulled -> both core signals null -> unscored.
  assert.equal(body.engineMode, "llm");
  assert.equal(body.load, null);
  assert.equal(body.scored, false);
});

test("a judge with a real receipt is used and marks the result llm", async () => {
  const honestJudge: Judge = async (turns, _rubric, opts) =>
    ({
      scored: true,
      reasonIfUnscored: null,
      load: {
        value: 0.7,
        receipts: [
          {
            quote: turns[0].text.slice(0, 24),
            turnRef: turns[0].index,
            rationale: "the person framed the problem",
          },
        ],
      },
      rigor: null,
      drift: null,
      intervention: null,
      coached: opts.coached,
    }) satisfies RawScore;

  const result = await handleScoreRequest(
    { turns: rich.turns, coached: true },
    { apiKeyPresent: true, makeJudge: () => honestJudge, now: FIXED_CLOCK },
  );
  const body = scoreBody(result);
  assert.equal(body.engineMode, "llm");
  assert.equal(body.scored, true);
  assert.equal(body.load?.value, 0.7);
  assert.equal(body.coached, true);
  assertContractShape(body);
});
