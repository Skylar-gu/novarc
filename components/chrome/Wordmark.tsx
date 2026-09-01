import { cn } from "@/lib/cn";

interface WordmarkProps {
  className?: string;
  /** Accessible name; the mark is decorative when this is a link label already. */
  title?: string;
}

/**
 * NOVARC lockup — original geometry, not a trace of any existing logo.
 *
 * The mark is three ascending bars: a measurement rising over time, which is
 * what the company's first product does. The wordmark is set in the site sans
 * via `currentColor`, so it inherits theme colour from its container.
 */
export function Wordmark({ className, title = "NOVARC" }: WordmarkProps) {
  return (
    <svg
      className={cn("block h-5 w-auto text-text", className)}
      viewBox="0 0 116 20"
      role="img"
      aria-label={title}
      fill="none"
    >
      <title>{title}</title>
      <rect x="0" y="12.5" width="3.2" height="7.5" rx="0.4" fill="currentColor" />
      <rect x="6" y="7" width="3.2" height="13" rx="0.4" fill="currentColor" />
      <rect x="12" y="1" width="3.2" height="19" rx="0.4" fill="currentColor" />
      <text
        x="24"
        y="15"
        style={{ fontFamily: "var(--font-sans)" }}
        fontSize="15.5"
        fontWeight={600}
        letterSpacing="1.6"
        fill="currentColor"
      >
        NOVARC
      </text>
    </svg>
  );
}
