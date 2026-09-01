import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatIndex } from "@/components/blocks/shared";

export interface SignalCardProps {
  /** Signal number; rendered zero-padded ("01"). */
  index: number;
  /** Signal name: "Load", "Rigor", or "Drift". */
  name: string;
  /**
   * The plain-language gloss for the signal, e.g.
   * "the share of the thinking you carried". A short phrase, not a sentence.
   */
  gloss: string;
  /** Body paragraph(s) describing what the signal measures. */
  children: ReactNode;
  className?: string;
}

/**
 * One of the three instrument signals: number, name, plain-language gloss, and
 * an explanatory body. Used on the home page and, in full, on `/product`.
 */
export function SignalCard({
  index,
  name,
  gloss,
  children,
  className,
}: SignalCardProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline gap-3">
        <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
          {formatIndex(index)}
        </span>
        <h3 className="font-serif text-2xl font-medium text-text sm:text-3xl">
          {name}
        </h3>
      </div>
      <p className="text-sm text-text-muted">{gloss}</p>
      <div className="mt-1 max-w-prose leading-relaxed text-text">{children}</div>
    </div>
  );
}
