import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { POST, GET } from "./route.ts";
import { handleAggregateRequest, handleContributeRequest } from "./core.ts";

async function withTempFile(
  run: (dataFile: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "novarc-aggregate-"));
  const dataFile = path.join(dir, "instrument-aggregate.jsonl");
  try {
    await run(dataFile);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("malformed request body is rejected with 400 invalid_request", async () => {
  const response = await POST(
    new Request("http://test/api/instrument/contribute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not json",
    }),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "invalid_request",
  });
});

test("an unknown model is rejected with 422", async () => {
  const result = await handleContributeRequest({
    model: "gpt-4",
    load: 0.5,
    rigor: 0.5,
  });
  assert.equal(result.status, 422);
  assert.deepEqual(result.body, { ok: false, error: "invalid_contribution" });
});

test("a score outside 0..1 is rejected with 422", async () => {
  const result = await handleContributeRequest({
    model: "claude",
    load: 1.5,
    rigor: 0.5,
  });
  assert.equal(result.status, 422);
});

test("both signals null is rejected — nothing to aggregate", async () => {
  const result = await handleContributeRequest({
    model: "claude",
    load: null,
    rigor: null,
  });
  assert.equal(result.status, 422);
});

test("a valid contribution is stored and read back in the aggregate", async () => {
  await withTempFile(async (dataFile) => {
    const now = () => new Date("2026-01-01T00:00:00.000Z");
    for (let i = 0; i < 5; i += 1) {
      const result = await handleContributeRequest(
        { model: "claude", load: 0.6, rigor: 0.8 },
        { dataFile, now },
      );
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { ok: true });
    }

    const aggregate = await handleAggregateRequest({ dataFile });
    assert.equal(aggregate.status, 200);
    assert.deepEqual(aggregate.body, {
      aggregates: [{ model: "claude", count: 5, meanLoad: 0.6, meanRigor: 0.8 }],
    });
  });
});

test("reading an aggregate that was never written returns an empty list", async () => {
  await withTempFile(async (dataFile) => {
    const result = await handleAggregateRequest({ dataFile });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { aggregates: [] });
  });
});

test("GET end to end returns the empty aggregate shape", async () => {
  const response = await GET();
  assert.equal(response.status, 200);
  const body = (await response.json()) as { aggregates: unknown[] };
  assert.ok(Array.isArray(body.aggregates));
});
