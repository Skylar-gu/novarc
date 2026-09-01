import { cn } from "@/lib/cn";

export interface InterfacePreviewProps {
  /** Device frame drawn around the miniature instrument UI. */
  variant: "desktop" | "mobile";
  /**
   * Optional line rendered under the device frame. Lets two placements of the
   * same preview read differently (e.g. one framing the readouts, one framing
   * the receipt) without duplicating the component.
   */
  caption?: string;
  className?: string;
}

/**
 * A labelled readout for Load or Rigor. The numeric value is stated as text;
 * the bar is a decorative echo of it and is hidden from assistive tech.
 */
function Meter({
  label,
  gloss,
  value,
}: {
  label: string;
  gloss: string;
  /** 0..1 share of the work. */
  value: number;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-sm font-medium text-text">{label}</span>
        <span className="font-sans text-sm tabular-nums text-text-muted">
          {pct}%
        </span>
      </div>
      <div
        aria-hidden="true"
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-muted">{gloss}</span>
    </div>
  );
}

/** The Drift trend hint — a direction stated in words, plus a decorative line. */
function DriftRow() {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-sans text-sm font-medium text-text">Drift</span>
        <span className="text-xs text-text-muted">
          the direction of your reasoning over time
        </span>
        <span className="text-xs text-text-muted">
          Holding, against your 90-day baseline
        </span>
      </div>
      <svg
        aria-hidden="true"
        viewBox="0 0 72 24"
        className="h-6 w-20 shrink-0 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 15 L14 13 L26 16 L38 12 L50 14 L62 11 L70 13" />
      </svg>
    </div>
  );
}

/** A short evidence receipt: a quoted passage and the signal it supports. */
function Receipt() {
  return (
    <figure className="flex flex-col gap-2 rounded-md bg-surface p-3">
      <figcaption className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
        Receipt · supports Rigor
      </figcaption>
      <blockquote className="text-sm leading-snug text-text">
        <em>
          &ldquo;If the retry storm only shows up during partial network
          partitions, backoff is not the fix &mdash; the client is treating a
          timeout and a refusal as the same event.&rdquo;
        </em>
      </blockquote>
      <p className="text-xs text-text-muted">
        Your turn 6 &mdash; assumption named, then checked against the failure
        pattern.
      </p>
    </figure>
  );
}

/** The instrument content shared by both device frames. */
function InstrumentPanel() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-sm font-medium text-text">
          Session review
        </span>
        <span className="text-xs text-text-muted">3 of 11 scored this week</span>
      </div>
      <Meter
        label="Load"
        gloss="the share of the thinking you carried"
        value={0.71}
      />
      <Meter
        label="Rigor"
        gloss="the quality of your reasoning where you engaged"
        value={0.63}
      />
      <DriftRow />
      <Receipt />
    </div>
  );
}

/**
 * A built (not screenshotted) miniature of the instrument interface, wrapped in
 * a desktop or mobile device frame. The frame chrome is decorative and hidden
 * from assistive tech; the readouts, gloss lines, and receipt are real text.
 */
export function InterfacePreview({
  variant,
  caption,
  className,
}: InterfacePreviewProps) {
  if (variant === "mobile") {
    return (
      <div className={cn("mx-auto w-full max-w-[19rem]", className)}>
        <div className="rounded-[2rem] border border-border bg-surface-raised p-2">
          <div
            aria-hidden="true"
            className="mx-auto mb-2 mt-1 h-1 w-16 rounded-full bg-border"
          />
          <div className="rounded-[1.5rem] bg-ground p-4">
            <InstrumentPanel />
          </div>
        </div>
        {caption ? (
          <p className="mt-3 text-center text-xs text-text-muted">{caption}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div
          aria-hidden="true"
          className="flex items-center gap-1.5 border-b border-border px-4 py-2.5"
        >
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="h-2 w-2 rounded-full bg-border" />
          <span className="ml-3 text-xs text-text-muted">
            novarc · instrument
          </span>
        </div>
        <div className="bg-ground p-6">
          <InstrumentPanel />
        </div>
      </div>
      {caption ? (
        <p className="mt-3 text-xs text-text-muted">{caption}</p>
      ) : null}
    </div>
  );
}
