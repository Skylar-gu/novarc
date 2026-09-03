/**
 * Validation harness — seed slice (VISION §7 Phase 3, first cut).
 *
 * Scores every transcript in `validation/set.md` with the deterministic
 * heuristic engine (and the LLM judge when `ANTHROPIC_API_KEY` is set), compares
 * the output against the hand-assigned reference labels in the same file, and
 * prints four numbers plus a stability check:
 *
 *   - scored-agreement       — does it score / abstain where a rater would?
 *   - Load-band agreement     — low / mid / high, among sessions both score
 *   - Rigor-abstain agreement — does Rigor carry a value iff there was a move?
 *   - adversarial pass rate   — does fluent-but-empty prose fail to earn Rigor?
 *   - stability               — same transcript three times, byte-identical result
 *
 * Run: `npm run validate`  (→ `node validation/run.ts`).
 *
 * Exit status is non-zero if the heuristic is not perfectly stable, or if
 * scored-agreement falls below the documented floor. See `docs/VALIDATION.md`
 * for the method, the current numbers, and what this seed does not yet test.
 */

import { isDeepStrictEqual } from "node:util";

import { scoreTranscript, type Judge } from "../lib/instrument/score.ts";
import type { ScoreResult } from "../lib/instrument/types.ts";
import {
  loadValidationSet,
  type LoadBand,
  type ReferenceLabel,
  type ValidationCase,
} from "./parse.ts";

/** low < 0.4 ≤ mid ≤ 0.7 < high — mirrors `lib/instrument/fixtures/index.ts`. */
function loadBand(value: number): LoadBand {
  if (value < 0.4) return "low";
  if (value <= 0.7) return "mid";
  return "high";
}

/** Mirrors `INTERVENTION_THRESHOLD` in `lib/instrument/heuristic.ts`. */
const INTERVENTION_THRESHOLD = 0.4;

/** A fixed clock so repeated scoring of one transcript is byte-identical. */
const FIXED_NOW = (): Date => new Date("2026-01-01T00:00:00Z");

const REPEATS = 3;

/**
 * Documented floor. Below this the seed is treated as failing and the process
 * exits non-zero. Deliberately loose: the heuristic is conservative by design
 * and is expected to under-read some sessions a human rater would score.
 */
const SCORED_AGREEMENT_FLOOR = 0.8;

interface Scored {
  label: ReferenceLabel;
  result: ScoreResult;
  stable: boolean;
}

async function scoreOne(
  testCase: ValidationCase,
  judge: Judge | undefined,
): Promise<Scored> {
  const { label, turns } = testCase;
  const runs: ScoreResult[] = [];
  for (let i = 0; i < REPEATS; i += 1) {
    runs.push(
      await scoreTranscript(turns, {
        coached: label.coached,
        now: FIXED_NOW,
        judge,
      }),
    );
  }
  const stable = runs.slice(1).every((r) => isDeepStrictEqual(r, runs[0]));
  const result = runs[0];
  if (result.coached !== label.coached) {
    throw new Error(
      `${label.id}: coached flag did not propagate (expected ${label.coached}, got ${result.coached})`,
    );
  }
  return { label, result, stable };
}

async function scoreAll(
  cases: ValidationCase[],
  judge?: Judge,
): Promise<Scored[]> {
  const out: Scored[] = [];
  for (const testCase of cases) {
    out.push(await scoreOne(testCase, judge));
  }
  return out;
}

interface Rate {
  hits: number;
  total: number;
}

const rate = (): Rate => ({ hits: 0, total: 0 });
const tally = (r: Rate, ok: boolean): void => {
  r.total += 1;
  if (ok) r.hits += 1;
};
const asPct = (r: Rate): string =>
  r.total === 0
    ? "   n/a"
    : `${((100 * r.hits) / r.total).toFixed(0).padStart(4)}% (${r.hits}/${r.total})`;
const ratio = (r: Rate): number => (r.total === 0 ? 1 : r.hits / r.total);

interface Metrics {
  scoredAgreement: Rate;
  loadBandAgreement: Rate;
  rigorAbstainAgreement: Rate;
  adversarialPass: Rate;
  unstable: string[];
}

function computeMetrics(scored: Scored[]): Metrics {
  const m: Metrics = {
    scoredAgreement: rate(),
    loadBandAgreement: rate(),
    rigorAbstainAgreement: rate(),
    adversarialPass: rate(),
    unstable: [],
  };
  for (const { label, result, stable } of scored) {
    if (!stable) m.unstable.push(label.id);

    tally(m.scoredAgreement, result.scored === label.expectScored);

    if (result.scored && label.loadBand !== null) {
      tally(
        m.loadBandAgreement,
        result.load !== null && loadBand(result.load.value) === label.loadBand,
      );
    }
    if (result.scored && label.rigorScored !== null) {
      tally(
        m.rigorAbstainAgreement,
        (result.rigor !== null) === label.rigorScored,
      );
    }
    if (label.adversarial) {
      tally(
        m.adversarialPass,
        result.rigor === null || result.rigor.value < INTERVENTION_THRESHOLD,
      );
    }
  }
  return m;
}

/* ----------------------------------------------------------------------- */
/* Printing                                                               */
/* ----------------------------------------------------------------------- */

const pad = (s: string, n: number): string =>
  s.length >= n ? s : s + " ".repeat(n - s.length);

