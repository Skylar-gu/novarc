import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";

interface SectionProps {
  children: ReactNode;
  /** Anchor target, e.g. "waitlist". */
  id?: string;
  /**
   * Section number for the recurring numbered-section motif. Rendered
   * zero-padded ("01"). Omit for unnumbered sections.
   */
  index?: number;
  /** Short label shown beside the index, e.g. "Principle", "Research". */
  eyebrow?: string;
  /** Drop the top hairline (used for the first section after the hero). */
  divider?: boolean;
  /** Constrain inner width. Defaults to the standard container. */
  width?: "default" | "wide";
  className?: string;
  /** Extra classes for the inner Container. */
  innerClassName?: string;
}

function formatIndex(index: number): string {
  return index.toString().padStart(2, "0");
}

/**
 * Vertical rhythm unit for a page. Optionally carries the numbered-section
 * eyebrow (`01 · Principle`) that recurs across the site.
 */
export function Section({
  children,
  id,
  index,
  eyebrow,
  divider = true,
  width = "default",
  className,
  innerClassName,
}: SectionProps) {
  const hasEyebrow = typeof index === "number" || Boolean(eyebrow);

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-20 sm:py-28",
        divider && "border-t border-border",
        className,
      )}
    >
      <Container width={width} className={innerClassName}>
        {hasEyebrow && (
          <p className="mb-8 font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
            {typeof index === "number" && (
              <span className="text-text">{formatIndex(index)}</span>
            )}
            {typeof index === "number" && eyebrow && (
              <span aria-hidden="true"> · </span>
            )}
            {eyebrow}
          </p>
        )}
        {children}
      </Container>
    </section>
  );
}
