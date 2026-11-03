import { test } from "node:test";
import assert from "node:assert/strict";

import {
  AI_MODELS,
  MIN_CONTRIBUTIONS_TO_SHOW,
  aggregateContributions,
  isAiModel,
  type Contribution,
} from "./aggregate.ts";

function row(
  model: Contribution["model"],
  load: number | null,
  rigor: number | null,
): Contribution {
  return { model, load, rigor, contributedAt: "2026-01-01T00:00:00.000Z" };
}

test("isAiModel accepts every listed value and rejects anything else", () => {
  for (const { value } of AI_MODELS) assert.equal(isAiModel(value), true);
  assert.equal(isAiModel("gpt-4"), false);
  assert.equal(isAiModel(undefined), false);
});

test("a model with no rows is left out entirely", () => {
  const result = aggregateContributions([row("claude", 0.5, 0.5)]);
  assert.equal(result.find((r) => r.model === "chatgpt"), undefined);
});

test("below the threshold, count is reported but means are suppressed", () => {
  const rows = Array.from({ length: MIN_CONTRIBUTIONS_TO_SHOW - 1 }, () =>
    row("gemini", 0.8, 0.8),
  );
  const result = aggregateContributions(rows);
  assert.deepEqual(result, [
    { model: "gemini", count: MIN_CONTRIBUTIONS_TO_SHOW - 1, meanLoad: null, meanRigor: null },
  ]);
});

test("at the threshold, the mean is computed over non-null values", () => {
  const rows = [
    row("chatgpt", 0.2, 0.4),
    row("chatgpt", 0.4, null),
    row("chatgpt", 0.6, 0.6),
    row("chatgpt", 0.8, 0.8),
    row("chatgpt", 1.0, 1.0),
  ];
  const result = aggregateContributions(rows);
  assert.equal(result.length, 1);
  assert.equal(result[0].count, 5);
  assert.equal(result[0].meanLoad, 0.6);
  // (0.4 + 0.6 + 0.8 + 1.0) / 4, excluding the one null rigor.
  assert.equal(result[0].meanRigor, 0.7);
});

test("rows are grouped independently per model, in AI_MODELS order", () => {
  const rows = [
    ...Array.from({ length: MIN_CONTRIBUTIONS_TO_SHOW }, () => row("other", 0.1, 0.1)),
    ...Array.from({ length: MIN_CONTRIBUTIONS_TO_SHOW }, () => row("chatgpt", 0.9, 0.9)),
  ];
  const result = aggregateContributions(rows);
  assert.deepEqual(
    result.map((r) => r.model),
    ["chatgpt", "other"],
  );
});

test("a model whose rows are all null for a signal reports that mean as null", () => {
  const rows = Array.from({ length: MIN_CONTRIBUTIONS_TO_SHOW }, () =>
    row("claude", null, 0.5),
  );
  const result = aggregateContributions(rows);
  assert.equal(result[0].meanLoad, null);
  assert.equal(result[0].meanRigor, 0.5);
});