function gotColumn(result: ScoreResult): string {
  if (!result.scored) {
    return `abstain: ${(result.reasonIfUnscored ?? "").slice(0, 34)}`;
  }
  const l = result.load
    ? `${result.load.value.toFixed(2)} (${loadBand(result.load.value)})`
    : "--";
  const r = result.rigor ? result.rigor.value.toFixed(2) : "null";
  const iv = result.intervention ? result.intervention.signal : "-";
  return `L=${l} R=${r} iv=${iv}`;
}

function checksColumn(label: ReferenceLabel, result: ScoreResult, stable: boolean): string {
  const checks: string[] = [];
  checks.push(
    result.scored === label.expectScored ? "scored:ok" : "scored:MISS",
  );
  if (result.scored && label.loadBand !== null) {
    const ok =
      result.load !== null && loadBand(result.load.value) === label.loadBand;
    checks.push(ok ? "band:ok" : "band:MISS");
  }
  if (result.scored && label.rigorScored !== null) {
    checks.push(
      (result.rigor !== null) === label.rigorScored ? "rigor:ok" : "rigor:MISS",
    );
  }
  if (label.adversarial) {
    const ok =
      result.rigor === null || result.rigor.value < INTERVENTION_THRESHOLD;
    checks.push(ok ? "adv:ok" : "adv:MISS");
  }
  if (!stable) checks.push("UNSTABLE");
  return checks.join(" ");
}

function printTable(scored: Scored[], engine: string): void {
  console.log(`\n${engine} — per transcript\n`);
  console.log(`  ${pad("id", 34)}${pad("expect", 14)}${pad("got", 46)}checks`);
  console.log(`  ${"-".repeat(34 + 14 + 46 + 6)}`);
  for (const { label, result, stable } of scored) {
    const expect = label.expectScored
      ? `score/${label.loadBand ?? "?"}`
      : "abstain";
    console.log(
      `  ${pad(label.id, 34)}${pad(expect, 14)}${pad(gotColumn(result), 46)}${checksColumn(label, result, stable)}`,
    );
  }
}

function printSummary(engine: string, m: Metrics): void {
  console.log(`\n${engine} — summary\n`);
  console.log(`  scored-agreement        ${asPct(m.scoredAgreement)}`);
  console.log(`  Load-band agreement     ${asPct(m.loadBandAgreement)}`);
  console.log(`  Rigor-abstain agreement ${asPct(m.rigorAbstainAgreement)}`);
  console.log(`  adversarial pass rate   ${asPct(m.adversarialPass)}`);
  console.log(
    `  stability (${REPEATS}x)          ${
      m.unstable.length === 0
        ? "   all identical"
        : `   ${m.unstable.length} UNSTABLE: ${m.unstable.join(", ")}`
    }`,
  );
}

/* ----------------------------------------------------------------------- */
/* Main                                                                   */
/* ----------------------------------------------------------------------- */

const cases = loadValidationSet();
console.log(`Validation seed — ${cases.length} transcripts in validation/set.md`);

const heuristicScored = await scoreAll(cases, undefined);
printTable(heuristicScored, "heuristic engine");
const heuristicMetrics = computeMetrics(heuristicScored);
printSummary("heuristic engine", heuristicMetrics);

let llmFailed = false;
if (process.env.ANTHROPIC_API_KEY) {
  console.log(
    `\nANTHROPIC_API_KEY is set — running the LLM judge (model: ${
      process.env.INSTRUMENT_MODEL ?? "claude-opus-5"
    }).`,
  );
  try {
    const { makeLlmJudge } = await import("../lib/instrument/judge.ts");
    const llmScored = await scoreAll(cases, makeLlmJudge());
    printTable(llmScored, "LLM judge");
    printSummary("LLM judge", computeMetrics(llmScored));
    console.log(
      "\nNote: LLM-judge stability is reported for information only. Some\n" +
        "run-to-run variation is expected and is not treated as a failure here.",
    );
  } catch (err) {
    llmFailed = true;
    console.log(
      `\nLLM judge unavailable: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    console.log("Falling back to heuristic-only results above.");
  }
} else {
  console.log(
    "\nANTHROPIC_API_KEY is not set — LLM-judge columns are skipped.\n" +
      "Set it (and optionally INSTRUMENT_MODEL) to include them.",
  );
}

/* ----------------------------------------------------------------------- */
/* Exit status                                                            */
/* ----------------------------------------------------------------------- */

const failures: string[] = [];
if (heuristicMetrics.unstable.length > 0) {
  failures.push(
    `heuristic engine not stable: ${heuristicMetrics.unstable.join(", ")}`,
  );
}
const scoredRate = ratio(heuristicMetrics.scoredAgreement);
if (scoredRate < SCORED_AGREEMENT_FLOOR) {
  failures.push(
    `scored-agreement ${(100 * scoredRate).toFixed(0)}% is below the ${(
      100 * SCORED_AGREEMENT_FLOOR
    ).toFixed(0)}% floor`,
  );
}

console.log("");
if (failures.length > 0) {
  for (const f of failures) console.log(`FAIL: ${f}`);
  process.exitCode = 1;
} else {
  console.log(
    `PASS: heuristic stable across ${REPEATS} runs; scored-agreement ${(
      100 * scoredRate
    ).toFixed(0)}% (floor ${(100 * SCORED_AGREEMENT_FLOOR).toFixed(0)}%).`,
  );
  if (llmFailed) {
    console.log(
      "Note: the LLM judge was requested but unavailable; only the heuristic ran.",
    );
  }
}
