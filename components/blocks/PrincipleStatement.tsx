import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatIndex } from "@/components/blocks/shared";

export interface PrincipleStatementProps {
  /** Statement number; rendered zero-padded ("01"). */
  index: number;
  /** Label shown beside the number. Defaults to "Principle". */
  label?: string;
  /** The statement itself. One or two sentences; keep it declarative. */
  children: ReactNode;
  className?: string;
}

/**
 * A numbered single-sentence statement — the standalone-principle treatment
 * used between denser sections. Serif, set below the page title, generous space.
 */
export function PrincipleStatement({
  index,
  label = "Principle",
  children,
  className,
}: PrincipleStatementProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <p className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
        <span className="text-text">{formatIndex(index)}</span>
        <span aria-hidden="true"> · </span>
        {label}
      </p>
      <p className="max-w-4xl font-serif text-2xl font-medium leading-[1.2] tracking-tight text-text sm:text-3xl md:text-4xl">
        {children}
      </p>
    </div>
  );
}
