import { test } from "node:test";
import assert from "node:assert/strict";
import { RUBRICS, SIGNAL_ORDER, rubricPromptText } from "./rubrics.ts";

test("every signal has a gloss, a description, and span guidance", () => {
  for (const signal of SIGNAL_ORDER) {
    const rubric = RUBRICS[signal];
    assert.ok(rubric.oneLineGloss.trim().length > 0, `${signal} gloss`);
    assert.ok(rubric.whatItMeasures.trim().length > 20, `${signal} description`);
    assert.ok(rubric.whatCountsAsASpan.trim().length > 0, `${signal} span guidance`);
    assert.ok(rubric.raises.length > 0 && rubric.lowers.length > 0);
  }
});

test("the copy carries no exclamation marks or emoji", () => {
  const allText = SIGNAL_ORDER.flatMap((s) => {
    const r = RUBRICS[s];
    return [r.oneLineGloss, r.whatItMeasures, r.whatCountsAsASpan, ...r.raises, ...r.lowers];
  }).join(" ");
  assert.equal(/[!]/.test(allText), false, "no exclamation marks");
  assert.equal(
    /\p{Extended_Pictographic}/u.test(allText),
    false,
    "no emoji",
  );
});

test("rubricPromptText mentions all three signals and the abstain rule", () => {
  const text = rubricPromptText().toLowerCase();
  for (const signal of SIGNAL_ORDER) {
    assert.ok(text.includes(signal), `prompt text mentions ${signal}`);
  }
  assert.ok(text.includes("abstain") || text.includes("thin"));
  assert.ok(text.includes("receipt") || text.includes("verbatim quote"));
});

test("rubricPromptText is stable across calls", () => {
  assert.equal(rubricPromptText(), rubricPromptText());
});
