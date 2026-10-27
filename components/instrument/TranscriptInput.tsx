"use client";

import type { ChangeEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Turn } from "@/lib/instrument/types";
import {
  ParseError,
  parseTranscript,
  type TranscriptFormat,
} from "@/lib/instrument/parsers";
import {
  SPLIT_NETWORK_ERROR,
  UNREADABLE_SPLIT_RESPONSE,
  splitErrorMessage,
} from "@/components/instrument/errorMessage";

export interface TranscriptInputProps {
  /** Called with the normalized turns when the person commits a valid parse. */
  onParsed: (turns: Turn[]) => void;
  /** Locks every control, e.g. while a score request is in flight. */
  disabled?: boolean;
}

type ParseState =
  | { status: "empty" }
  | { status: "ok"; turns: Turn[]; format: TranscriptFormat }
  | { status: "splitting" }
  /** `splittable` is false once a split attempt has itself failed, so the
   *  retry affordance does not loop on a deployment with no key configured. */
  | { status: "error"; message: string; splittable: boolean };

const DEBOUNCE_MS = 300;
const PREVIEW_CHARS = 140;

/**
 * A short built-in transcript: a person reasoning through an infrastructure
 * decision, naming an assumption and then revising it. Used by the "load an
 * example" affordance so the input can be tried without pasting anything.
 */
const EXAMPLE_TRANSCRIPT = [
  "You: We are getting read timeouts on the dashboard queries during the morning peak. I am leaning toward adding a read replica. Before I do, is there a cheaper thing I am skipping?",
  "",
  "Assistant: A replica helps if the primary is CPU or IO bound on reads. It does not help if the timeouts come from a few slow queries, lock contention, or connection limits. It is worth checking which of those is true first.",
  "",
  "You: That is fair. The slow log shows three dashboard queries doing sequential scans on a twenty million row table. So it is probably missing indexes, not raw capacity. A replica would have masked that.",
  "",
  "Assistant: Then the first move is a composite index on the columns those queries filter and sort on, and a check that the planner actually uses it. Re-measure the peak after that. If timeouts persist once the primary is no longer scan bound, a replica becomes a real option.",
  "",
  "You: Agreed. I will add the indexes in a migration tonight, watch tomorrow's peak, and only revisit the replica if the primary is still saturated with the scans gone. I was about to spend a month of budget to avoid a one line index.",
].join("\n");

/** Parse `input`, returning a state the component renders directly. */
function evaluate(input: string): ParseState {
  if (input.trim().length === 0) return { status: "empty" };
  try {
    const { turns, format } = parseTranscript(input);
    return { status: "ok", turns, format };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof ParseError
          ? error.message
          : "This transcript could not be read.",
      splittable: true,
    };
  }
}

/** One line of collapsed text, cut to `PREVIEW_CHARS` with an ellipsis. */
function previewLine(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > PREVIEW_CHARS
    ? `${collapsed.slice(0, PREVIEW_CHARS).trimEnd()}…`
    : collapsed;
}

function roleLabel(role: Turn["role"]): string {
  return role === "user" ? "You" : "Assistant";
}

/**
 * Paste or load a conversation transcript, see it parsed into turns, and hand
 * the normalized `Turn[]` up via `onParsed`. Parsing runs entirely in the
 * browser; a loaded file is read locally and never uploaded by this component.
 */
