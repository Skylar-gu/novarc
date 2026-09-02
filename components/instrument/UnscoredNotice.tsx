export interface UnscoredNoticeProps {
  /** `ScoreResult.reasonIfUnscored` — a plain-language sentence from the engine. */
  reason: string | null;
}

/**
 * The abstain state. Shown when the engine returned `scored: false`: the
 * reason, stated plainly, and a line making clear that abstaining is the
 * designed behaviour when the evidence for a reading is thin — not a failure
 * and not a low score.
 */
export function UnscoredNotice({ reason }: UnscoredNoticeProps) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <h3 className="font-sans text-sm font-medium text-text">
        This session was not scored
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        {reason ??
          "There was not enough in this transcript to read how you reasoned."}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        Abstaining is how the instrument is meant to behave when the evidence is
        thin. Most sessions do not carry a readable signal, and returning a
        number anyway would be inventing one. This is not an error, and it is
        not a low score.
      </p>
    </div>
  );
}
