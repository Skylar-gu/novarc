import { test } from "node:test";
import assert from "node:assert/strict";
import { makeOpenRouterJudge } from "./openrouterJudge.ts";
import { JudgeUnavailableError } from "./judge.ts";
import { fixture } from "./fixtures/index.ts";

const rich = fixture("rich-reasoning");

const VALID_RAW_SCORE = {
  scored: true,
  reasonIfUnscored: null,
  load: {
    value: 0.7,
    receipts: [
      {
        quote: rich.turns[0].text.slice(0, 20),
        turnRef: rich.turns[0].index,
        rationale: "framed the problem",
      },
    ],
  },
  rigor: null,
  intervention: null,
};

function chatResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function openRouterEnvelope(content: string): unknown {
  return { choices: [{ message: { content } }] };
}

/** Swap `globalThis.fetch` for the duration of one test, restoring after. */
function withFetch(
  impl: typeof fetch,
  run: () => Promise<void>,
): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

test("throws synchronously when OPENROUTER_API_KEY is not set", () => {
  const original = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  try {
    assert.throws(() => makeOpenRouterJudge(), JudgeUnavailableError);
  } finally {
    if (original !== undefined) process.env.OPENROUTER_API_KEY = original;
  }
});

test("a well-formed response is coerced into a RawScore", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  await withFetch(
    (async () =>
      chatResponse(
        openRouterEnvelope(JSON.stringify(VALID_RAW_SCORE)),
      )) as typeof fetch,
    async () => {
      const judge = makeOpenRouterJudge();
      const result = await judge(rich.turns, "RUBRIC", { coached: false });
      assert.equal(result.scored, true);
      assert.equal(result.load?.value, 0.7);
    },
  );
});

test("one malformed reply is retried before succeeding", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  let calls = 0;
  await withFetch(
    (async () => {
      calls += 1;
      if (calls === 1) return chatResponse(openRouterEnvelope("not json"));
      return chatResponse(openRouterEnvelope(JSON.stringify(VALID_RAW_SCORE)));
    }) as typeof fetch,
    async () => {
      const judge = makeOpenRouterJudge();
      const result = await judge(rich.turns, "RUBRIC", { coached: false });
      assert.equal(calls, 2);
      assert.equal(result.scored, true);
    },
  );
});

test("malformed output on both attempts throws JudgeUnavailableError", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  await withFetch(
    (async () => chatResponse(openRouterEnvelope("not json"))) as typeof fetch,
    async () => {
      const judge = makeOpenRouterJudge();
      await assert.rejects(
        judge(rich.turns, "RUBRIC", { coached: false }),
        JudgeUnavailableError,
      );
    },
  );
});

test("a non-2xx response throws JudgeUnavailableError", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  await withFetch(
    (async () => chatResponse({ error: "nope" }, 429)) as typeof fetch,
    async () => {
      const judge = makeOpenRouterJudge();
      await assert.rejects(
        judge(rich.turns, "RUBRIC", { coached: false }),
        JudgeUnavailableError,
      );
    },
  );
});

test("a network failure throws JudgeUnavailableError", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  await withFetch(
    (async () => {
      throw new Error("ECONNRESET");
    }) as typeof fetch,
    async () => {
      const judge = makeOpenRouterJudge();
      await assert.rejects(
        judge(rich.turns, "RUBRIC", { coached: false }),
        JudgeUnavailableError,
      );
    },
  );
});
