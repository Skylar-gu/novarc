"use client";

import { useId } from "react";
import type { Receipt, Turn } from "@/lib/instrument/types";
import { receiptContext } from "@/components/instrument/receiptContext";

export interface ReceiptListProps {
  /** The signal these receipts support; used only for the summary wording. */
  signal: "load" | "rigor";
  receipts: Receipt[];
  /**
   * The normalized turns for this session, if the page still holds them. Used
   * to show a line of context around each quote. Not part of `ScoreResult`, so
   * this is optional; without it, only the quote is shown.
   */
  turns?: Turn[];
}

const SIGNAL_LABEL: Record<ReceiptListProps["signal"], string> = {
  load: "Load",
  rigor: "Rigor",
};

/**
 * A collapsed disclosure over the evidence behind one signal. Built on native
 * `<details>`/`<summary>` so keyboard operation and focus come from the
 * platform. Each receipt shows the quoted passage as a blockquote, the turn it
 * came from, a line of surrounding context when the turns are available, and
 * the one-sentence rationale.
 */
export function ReceiptList({ signal, receipts, turns }: ReceiptListProps) {
  const headingId = useId();

  if (receipts.length === 0) return null;

  const count = receipts.length;

  return (
    <details className="group [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-sm text-accent underline underline-offset-2 transition-colors duration-150 hover:text-text motion-reduce:transition-none">
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3l5 5-5 5" />
        </svg>
        <span className="group-open:hidden">
          Show the evidence &mdash; {count}{" "}
          {count === 1 ? "passage" : "passages"}
        </span>
        <span className="hidden group-open:inline">
          Hide the evidence for {SIGNAL_LABEL[signal]}
        </span>
      </summary>

      <ol
        aria-label={`Evidence for ${SIGNAL_LABEL[signal]}`}
        className="mt-3 flex flex-col gap-3"
      >
        {receipts.map((receipt, index) => {
          const turn = turns?.find((t) => t.index === receipt.turnRef);
          const context = turn
            ? receiptContext(turn.text, receipt.quote)
            : null;
          return (
            <li
              key={`${headingId}-${index}`}
              id={`ev-${signal}-turn-${receipt.turnRef}`}
              className="scroll-mt-24 rounded-md border border-border bg-surface p-3"
            >
              <p className="font-sans text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                Your turn {receipt.turnRef + 1}
              </p>

              {context ? (
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {context.leadClipped ? "…" : ""}
                  {context.before ? `${context.before} ` : ""}
                  <span className="font-serif italic text-text">
                    &ldquo;{context.match}&rdquo;
                  </span>
                  {context.after ? ` ${context.after}` : ""}
                  {context.trailClipped ? "…" : ""}
                </p>
              ) : (
                <blockquote className="mt-2 border-l-2 border-border pl-3 font-serif text-sm italic leading-relaxed text-text">
                  &ldquo;{receipt.quote}&rdquo;
                </blockquote>
              )}

              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {receipt.rationale}
              </p>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
