import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { appendReadings, readRecord, rowFromResult } from "./record.ts";
import type { ScoreResult, Turn } from "../lib/instrument/types.ts";

function tmpRecord(): string {
  return join(mkdtempSync(join(tmpdir(), "novarc-cli-")), "record.json");
}

function scored(over: Partial<ScoreResult> = {}): ScoreResult {
  return {
    scored: true,
    reasonIfUnscored: null,
    load: { value: 0.7, receipts: [] },
    rigor: { value: 0.5, receipts: [] },
    drift: null,
    intervention: null,
    coached: false,
    engineMode: "heuristic",
    scoredAt: "2026-02-01T00:00:00.000Z",
    ...over,
  };
}

const turns = (text: string): Turn[] => [
  { role: "user", text, index: 0 },
  { role: "assistant", text: "ok", index: 1 },
];

test("readRecord on a missing file is an empty record", () => {
  const rec = readRecord(join(tmpdir(), "does-not-exist-novarc.json"));
  assert.deepEqual(rec, { version: 1, sessions: [] });
});

test("readRecord drops malformed rows but keeps good ones", () => {
  const path = tmpRecord();
  writeFileSync(
    path,
    JSON.stringify({
      version: 1,
      sessions: [
        { nope: true },
        {
          id: "a",
          scoredAt: "2026-01-01T00:00:00.000Z",
          load: 0.5,
          rigor: null,
          coached: false,
          engineMode: "heuristic",
          transcriptHash: "h",
        },
      ],
    }),
  );
  const rec = readRecord(path);
  assert.equal(rec.sessions.length, 1);
  assert.equal(rec.sessions[0].id, "a");
});

test("wrong version reads as empty", () => {
  const path = tmpRecord();
  writeFileSync(path, JSON.stringify({ version: 99, sessions: [] }));
  assert.deepEqual(readRecord(path).sessions, []);
});

test("rowFromResult returns null for an unscored result", () => {
  assert.equal(
    rowFromResult(scored({ scored: false, load: null, rigor: null }), "h"),
    null,
  );
});

test("appendReadings writes pretty JSON and counts what it added", () => {
  const path = tmpRecord();
  const out = appendReadings(
    [
      { result: scored(), turns: turns("alpha") },
      { result: scored({ scored: false, load: null, rigor: null }), turns: turns("beta") },
    ],
    path,
  );
  assert.equal(out.added, 1);
  assert.equal(out.unscored, 1);
  assert.equal(out.total, 1);

  const raw = readFileSync(path, "utf8");
  assert.match(raw, /\n {2}"version": 1/); // indented => pretty
  assert.equal(readRecord(path).sessions.length, 1);
});

test("re-appending the same transcript is de-duplicated by hash", () => {
  const path = tmpRecord();
  appendReadings([{ result: scored(), turns: turns("same") }], path);
  const second = appendReadings(
    [
      { result: scored(), turns: turns("same") },
      { result: scored(), turns: turns("different") },
    ],
    path,
  );
  assert.equal(second.added, 1);
  assert.equal(second.duplicates, 1);
  assert.equal(readRecord(path).sessions.length, 2);
});
