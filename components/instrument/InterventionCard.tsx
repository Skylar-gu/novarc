"use client";

import { useId } from "react";
import type { Intervention } from "@/lib/instrument/types";

export interface CoachedToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** Tightens the spacing when shown inside the intervention card. */
  compact?: boolean;
}

/**
 * The "coached" control. Sets `coached` on the next score request: the person
 * is telling the instrument that the session they are about to score was a
 * follow-up to a previous prompt. Coached sessions are still recorded, but the
 * Drift trend excludes them so the instrument never measures its own influence.
 */
export function CoachedToggle({
  checked,
  onChange,
  disabled = false,
  compact = false,
}: CoachedToggleProps) {
  const id = useId();
  return (
    <div className={compact ? "" : "rounded-md border border-border bg-surface p-3"}>
      <label htmlFor={id} className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-accent disabled:opacity-50"
        />
        <span className="flex flex-col gap-1">
          <span className="font-sans text-sm text-text">
            This session was a follow-up to a previous prompt
          </span>
          <span className="text-xs leading-relaxed text-text-muted">
            Coached sessions are kept in your record but left out of the Drift
            trend, so the trend tracks your own movement rather than the
            instrument&rsquo;s.
          </span>
        </span>
      </label>
    </div>
  );
}

export interface InterventionCardProps {
  /** The single intervention, or `null` when the engine returned none. */
  intervention: Intervention | null;
  coached: boolean;
  onCoachedChange: (next: boolean) => void;
  /** Called with the intervention's signal and anchored turn when a receipt
   *  for that pair is on screen. */
  onJumpToTurn?: (signal: Intervention["signal"], turnRef: number) => void;
  /** True when a receipt for this signal cites the anchored turn, so a jump
   *  can land somewhere. */
  canJump?: boolean;
}

const SIGNAL_LABEL: Record<Intervention["signal"], string> = {
  load: "Load",
  rigor: "Rigor",
};

/**
 * The one intervention prompt for a scored session, or nothing. Shows the
 * prompt, the signal it came from, and the turn it is anchored to, with a jump
 * to that turn's receipt when one is shown. The coached control sits below it,
 * because the prompt is the thing a follow-up session would be responding to.
 */
export function InterventionCard({
  intervention,
  coached,
  onCoachedChange,
  onJumpToTurn,
  canJump = false,
}: InterventionCardProps) {
  if (!intervention) return null;

  const turnNumber = intervention.anchoredTo + 1;

  return (
    <div className="rounded-md border border-border bg-surface-raised p-4">
      <h3 className="font-sans text-sm font-medium text-text">One prompt</h3>
      <p className="mt-2 text-base leading-relaxed text-text">
        {intervention.prompt}
      </p>
      <p className="mt-2 font-sans text-xs text-text-muted">
        From your {SIGNAL_LABEL[intervention.signal]} &middot; anchored to turn{" "}
        {turnNumber}
        {canJump && onJumpToTurn ? (
          <>
            {" "}
            &middot;{" "}
            <button
              type="button"
              onClick={() =>
                onJumpToTurn(intervention.signal, intervention.anchoredTo)
              }
              className="text-accent underline underline-offset-2 transition-colors duration-150 hover:text-text motion-reduce:transition-none"
            >
              go to turn {turnNumber}
            </button>
          </>
        ) : null}
      </p>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 font-sans text-xs text-text-muted">
          When you revise this and score the follow-up, mark it below.
        </p>
        <CoachedToggle checked={coached} onChange={onCoachedChange} compact />
      </div>
    </div>
  );
}
