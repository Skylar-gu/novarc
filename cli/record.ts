/**
 * The CLI's on-disk capability record.
 *
 * The web prototype keeps this in `localStorage` (`lib/instrument/record.ts`).
 * The CLI keeps the same document — `{ version: 1, sessions: StoredSession[] }` —
 * as a pretty-printed file at `~/.novarc/record.json` (override with
 * `NOVARC_RECORD`). The shape is kept identical on purpose: the file validates
 * against the web app's `importJson`, so a record built here can be loaded into
 * the browser later.
 *
 * Row derivation mirrors `addSession` in `lib/instrument/record.ts` — that
 * remains the source of truth for what a row contains.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import {
  SCHEMA_VERSION,
  hashTranscript,
  type RecordFile,
  type StoredSession,
} from "../lib/instrument/record.ts";
import type { ScoreResult, Turn } from "../lib/instrument/types.ts";

export { hashTranscript };

export function recordPath(): string {
  const fromEnv = process.env.NOVARC_RECORD;
  if (fromEnv && fromEnv.trim() !== "") return fromEnv;
  return join(homedir(), ".novarc", "record.json");
}

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

/** Read the record. An absent, unreadable, wrong-version, or malformed file
 *  reads as empty; individual bad rows are dropped. */
export function readRecord(path = recordPath()): RecordFile {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return { version: SCHEMA_VERSION, sessions: [] };
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as Record<string, unknown>).version !== SCHEMA_VERSION ||
      !Array.isArray((parsed as Record<string, unknown>).sessions)
    ) {
      return { version: SCHEMA_VERSION, sessions: [] };
    }
    const sessions = (parsed as { sessions: unknown[] }).sessions.filter(
      isStoredSession,
    ) as StoredSession[];
    return { version: SCHEMA_VERSION, sessions };
  } catch {
    return { version: SCHEMA_VERSION, sessions: [] };
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Build a record row from a scored result. Returns `null` for an unscored
 *  result (nothing to trend). Mirrors `addSession`. */
export function rowFromResult(
  result: ScoreResult,
  transcriptHash: string,
): StoredSession | null {
  if (!result.scored) return null;
  return {
    id: crypto.randomUUID(),
    scoredAt: result.scoredAt || new Date().toISOString(),
    load: result.load ? clamp01(result.load.value) : null,
    rigor: result.rigor ? clamp01(result.rigor.value) : null,
    coached: result.coached,
    engineMode: result.engineMode,
    transcriptHash,
  };
}

export interface AppendOutcome {
  added: number;
  /** Skipped because a row with the same transcript hash was already on file. */
  duplicates: number;
  /** Skipped because the result was unscored. */
  unscored: number;
  total: number;
  path: string;
}

/**
 * Append readings to the record, de-duplicating by transcript hash so a re-run
 * over the same session does not pile up rows. Writes pretty JSON, creating
 * `~/.novarc` if needed.
 */
export function appendReadings(
  readings: { result: ScoreResult; turns: Turn[] }[],
  path = recordPath(),
): AppendOutcome {
  const file = readRecord(path);
  const seen = new Set(file.sessions.map((s) => s.transcriptHash));

  let added = 0;
  let duplicates = 0;
  let unscored = 0;

  for (const { result, turns } of readings) {
    const hash = hashTranscript(turns);
    const row = rowFromResult(result, hash);
    if (!row) {
      unscored += 1;
      continue;
    }
    if (seen.has(hash)) {
      duplicates += 1;
      continue;
    }
    seen.add(hash);
    file.sessions.push(row);
    added += 1;
  }

  if (added > 0) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  }

  return {
    added,
    duplicates,
    unscored,
    total: file.sessions.length,
    path,
  };
}
