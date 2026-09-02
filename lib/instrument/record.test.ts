import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  STORAGE_KEY,
  addSession,
  clearAll,
  deleteSession,
  exportJson,
  hashTranscript,
  importJson,
  listSessions,
  subscribe,
} from "./record.ts";
import type { ScoreResult } from "./types.ts";

/* --- an in-memory localStorage, installed on globalThis for these tests --- */

function makeMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  } as unknown as Storage;
}

const holder = globalThis as { localStorage?: Storage };
let original: Storage | undefined;

beforeEach(() => {
  original = holder.localStorage;
  holder.localStorage = makeMemoryStorage();
  clearAll(); // reset storage + invalidate the module snapshot cache
});

afterEach(() => {
  if (original === undefined) delete holder.localStorage;
  else holder.localStorage = original;
});

/* --- helpers --- */

function scored(over: Partial<ScoreResult> = {}): ScoreResult {
  return {
    scored: true,
    reasonIfUnscored: null,
    load: { value: 0.5, receipts: [{ quote: "q", turnRef: 0, rationale: "r" }] },
    rigor: {
      value: 0.5,
      receipts: [{ quote: "q", turnRef: 0, rationale: "r" }],
    },
    drift: null,
    intervention: null,
    coached: false,
    engineMode: "heuristic",
    scoredAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

/* --- storage API --- */

test("addSession derives a row from a scored result and listSessions returns it", () => {
  const row = addSession(scored({ coached: true, engineMode: "llm" }), "abc");
  assert.ok(row);
  assert.equal(typeof row.id, "string");
  assert.ok(row.id.length > 0);
  assert.equal(row.scoredAt, "2026-01-01T00:00:00.000Z");
  assert.equal(row.load, 0.5);
  assert.equal(row.rigor, 0.5);
  assert.equal(row.coached, true);
  assert.equal(row.engineMode, "llm");
  assert.equal(row.transcriptHash, "abc");

  const all = listSessions();
  assert.equal(all.length, 1);
  assert.deepEqual(all[0], row);
});

test("addSession returns null for an unscored result and stores nothing", () => {
  const out = addSession(
    scored({ scored: false, load: null, rigor: null, reasonIfUnscored: "thin" }),
    "x",
  );
  assert.equal(out, null);
  assert.equal(listSessions().length, 0);
});

test("addSession clamps signal values into 0..1 and keeps a null signal null", () => {
  const row = addSession(
    scored({
      load: { value: 1.4, receipts: [{ quote: "q", turnRef: 0, rationale: "r" }] },
      rigor: null,
    }),
    "x",
  );
  assert.ok(row);
  assert.equal(row.load, 1);
  assert.equal(row.rigor, null);
});

test("listSessions returns sessions oldest-first regardless of insertion order", () => {
  addSession(scored({ scoredAt: "2026-03-01T00:00:00.000Z" }), "c");
  addSession(scored({ scoredAt: "2026-01-01T00:00:00.000Z" }), "a");
  addSession(scored({ scoredAt: "2026-02-01T00:00:00.000Z" }), "b");
  assert.deepEqual(
    listSessions().map((s) => s.transcriptHash),
    ["a", "b", "c"],
  );
});

test("listSessions returns a stable reference until the record mutates", () => {
  addSession(scored(), "a");
  const first = listSessions();
  assert.equal(listSessions(), first, "same reference with no mutation");
  addSession(scored({ scoredAt: "2026-02-01T00:00:00.000Z" }), "b");
  assert.notEqual(listSessions(), first, "new reference after a mutation");
});

test("deleteSession removes one row by id", () => {
  const a = addSession(scored({ scoredAt: "2026-01-01T00:00:00.000Z" }), "a");
  addSession(scored({ scoredAt: "2026-02-01T00:00:00.000Z" }), "b");
  assert.ok(a);
  deleteSession(a.id);
  assert.deepEqual(
    listSessions().map((s) => s.transcriptHash),
    ["b"],
  );
});

test("clearAll empties the record", () => {
  addSession(scored(), "a");
  addSession(scored({ scoredAt: "2026-02-01T00:00:00.000Z" }), "b");
  clearAll();
  assert.equal(listSessions().length, 0);
});

test("exportJson round-trips through importJson", () => {
  addSession(scored({ scoredAt: "2026-01-01T00:00:00.000Z" }), "a");
  addSession(scored({ scoredAt: "2026-02-01T00:00:00.000Z" }), "b");
  const dump = exportJson();
  const parsed = JSON.parse(dump);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.sessions.length, 2);

  clearAll();
  assert.equal(listSessions().length, 0);

  const result = importJson(dump);
  assert.deepEqual(result, { ok: true, count: 2 });
  assert.equal(listSessions().length, 2);
});

test("importJson replaces (does not merge) the current record", () => {
  addSession(scored(), "old");
  const dump = exportJson();
  clearAll();
  addSession(scored({ scoredAt: "2026-05-01T00:00:00.000Z" }), "new");

  const result = importJson(dump);
  assert.deepEqual(result, { ok: true, count: 1 });
  assert.deepEqual(
    listSessions().map((s) => s.transcriptHash),
    ["old"],
  );
});

test("importJson rejects malformed input with ok:false and a message", () => {
  const cases: string[] = [
    "not json at all",
    JSON.stringify({ version: 2, sessions: [] }),
    JSON.stringify({ version: 1, sessions: { nope: true } }),
    JSON.stringify({ version: 1, sessions: [{ id: "x" }] }),
    JSON.stringify({
      version: 1,
      sessions: [
        {
          id: "x",
          scoredAt: "2026-01-01T00:00:00.000Z",
          load: "high",
          rigor: null,
          coached: false,
          engineMode: "heuristic",
          transcriptHash: "h",
        },
      ],
    }),
    JSON.stringify({
      version: 1,
      sessions: [
        {
          id: "x",
          scoredAt: "2026-01-01T00:00:00.000Z",
          load: 0.5,
          rigor: null,
          coached: false,
          engineMode: "guess",
          transcriptHash: "h",
        },
      ],
    }),
    JSON.stringify([]),
    "null",
  ];
  for (const text of cases) {
    const result = importJson(text);
    assert.equal(result.ok, false, `expected rejection for: ${text}`);
    if (result.ok === false) {
      assert.equal(typeof result.error, "string");
      assert.ok(result.error.length > 0);
    }
  }
  assert.equal(listSessions().length, 0, "nothing was written by a failed import");
});

test("importJson accepts a valid hand-written document", () => {
  const doc = JSON.stringify({
    version: 1,
    sessions: [
      {
        id: "one",
        scoredAt: "2026-01-01T00:00:00.000Z",
        load: 0.42,
        rigor: null,
        coached: false,
        engineMode: "heuristic",
        transcriptHash: "h1",
      },
    ],
  });
  assert.deepEqual(importJson(doc), { ok: true, count: 1 });
});

/* --- subscribe --- */

test("subscribe fires the listener on every mutation and stops after unsubscribe", () => {
  let calls = 0;
  const unsubscribe = subscribe(() => {
    calls += 1;
  });

  const a = addSession(scored({ scoredAt: "2026-01-01T00:00:00.000Z" }), "a");
  assert.equal(calls, 1);

  addSession(scored({ scoredAt: "2026-02-01T00:00:00.000Z" }), "b");
  assert.equal(calls, 2);

  assert.ok(a);
  deleteSession(a.id);
  assert.equal(calls, 3);

  importJson(exportJson());
  assert.equal(calls, 4);

  clearAll();
  assert.equal(calls, 5);

  unsubscribe();
  addSession(scored({ scoredAt: "2026-03-01T00:00:00.000Z" }), "c");
  assert.equal(calls, 5, "no more calls after unsubscribe");
});

test("STORAGE_KEY is the versioned key from the spec", () => {
  assert.equal(STORAGE_KEY, "novarc:instrument:v1");
});

/* --- hashTranscript --- */

test("hashTranscript is stable for identical input", () => {
  const turns = [
    { role: "user", text: "why does the lock contend" },
    { role: "assistant", text: "row locks" },
  ];
  assert.equal(hashTranscript(turns), hashTranscript(turns.map((t) => ({ ...t }))));
});

test("hashTranscript differs for different text", () => {
  assert.notEqual(
    hashTranscript([{ role: "user", text: "alpha" }]),
    hashTranscript([{ role: "user", text: "beta" }]),
  );
});

test("hashTranscript is order-sensitive", () => {
  const a = [
    { role: "user", text: "first" },
    { role: "user", text: "second" },
  ];
  const b = [
    { role: "user", text: "second" },
    { role: "user", text: "first" },
  ];
  assert.notEqual(hashTranscript(a), hashTranscript(b));
});

test("hashTranscript is role-sensitive", () => {
  assert.notEqual(
    hashTranscript([{ role: "user", text: "same words" }]),
    hashTranscript([{ role: "assistant", text: "same words" }]),
  );
});

test("hashTranscript ignores incidental whitespace within a turn", () => {
  assert.equal(
    hashTranscript([{ role: "user", text: "a   b\n\tc" }]),
    hashTranscript([{ role: "user", text: "a b c" }]),
  );
});
