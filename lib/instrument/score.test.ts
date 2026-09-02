import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreTranscript, type Judge } from "./score.ts";
import { fixture } from "./fixtures/index.ts";
import type { RawScore, Turn } from "./types.ts";

const FIXED_CLOCK = () => new Date("2026-03-01T00:00:00.000Z");

test("with no judge, scoreTranscript runs the heuristic engine", async () => {
  const rich = fixture("rich-reasoning");
  const result = await scoreTranscript(rich.turns, { now: FIXED_CLOCK });
  assert.equal(result.engineMode, "heuristic");
  assert.equal(result.scored, true);
  assert.ok(result.load);
});

test("an injected judge is used and marks the result as llm mode", async () => {
  const rich = fixture("rich-reasoning");
  let seenRubricText = "";
  const judge: Judge = async (turns, rubricText) => {
    seenRubricText = rubricText;
    return {
      scored: true,
      reasonIfUnscored: null,
      load: {
        value: 0.9,
        receipts: [
          {
            quote: turns[0].text.slice(0, 20),
            turnRef: turns[0].index,
            rationale: "framed the problem",
          },
        ],
      },
      rigor: null,
      drift: null,
      intervention: null,
      coached: false,
    } satisfies RawScore;
  };

  const result = await scoreTranscript(rich.turns, { judge, now: FIXED_CLOCK });
  assert.equal(result.engineMode, "llm");
  assert.equal(result.load?.value, 0.9);
  assert.ok(seenRubricText.toLowerCase().includes("load"));
  assert.ok(seenRubricText.toLowerCase().includes("rigor"));
});

test("validation runs on the judge's output — a fabricated receipt is stripped", async () => {
  const rich = fixture("rich-reasoning");
  const lyingJudge: Judge = async () => ({
    scored: true,
    reasonIfUnscored: null,
    load: {
      value: 0.8,
      receipts: [
        { quote: "this string is not in any turn", turnRef: 0, rationale: "made up" },
      ],
    },
    rigor: null,
    drift: null,
    intervention: null,
    coached: false,
  });

  const result = await scoreTranscript(rich.turns, {
    judge: lyingJudge,
    now: FIXED_CLOCK,
  });
  // Load lost its only (fake) receipt -> nulled -> both core signals null -> unscored.
  assert.equal(result.load, null);
  assert.equal(result.scored, false);
});

test("the gate rejects before the judge is ever called", async () => {
  const short: Turn[] = [
    { role: "user", text: "What port does Postgres use?", index: 0 },
    { role: "assistant", text: "5432.", index: 1 },
  ];
  let judgeCalled = false;
  const judge: Judge = async () => {
    judgeCalled = true;
    return {
      scored: true,
      reasonIfUnscored: null,
      load: null,
      rigor: null,
      drift: null,
      intervention: null,
      coached: false,
    };
  };
  const result = await scoreTranscript(short, { judge, now: FIXED_CLOCK });
  assert.equal(judgeCalled, false);
  assert.equal(result.scored, false);
});

test("coached is threaded through both paths", async () => {
  const rich = fixture("rich-reasoning");
  const heuristic = await scoreTranscript(rich.turns, {
    coached: true,
    now: FIXED_CLOCK,
  });
  assert.equal(heuristic.coached, true);

  const judge: Judge = async (_t, _r, opts) => ({
    scored: true,
    reasonIfUnscored: null,
    load: {
      value: 0.5,
      receipts: [
        { quote: rich.turns[0].text.slice(0, 15), turnRef: 0, rationale: "x" },
      ],
    },
    rigor: null,
    drift: null,
    intervention: null,
    coached: opts.coached,
  });
  const viaJudge = await scoreTranscript(rich.turns, {
    judge,
    coached: true,
    now: FIXED_CLOCK,
  });
  assert.equal(viaJudge.coached, true);
});
