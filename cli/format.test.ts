import { test } from "node:test";
import assert from "node:assert/strict";

import {
  formatDrift,
  formatInterventions,
  formatReading,
  formatSessionList,
} from "./format.ts";
import type { DriftScore, ScoreResult } from "../lib/instrument/types.ts";
import type { SessionSummary } from "./discover.ts";

const summary = (over: Partial<SessionSummary> = {}): SessionSummary => ({
  id: "s1",
  path: "/x/s1.jsonl",
  title: "Index strategy",
  cwd: "/home/me/proj",
  gitBranch: "main",
  startedAt: "2026-02-01T09:00:00.000Z",
  endedAt: "2026-02-01T10:00:00.000Z",
  userTurns: 12,
  assistantTurns: 14,
  bytes: 4096,
  ...over,
});

const scored = (over: Partial<ScoreResult> = {}): ScoreResult => ({
  scored: true,
  reasonIfUnscored: null,
  load: { value: 0.71, receipts: [] },
  rigor: { value: 0.62, receipts: [] },
  drift: null,
  intervention: null,
  coached: false,
  engineMode: "heuristic",
  scoredAt: "2026-02-01T10:00:00.000Z",
  ...over,
});

test("session list is numbered and shows turn count", () => {
  const out = formatSessionList([summary(), summary({ title: "Other" })]);
  assert.match(out, /^ {2}1\. Index strategy/m);
  assert.match(out, /^ {2}2\. Other/m);
  assert.match(out, /12u/);
});

test("empty session list has its own line", () => {
  assert.equal(formatSessionList([]), "No Claude Code sessions found.");
});

test("reading line shows Load and Rigor as percentages", () => {
  const line = formatReading("Index strategy", scored());
  assert.match(line, /Load\s+71%/);
  assert.match(line, /Rigor\s+62%/);
});

test("unscored reading shows the reason", () => {
  const line = formatReading(
    "Quick lookup",
    scored({ scored: false, load: null, rigor: null, reasonIfUnscored: "Looks like a lookup." }),
  );
  assert.match(line, /unscored — Looks like a lookup\./);
});

test("rigor null renders as a dash, not 0%", () => {
  const line = formatReading("x", scored({ rigor: null }));
  assert.match(line, /Rigor\s+—/);
  assert.doesNotMatch(line, /Rigor\s+0%/);
});

test("drift: null, forming, and ready", () => {
  assert.match(formatDrift(null), /not enough/);
  assert.match(
    formatDrift({ direction: "holding", vsBaseline: 0, windowDays: 3, baselineReady: false }),
    /baseline still forming/,
  );
  const ready: DriftScore = {
    direction: "strengthening",
    vsBaseline: 0.08,
    windowDays: 40,
    baselineReady: true,
  };
  assert.match(formatDrift(ready), /strengthening \(\+0\.08 vs baseline, spanning 40d\)/);
});

test("interventions block lists only sessions that have one", () => {
  const withIv = scored({
    intervention: { signal: "rigor", prompt: "Name the assumption.", anchoredTo: 4 },
  });
  const out = formatInterventions([
    { title: "A", result: scored() },
    { title: "B", result: withIv },
  ]);
  assert.match(out, /Prompts:/);
  assert.match(out, /\[rigor, turn 4\] Name the assumption\./);
  assert.doesNotMatch(out, /^ {2}A$/m);
});

test("interventions block is empty when there are none", () => {
  assert.equal(formatInterventions([{ title: "A", result: scored() }]), "");
});
