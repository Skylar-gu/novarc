/**
 * The local-first capability record.
 *
 * The user's session history — the raw material for Drift — lives only in their
 * browser, under a single versioned `localStorage` key. The scoring API route
 * persists nothing (PHASE2_PLAN §0.5). This module is the whole store: a pure
 * ES module with no React, synchronous, and guarded so a private window or
 * disabled storage degrades to "empty" instead of throwing.
 *
 * What is stored per session is deliberately small: the two signal values, the
 * flags needed to compute Drift, and a cheap hash of the transcript. Receipts
 * and transcript text are shown once by the UI and then discarded — they never
 * enter the record.
 *
 * SSR-safe: nothing here touches storage at import time, and every access goes
 * through `getStore()`, which returns `null` when there is no usable
 * `localStorage` (the server, or a browser that denies access).
 */

import type { ScoreResult } from "./types.ts";

/** The `localStorage` key. The `v1` suffix is the schema version marker. */
export const STORAGE_KEY = "novarc:instrument:v1";

/** Current on-disk schema version. `importJson` requires an exact match. */
export const SCHEMA_VERSION = 1 as const;

/** One row of the record. No receipts, no transcript text. */
export interface StoredSession {
  /** Stable unique id (crypto.randomUUID, with a fallback). */
  id: string;
  /** ISO 8601, copied from the `ScoreResult`. */
  scoredAt: string;
  /** Load value 0..1, or null if the signal was not scored. */
  load: number | null;
  /** Rigor value 0..1, or null if the signal was not scored. */
  rigor: number | null;
  /** This session followed a prior intervention; excluded from Drift. */
  coached: boolean;
  engineMode: "heuristic" | "llm";
  /** Cheap non-cryptographic hash of the normalized transcript (djb2). Lets a
   *  re-score of the same transcript be recognised without storing the text. */
  transcriptHash: string;
}

/** The full stored document. */
export interface RecordFile {
  version: typeof SCHEMA_VERSION;
  sessions: StoredSession[];
}

/** Result of `importJson`. */
export type ImportResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

/* --- storage access -------------------------------------------------- */

/**
 * The usable `localStorage`, or `null`. Reads `globalThis.localStorage` so it
 * works both in the browser (where it is `window.localStorage`) and under a
 * test shim installed on `globalThis`; on the server the property is absent and
 * this returns `null`. The access itself is wrapped because some browsers throw
 * on `localStorage` in private mode.
 */
function getStore(): Storage | null {
  try {
    const store = (globalThis as { localStorage?: Storage }).localStorage;
    return store ?? null;
  } catch {
    return null;
  }
}

/* --- subscription -------------------------------------------------- */

const listeners = new Set<() => void>();

function handleStorageEvent(event: StorageEvent): void {
  // A `null` key means "everything cleared"; otherwise only react to ours.
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  invalidate();
  emit();
}

/**
 * Register a listener fired on every mutation in this tab and on a `storage`
 * event from another tab. Returns an unsubscribe function.
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function emit(): void {
  for (const listener of listeners) listener();
}

/* --- referentially-stable snapshot cache --------------------------- */

/**
 * A stable empty snapshot for the server and for the "storage unavailable"
 * case. Must be a module constant so `useSyncExternalStore`'s server snapshot
 * is referentially stable across calls.
 */
export const EMPTY_SNAPSHOT: readonly StoredSession[] = Object.freeze([]);

/**
 * Cache of the parsed, sorted session list. `getSnapshot` (via `listSessions`)
 * returns this same array reference until a mutation or a `storage` event calls
 * `invalidate()`, so React does not see a new value every render.
 */
let snapshot: readonly StoredSession[] | null = null;

function invalidate(): void {
  snapshot = null;
}

/* --- validation of untrusted shapes ------------------------------- */

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  const numOrNull = (v: unknown) =>
    v === null || (typeof v === "number" && Number.isFinite(v));
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    typeof row.scoredAt === "string" &&
    numOrNull(row.load) &&
    numOrNull(row.rigor) &&
    typeof row.coached === "boolean" &&
    (row.engineMode === "heuristic" || row.engineMode === "llm") &&
    typeof row.transcriptHash === "string"
  );
}

const byScoredAt = (a: StoredSession, b: StoredSession): number => {
  const ta = Date.parse(a.scoredAt);
  const tb = Date.parse(b.scoredAt);
  return (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb);
};

/**
 * Parse the raw JSON string into a `RecordFile`. Lenient: an unreadable store,
 * missing key, non-JSON, wrong version, or non-array `sessions` all read as
 * empty, and individual malformed rows are dropped rather than failing the
 * whole read. Strict validation lives in `importJson`.
 */
