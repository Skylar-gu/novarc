"use client";

/**
 * React binding for the local-first capability record.
 *
 * Thin wrapper over `record.ts` (the store) and `drift.ts` (the math), using
 * `useSyncExternalStore` — the same pattern as `lib/theme.ts`, with no
 * set-state-in-effect and no previous-value refs (react-hooks v6).
 *
 * SSR-safe: `getServerSnapshot` returns a stable empty array, and the store
 * reads as empty whenever `localStorage` is missing or blocked, so a private
 * window simply renders "no record yet".
 */

import { useCallback, useMemo } from "react";
import { useSyncExternalStore } from "react";
import type { DriftScore, ScoreResult } from "./types.ts";
import {
  addSession,
  clearAll,
  deleteSession,
  EMPTY_SNAPSHOT,
  exportJson,
  importJson,
  listSessions,
  subscribe,
  type ImportResult,
  type StoredSession,
} from "./record.ts";
import { computeDrift } from "./drift.ts";

function getServerSnapshot(): StoredSession[] {
  return EMPTY_SNAPSHOT as StoredSession[];
}

export interface UseRecord {
  /** Every stored session, oldest first. */
  sessions: StoredSession[];
  /** Drift over the record, or null until any session with a signal exists. */
  drift: DriftScore | null;
  /** Derive a row from a scored result and append it. Unscored results are ignored. */
  add: (result: ScoreResult, transcriptHash: string) => void;
  /** Remove one session by id. */
  remove: (id: string) => void;
  /** Drop the whole record. */
  clear: () => void;
  /** The `{ version, sessions }` document, pretty-printed. */
  exportJson: () => string;
  /** Replace the record from an exported string. */
  importJson: (text: string) => ImportResult;
}

export function useRecord(): UseRecord {
  const sessions = useSyncExternalStore(
    subscribe,
    listSessions,
    getServerSnapshot,
  );

  const drift = useMemo(() => computeDrift(sessions), [sessions]);

  const add = useCallback(
    (result: ScoreResult, transcriptHash: string) => {
      addSession(result, transcriptHash);
    },
    [],
  );
  const remove = useCallback((id: string) => {
    deleteSession(id);
  }, []);
  const clear = useCallback(() => {
    clearAll();
  }, []);
  const doExport = useCallback(() => exportJson(), []);
  const doImport = useCallback((text: string) => importJson(text), []);

  return {
    sessions,
    drift,
    add,
    remove,
    clear,
    exportJson: doExport,
    importJson: doImport,
  };
}
