import type { SignalScore, Turn } from "@/lib/instrument/types";
import { RUBRICS } from "@/lib/instrument/rubrics";
import { ReceiptList } from "@/components/instrument/ReceiptList";

export interface ReadoutProps {
  signal: "load" | "rigor";
  /** The scored signal, or `null` when it was not scored this session. */
  score: SignalScore | null;
  /** The session's turns, forwarded to the receipts for context. */
  turns?: Turn[];
}

const SIGNAL_LABEL: Record<ReadoutProps["signal"], string> = {
  load: "Load",
  rigor: "Rigor",
};

/** Shown in place of a value when a signal was not scored. */
const NOT_SCORED_REASON: Record<ReadoutProps["signal"], string> = {
  load: "No passage showed you framing, directing, or judging the work, so Load has nothing to stand on.",
  rigor:
    "No reasoning move to measure — no assumption named, no evidence asked for, no position revised.",
};

/**
 * Load or Rigor as a labelled value on a 0–100 scale. The number is real text;
 * the bar beneath it is a decorative echo and is hidden from assistive tech
 * (the visual language of `InterfacePreview`'s Meter, with live data). The
 * one-line gloss comes from the rubric. A `null` signal reads "not scored"
 * with its reason rather than a zero. Receipts for the signal sit below.
 */
export function Readout({ signal, score, turns }: ReadoutProps) {
  const label = SIGNAL_LABEL[signal];
  const gloss = RUBRICS[signal].oneLineGloss;

  if (score === null) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-sans text-sm font-medium text-text">{label}</h3>
          <span className="font-sans text-sm text-text-muted">not scored</span>
        </div>
        <div
          aria-hidden="true"
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface"
        />
        <p className="text-xs leading-relaxed text-text-muted">{gloss}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          {NOT_SCORED_REASON[signal]}
        </p>
      </div>
    );
  }

  const value = Math.max(0, Math.min(1, score.value));
  const points = Math.round(value * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-sans text-sm font-medium text-text">{label}</h3>
        <span className="font-sans text-sm tabular-nums text-text-muted">
          <span className="text-base font-medium text-text">{points}</span> / 100
        </span>
      </div>
      <div
        aria-hidden="true"
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${points}%` }}
        />
      </div>
      <p className="text-xs leading-relaxed text-text-muted">{gloss}</p>
      <div className="mt-2">
        <ReceiptList signal={signal} receipts={score.receipts} turns={turns} />
      </div>
    </div>
  );
}