export function TranscriptInput({
  onParsed,
  disabled = false,
}: TranscriptInputProps) {
  const [text, setText] = useState("");
  const [state, setState] = useState<ParseState>({ status: "empty" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fieldId = useId();
  const fileId = useId();
  const statusId = useId();

  // Cleanup only — no derived state is computed here.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function clearTimer() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setText(value);
    clearTimer();
    timer.current = setTimeout(() => setState(evaluate(value)), DEBOUNCE_MS);
  }

  function applyNow(value: string) {
    clearTimer();
    setText(value);
    setState(evaluate(value));
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file later.
    event.target.value = "";
    if (!file) return;
    try {
      applyNow(await file.text());
    } catch {
      clearTimer();
      setState({
        status: "error",
        message: "This file could not be read.",
        splittable: false,
      });
    }
  }

  /**
   * Fallback for text the local heuristics could not segment: send it once to
   * `/api/instrument/split`, where a smaller model splits it into turns. Only
   * reachable from the "could not tell the sides apart" error state.
   */
  async function requestSplit() {
    clearTimer();
    setState({ status: "splitting" });
    try {
      const response = await fetch("/api/instrument/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        let code: string | undefined;
        try {
          const errorBody = (await response.json()) as { error?: unknown };
          code = typeof errorBody.error === "string" ? errorBody.error : undefined;
        } catch {
          // No readable body — fall through to the status-only message.
        }
        setState({
          status: "error",
          message: splitErrorMessage(code, response.status),
          splittable: false,
        });
        return;
      }

      const body = (await response.json()) as { turns?: unknown };
      const turns = Array.isArray(body.turns) ? (body.turns as Turn[]) : null;
      if (!turns || turns.length < 2) {
        setState({
          status: "error",
          message: UNREADABLE_SPLIT_RESPONSE,
          splittable: false,
        });
        return;
      }
      setState({ status: "ok", turns, format: "AI split" });
    } catch {
      setState({
        status: "error",
        message: SPLIT_NETWORK_ERROR,
        splittable: false,
      });
    }
  }

  const busy = disabled || state.status === "splitting";
  const ready = state.status === "ok" && !busy;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <label
            htmlFor={fieldId}
            className="font-sans text-sm font-medium text-text"
          >
            Conversation transcript
          </label>
          <button
            type="button"
            onClick={() => applyNow(EXAMPLE_TRANSCRIPT)}
            disabled={busy}
            className="font-sans text-sm text-accent underline underline-offset-2 transition-colors duration-150 hover:text-text disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
          >
            Load an example
          </button>
        </div>

        <textarea
          id={fieldId}
          value={text}
          onChange={handleTextChange}
          disabled={busy}
          rows={12}
          spellCheck={false}
          aria-describedby={statusId}
          placeholder="Paste a conversation here."
          className="w-full resize-y rounded-md border border-border bg-surface-raised p-3 font-sans text-sm leading-relaxed text-text placeholder:text-text-muted disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fileId}
          className="font-sans text-sm font-medium text-text"
        >
          Or load a conversation JSON file
        </label>
        <input
          id={fileId}
          type="file"
          accept=".json,.txt,text/plain,application/json"
          onChange={handleFile}
          disabled={busy}
          className="block w-full text-sm text-text-muted file:mr-3 file:rounded-full file:border file:border-border file:bg-transparent file:px-4 file:py-1.5 file:font-sans file:text-sm file:text-text file:transition-colors file:duration-150 hover:file:bg-surface file:motion-reduce:transition-none disabled:opacity-50"
        />
        <p className="text-xs text-text-muted">
          The file is read in your browser. Nothing is uploaded from this field.
        </p>
      </div>

      <div
        id={statusId}
        role={state.status === "error" ? "alert" : undefined}
        aria-live="polite"
        className="min-h-[1.25rem]"
      >
        {state.status === "error" && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 text-sm leading-relaxed text-text">
            <p>{state.message}</p>
            {state.splittable && (
              <button
                type="button"
                onClick={requestSplit}
                className="self-start font-sans text-sm text-accent underline underline-offset-2 transition-colors duration-150 hover:text-text motion-reduce:transition-none"
              >
                Try splitting it automatically
              </button>
            )}
          </div>
        )}
        {state.status === "splitting" && (
          <p className="font-sans text-sm text-text-muted">
            Splitting into turns&hellip;
          </p>
        )}
        {state.status === "ok" && (
          <p className="font-sans text-sm text-text-muted">
            {state.turns.length}{" "}
            {state.turns.length === 1 ? "turn" : "turns"} &middot; detected as{" "}
            {state.format}
          </p>
        )}
      </div>

      {state.status === "ok" && (
        <ol className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface-raised">
          {state.turns.map((turn) => (
            <li key={turn.index} className="flex gap-3 p-3">
              <span className="shrink-0 font-sans text-xs tabular-nums text-text-muted">
                {turn.index + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-sans text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                  {roleLabel(turn.role)}
                </span>
                <span className="text-sm leading-snug text-text">
                  {previewLine(turn.text)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div>
        <Button
          type="button"
          disabled={!ready}
          onClick={() => {
            if (state.status === "ok") onParsed(state.turns);
          }}
        >
          Score this session
        </Button>
      </div>
    </div>
  );
}
