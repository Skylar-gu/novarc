import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatIndex } from "@/components/blocks/shared";

export interface FindingCardProps {
  /** Finding number; rendered zero-padded ("01"). */
  index: number;
  /** The established finding, stated plainly in a sentence. */
  claim: string;
  /** Researcher / attribution line. */
  researcher: string;
  /** What the finding implies for how tools should be built. */
  children: ReactNode;
  className?: string;
}

/**
 * A cognitive-science finding on the research page: number, the claim, its
 * implication, and a researcher attribution line.
 */
export function FindingCard({
  index,
  claim,
  researcher,
  children,
  className,
}: FindingCardProps) {
  return (
    <article className={cn("flex flex-col gap-4", className)}>
      <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
        {formatIndex(index)}
      </span>
      <h3 className="font-serif text-xl font-medium leading-snug text-text sm:text-2xl">
        {claim}
      </h3>
      <div className="leading-relaxed text-text-muted">{children}</div>
      <p className="mt-1 border-t border-border pt-3 font-sans text-xs uppercase tracking-[0.14em] text-text-muted">
        {researcher}
      </p>
    </article>
  );
}
