import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatIndex } from "@/components/blocks/shared";

export interface PrincipleCardProps {
  /** Principle number; rendered zero-padded ("01"). */
  index: number;
  /** Principle name, e.g. "Augment, never replace". */
  title: string;
  /** One or two sentences of explanation. */
  children: ReactNode;
  className?: string;
}

/**
 * One principle within a {@link PrincipleGrid}: number, name, short body.
 */
export function PrincipleCard({
  index,
  title,
  children,
  className,
}: PrincipleCardProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
        {formatIndex(index)}
      </span>
      <h3 className="font-serif text-xl font-medium text-text sm:text-2xl">
        {title}
      </h3>
      <div className="leading-relaxed text-text-muted">{children}</div>
    </div>
  );
}

export interface PrincipleGridProps {
  /** A set of {@link PrincipleCard} elements — typically four. */
  children: ReactNode;
  className?: string;
}

/**
 * Responsive 2×2 grid wrapper for {@link PrincipleCard}s. Collapses to a single
 * column below the `sm` breakpoint.
 */
export function PrincipleGrid({ children, className }: PrincipleGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
