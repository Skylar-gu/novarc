import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreHeuristic } from "./heuristic.ts";
import { spanOccursInTurn } from "./normalize.ts";
import { FIXTURES, loadBand } from "./fixtures/index.ts";
import type { Turn } from "./types.ts";

for (const f of FIXTURES) {
  test(`fixture: ${f.name} — ${f.purpose}`, () => {
    const raw = scoreHeuristic(f.turns, { coached: false });

    assert.equal(raw.scored, f.scored, `scored mismatch for ${f.name}`);

    if (!f.scored) {
      assert.equal(raw.load, null);
      assert.equal(raw.rigor, null);
      assert.ok(
        (raw.reasonIfUnscored ?? "").length > 0,
        "an unscored result must state why",
      );
      return;
    }

    // Scored: Load is always present with at least one receipt.
    assert.ok(raw.load, `${f.name} should carry a Load score`);
    assert.ok(raw.load.receipts.length >= 1, "Load needs >= 1 receipt");
    assert.ok(raw.load.value >= 0 && raw.load.value <= 1);

    if (f.loadBand) {
      assert.equal(
        loadBand(raw.load.value),
        f.loadBand,
        `${f.name} Load band: got ${raw.load.value}`,
      );
    }

    if (f.rigorScored === true) {
      assert.ok(raw.rigor, `${f.name} should carry a Rigor score`);
      assert.ok(raw.rigor.receipts.length >= 1, "Rigor needs >= 1 receipt");
    } else if (f.rigorScored === false) {
      assert.equal(raw.rigor, null, `${f.name} Rigor should abstain`);
    }

    if (f.intervention !== undefined) {
      assert.equal(
        raw.intervention?.signal ?? null,
        f.intervention,
        `${f.name} intervention signal`,
      );
    }

    // Every receipt the heuristic emits is a literal span of its cited turn.
    for (const signal of [raw.load, raw.rigor]) {
      if (!signal) continue;
      for (const receipt of signal.receipts) {
        assert.ok(
          spanOccursInTurn(receipt.quote, receipt.turnRef, f.turns),
          `${f.name}: receipt "${receipt.quote}" not found in turn ${receipt.turnRef}`,
        );
      }
    }
  });
}

test("scoring is deterministic — same input, deep-equal output", () => {
  for (const f of FIXTURES) {
    const a = scoreHeuristic(f.turns, { coached: false });
    const b = scoreHeuristic(f.turns, { coached: false });
    assert.deepEqual(a, b, `${f.name} is not deterministic`);
  }
});

test("the coached flag passes through untouched", () => {
  const rich = FIXTURES.find((f) => f.name === "rich-reasoning")!;
  assert.equal(scoreHeuristic(rich.turns, { coached: true }).coached, true);
  assert.equal(scoreHeuristic(rich.turns, { coached: false }).coached, false);
});

test("Rigor abstains rather than scoring fluent-but-empty prose high", () => {
  const empty = FIXTURES.find((f) => f.name === "fluent-but-empty")!;
  const raw = scoreHeuristic(empty.turns, { coached: false });
  assert.equal(raw.rigor, null);
});

test("a lone user turn is gated before any scoring", () => {
  const turns: Turn[] = [
    { role: "user", text: "Explain the CAP theorem in one paragraph.", index: 0 },
    { role: "assistant", text: "Consistency, availability, partition tolerance…", index: 1 },
  ];
  const raw = scoreHeuristic(turns, { coached: false });
  assert.equal(raw.scored, false);
});
