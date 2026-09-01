import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface FaqEntry {
  /** The question. */
  q: string;
  /** The answer — plain string or rich node. */
  a: ReactNode;
}

export interface FAQItemProps {
  /** The question shown in the summary row. */
  q: string;
  /** The answer, revealed when the row is expanded. */
  children: ReactNode;
  /** Render expanded on first paint. */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * A single disclosure row, built on native `<details>`/`<summary>` so keyboard
 * support, focus, and the open/closed toggle come from the platform. The "+"
 * glyph rotates to an "×" when open; the rotation is a transition and is
 * disabled under `prefers-reduced-motion`.
 */
export function FAQItem({
  q,
  children,
  defaultOpen = false,
  className,
}: FAQItemProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group border-b border-border [&_summary::-webkit-details-marker]:hidden",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5">
        {/* Heading element so screen-reader heading navigation reaches every
            question; native <details>/<summary> toggle behaviour is kept. */}
        <h3 className="font-sans text-base font-medium text-text">{q}</h3>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
      </summary>
      <div className="max-w-prose pb-6 leading-relaxed text-text-muted">
        {children}
      </div>
    </details>
  );
}

export interface FAQProps {
  /** Question / answer pairs, rendered in order. */
  items: FaqEntry[];
  className?: string;
}

/**
 * A stack of {@link FAQItem} disclosure rows. Each row opens and closes
 * independently.
 */
export function FAQ({ items, className }: FAQProps) {
  return (
    <div className={cn("border-t border-border", className)}>
      {items.map((item, index) => (
        <FAQItem key={`${item.q}-${index}`} q={item.q}>
          {item.a}
        </FAQItem>
      ))}
    </div>
  );
}