function readFile(): RecordFile {
  const store = getStore();
  if (!store) return { version: SCHEMA_VERSION, sessions: [] };
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, sessions: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as Record<string, unknown>).version !== SCHEMA_VERSION ||
      !Array.isArray((parsed as Record<string, unknown>).sessions)
    ) {
      return { version: SCHEMA_VERSION, sessions: [] };
    }
    const sessions = (
      (parsed as { sessions: unknown[] }).sessions.filter(
        isStoredSession,
      ) as StoredSession[]
    )
      .slice()
      .sort(byScoredAt);
    return { version: SCHEMA_VERSION, sessions };
  } catch {
    return { version: SCHEMA_VERSION, sessions: [] };
  }
}

/**
 * Write the record. Returns `false` (a silent no-op) when storage is
 * unavailable or the write throws (e.g. quota). On success the snapshot cache
 * is invalidated and listeners are notified.
 */
function writeSessions(sessions: StoredSession[]): boolean {
  const store = getStore();
  if (!store) return false;
  try {
    const file: RecordFile = {
      version: SCHEMA_VERSION,
      sessions: sessions.slice().sort(byScoredAt),
    };
    store.setItem(STORAGE_KEY, JSON.stringify(file));
    invalidate();
    emit();
    return true;
  } catch {
    return false;
  }
}

/* --- public API ---------------------------------------------------- */

/** Every stored session, oldest first. Stable reference between mutations. */
export function listSessions(): StoredSession[] {
  if (snapshot === null) {
    snapshot = Object.freeze(readFile().sessions);
  }
  return snapshot as StoredSession[];
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function makeId(): string {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* fall through */
  }
  return `sess-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/**
 * Derive a row from a `ScoreResult` and append it.
 *
 * Only `scored: true` results enter the record — an abstained result has no
 * signal values to trend, so storing it would only add noise to Drift.
 *
 * @returns the stored row, or `null` when the result was unscored or the write
 *          failed (storage unavailable).
 */
export function addSession(
  result: ScoreResult,
  transcriptHash: string,
): StoredSession | null {
  if (!result.scored) return null;

  const row: StoredSession = {
    id: makeId(),
    scoredAt: result.scoredAt || new Date().toISOString(),
    load: result.load ? clamp01(result.load.value) : null,
    rigor: result.rigor ? clamp01(result.rigor.value) : null,
    coached: result.coached,
    engineMode: result.engineMode,
    transcriptHash,
  };

  const next = [...readFile().sessions, row];
  return writeSessions(next) ? row : null;
}

/** Remove one session by id. No-op if it is not present or storage is closed. */
export function deleteSession(id: string): void {
  const current = readFile().sessions;
  const next = current.filter((s) => s.id !== id);
  if (next.length !== current.length) writeSessions(next);
}

/** Drop the entire record. */
export function clearAll(): void {
  const store = getStore();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
    invalidate();
    emit();
  } catch {
    /* nothing to do */
  }
}

/** The whole `{ version, sessions }` document, pretty-printed. */
export function exportJson(): string {
  return JSON.stringify(readFile(), null, 2);
}

/**
 * Replace the record from an exported string.
 *
 * Validates `version === 1`, that `sessions` is an array, and every row's
 * fields and types. On success the current record is **replaced** (not merged —
 * replace is predictable and cannot half-apply). On any failure nothing is
 * written and a plain-language reason is returned.
 */
export function importJson(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That is not valid JSON." };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return {
      ok: false,
      error: "Expected a JSON object with a version and a sessions array.",
    };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported record version ${JSON.stringify(
        obj.version,
      )}; this build reads version ${SCHEMA_VERSION}.`,
    };
  }

  if (!Array.isArray(obj.sessions)) {
    return { ok: false, error: "The sessions field must be an array." };
  }

  const badIndex = obj.sessions.findIndex((row) => !isStoredSession(row));
  if (badIndex !== -1) {
    return {
      ok: false,
      error: `The session at index ${badIndex} is missing fields or has the wrong types.`,
    };
  }

  const sessions = (obj.sessions as StoredSession[]).slice().sort(byScoredAt);
  if (!writeSessions(sessions)) {
    return { ok: false, error: "Storage is unavailable; nothing was imported." };
  }
  return { ok: true, count: sessions.length };
}

/**
 * A cheap, non-cryptographic hash of a transcript (djb2), returned as an
 * unsigned base-36 string. Stable for identical input, order-sensitive, and
 * sensitive to which role said what. Whitespace within a turn is collapsed so
 * incidental reflowing does not change the hash.
 */
export function hashTranscript(
  turns: { role: string; text: string }[],
): string {
  const normalized = turns
    .map(
      (t) =>
        `${t.role.trim().toLowerCase()} ${t.text.replace(/\s+/g, " ").trim()}`,
    )
    .join("");

  let hash = 5381;
  for (let i = 0; i < normalized.length; i += 1) {
    // hash * 33 + charCode, kept in 32-bit range
    hash = (Math.imul(hash, 33) + normalized.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}
