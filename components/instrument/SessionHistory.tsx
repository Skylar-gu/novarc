"use client";

import { useId, useMemo, useState } from "react";
import type { UseRecord } from "@/lib/instrument/useRecord";
import { SCHEMA_VERSION, type StoredSession } from "@/lib/instrument/record";
import { Button } from "@/components/ui/Button";
import { EngineModeBadge } from "@/components/instrument/EngineModeBadge";

export interface SessionHistoryProps {
  record: UseRecord;
}

const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "unknown date" : DATE_FMT.format(new Date(t));
}

/** Signal value 0..1 as a 0–100 string, or a dash when the signal was null. */
function points(value: number | null): string {
  return value === null ? "—" : String(Math.round(Math.max(0, Math.min(1, value)) * 100));
}

/**
 * The stored capability record: one row per scored session, most recent first,
 * with per-row delete, and a footer for export, import, and clearing the whole
 * record. The record lives only in this browser (`localStorage`); nothing here
 * talks to a server.
 */
export function SessionHistory({ record }: SessionHistoryProps) {
  const { sessions, remove, clear, importJson } = record;

  const ordered = useMemo(
    () => [...sessions].slice().reverse() as StoredSession[],
    [sessions],
  );
  // The record's own export format: `{ version, sessions }`, pretty-printed.
  // Derived straight from the reactive snapshot so it is never stale.
  const exported = useMemo(
    () => JSON.stringify({ version: SCHEMA_VERSION, sessions }, null, 2),
    [sessions],
  );

  const importFieldId = useId();
  const importStatusId = useId();
  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
    exported,
  )}`;

  function handleImport() {
    const result = importJson(importText);
    if (result.ok) {
      setImportMessage({
        tone: "ok",
        text: `Imported ${result.count} ${
          result.count === 1 ? "session" : "sessions"
        }. The previous record was replaced.`,
      });
      setImportText("");
    } else {
      setImportMessage({ tone: "error", text: result.error });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm leading-relaxed text-text-muted">
        This record lives only in this browser. It is never sent to a server,
        and clearing it here removes it for good.
      </p>

      {ordered.length === 0 ? (
        <p className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-text-muted">
          No sessions recorded yet. A scored session is added here on its own;
          an unscored one is not.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface-raised">
          {ordered.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3"
            >
              <span className="font-sans text-sm tabular-nums text-text-muted">
                {formatDate(session.scoredAt)}
              </span>
              <span className="font-sans text-sm text-text">
                Load{" "}
                <span className="tabular-nums text-text-muted">
                  {points(session.load)}
                </span>
              </span>
              <span className="font-sans text-sm text-text">
                Rigor{" "}
                <span className="tabular-nums text-text-muted">
                  {points(session.rigor)}
                </span>
              </span>
              <EngineModeBadge mode={session.engineMode} />
              {session.coached ? (
                <span className="rounded-full border border-border px-2 py-0.5 font-sans text-xs text-text-muted">
                  coached
                </span>
              ) : null}
              {confirmingDelete === session.id ? (
                <span className="ml-auto flex items-center gap-2 font-sans text-sm">
                  <span className="text-text-muted">Delete this session?</span>
                  <button
                    type="button"
                    onClick={() => {
                      remove(session.id);
                      setConfirmingDelete(null);
                    }}
                    className="text-text underline underline-offset-2 transition-colors duration-150 hover:text-accent motion-reduce:transition-none"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(null)}
                    className="text-text-muted underline underline-offset-2 transition-colors duration-150 hover:text-text motion-reduce:transition-none"
                  >
                    Keep it
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(session.id)}
                  className="ml-auto font-sans text-sm text-text-muted underline underline-offset-2 transition-colors duration-150 hover:text-text motion-reduce:transition-none"
                >
                  Delete
                  <span className="sr-only">
                    {" "}
                    the session from {formatDate(session.scoredAt)}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h3 className="font-sans text-sm font-medium text-text">Export</h3>
          <p className="text-xs leading-relaxed text-text-muted">
            Your whole record as JSON. Use the download, or copy the text —
            downloads are blocked in some embedded contexts.
          </p>
          <a
            href={dataUri}
            download="novarc-instrument-record.json"
            className="inline-flex w-fit items-center rounded-full border border-border bg-transparent px-4 py-1.5 font-sans text-sm text-text transition-colors duration-150 hover:bg-surface motion-reduce:transition-none"
          >
            Download the record
          </a>
          <details className="[&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer list-none font-sans text-sm text-accent underline underline-offset-2">
              Show the JSON to copy
            </summary>
            <textarea
              readOnly
              rows={6}
              value={exported}
              className="mt-2 w-full resize-y rounded-md border border-border bg-surface p-2 font-mono text-xs leading-relaxed text-text"
            />
          </details>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-sans text-sm font-medium text-text">Import</h3>
          <label
            htmlFor={importFieldId}
            className="text-xs leading-relaxed text-text-muted"
          >
            Paste a previously exported record. This replaces what is here now.
          </label>
          <textarea
            id={importFieldId}
            rows={4}
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            aria-describedby={importStatusId}
            className="w-full resize-y rounded-md border border-border bg-surface-raised p-2 font-mono text-xs leading-relaxed text-text"
          />
          <div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={importText.trim().length === 0}
              onClick={handleImport}
            >
              Apply the import
            </Button>
          </div>
          <p
            id={importStatusId}
            role={importMessage?.tone === "error" ? "alert" : "status"}
            aria-live={importMessage?.tone === "error" ? "assertive" : "polite"}
            className={
              importMessage?.tone === "error"
                ? "min-h-[1rem] text-xs leading-relaxed text-text"
                : "min-h-[1rem] text-xs leading-relaxed text-text-muted"
            }
          >
            {importMessage?.text ?? ""}
          </p>
        </section>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        {confirmingClear ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-text">
              Delete every recorded session? This cannot be undone.
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                clear();
                setConfirmingClear(false);
                setImportMessage(null);
              }}
            >
              Delete the record
            </Button>
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              className="font-sans text-sm text-text-muted underline underline-offset-2 transition-colors duration-150 hover:text-text motion-reduce:transition-none"
            >
              Keep it
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            disabled={ordered.length === 0}
            className="w-fit font-sans text-sm text-text-muted underline underline-offset-2 transition-colors duration-150 hover:text-text disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
          >
            Clear the whole record
          </button>
        )}
      </div>
    </div>
  );
}
