import { cn } from "@/lib/cn";

export interface StatCardProps {
  /** The research finding, stated in one short sentence. */
  stat: string;
  /** Attribution line, e.g. "MIT Media Lab · 2025". */
  source: string;
  className?: string;
}

/**
 * A single research finding with its source attribution. Used in the home-page
 * research band, several to a row.
 */
export function StatCard({ stat, source, className }: StatCardProps) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col justify-between gap-6 rounded-lg border border-border bg-surface-raised p-6",
        className,
      )}
    >
      <p className="text-lg leading-snug text-text">{stat}</p>
      <figcaption className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
        {source}
      </figcaption>
    </figure>
  );
}
