import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatIndex } from "@/components/blocks/shared";

export interface PhaseCardProps {
  /** Phase number; rendered zero-padded ("01"). */
  index: number;
  /** Phase name, e.g. "Instruments". */
  title: string;
  /**
   * Short status note, shown as a pill, e.g. "In validation",
   * "Not built yet", "A direction, not a product".
   */
  state: string;
  /** Body describing the phase. */
  children: ReactNode;
  className?: string;
}

/**
 * A single roadmap phase: number, name, a status pill, and a short description.
 * The three phases (Instruments / Models / Agents) sit in a row on the home
 * page and `/product`.
 */
export function PhaseCard({
  index,
  title,
  state,
  children,
  className,
}: PhaseCardProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
          {formatIndex(index)}
        </span>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          {state}
        </span>
      </div>
      <h3 className="font-serif text-2xl font-medium text-text">{title}</h3>
      <div className="leading-relaxed text-text-muted">{children}</div>
    </div>
  );
}
