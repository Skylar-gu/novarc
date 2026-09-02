import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface HousePoint {
  /** Short heading, e.g. "A single company". */
  title: string;
  /** One or two sentences. */
  body: ReactNode;
}

export interface HouseSectionProps {
  /** Optional lead statement above the three points. */
  lead?: ReactNode;
  /**
   * The sub-points (single company / sequence of products / compounding gains).
   * Rendered in an equal-width row. Ignored when `children` is provided.
   */
  points?: HousePoint[];
  /** Custom content, used instead of `lead` + `points`. */
  children?: ReactNode;
  className?: string;
}

/**
 * The "single entity, many products over time" band. Pass structured `lead` + `points` for
 * the standard three-column treatment, or `children` for a bespoke layout.
 */
export function HouseSection({
  lead,
  points,
  children,
  className,
}: HouseSectionProps) {
  return (
    <div className={cn("flex flex-col gap-10", className)}>
      {children ?? (
        <>
          {lead ? (
            <p className="max-w-2xl font-serif text-2xl font-medium leading-snug text-text sm:text-3xl">
              {lead}
            </p>
          ) : null}
          {points && points.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {points.map((point) => (
                <div key={point.title} className="flex flex-col gap-2">
                  <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-text">
                    {point.title}
                  </h3>
                  <div className="leading-relaxed text-text-muted">
                    {point.body}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
