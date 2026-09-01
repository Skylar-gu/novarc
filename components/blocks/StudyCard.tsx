import { cn } from "@/lib/cn";

export interface StudyCardProps {
  /** Publishing organisation(s), e.g. "MIT Media Lab". */
  org: string;
  /** Publication year. */
  year: string | number;
  /** Study title. */
  title: string;
  /** Author line, e.g. "Kosmyna et al.". */
  authors: string;
  /** One or two sentences on what the study found. */
  finding: string;
  /** A short quotation from the study, set as a pull quote. */
  pullQuote: string;
  /** URL of the primary source. Opens in a new tab. */
  href: string;
  className?: string;
}

/**
 * A full citation card for the research page: organisation and year, title,
 * authors, the finding, a pull quote, and a link to the primary source.
 *
 * The external link opens in a new tab and carries a visually-hidden
 * "opens in a new tab" cue for screen-reader users (WP-1's `LinkButton` does
 * not provide this).
 */
export function StudyCard({
  org,
  year,
  title,
  authors,
  finding,
  pullQuote,
  href,
  className,
}: StudyCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-5 rounded-lg border border-border bg-surface-raised p-7",
        className,
      )}
    >
      <p className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
        {org}
        <span aria-hidden="true"> · </span>
        {year}
      </p>
      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-2xl font-medium text-text">{title}</h3>
        <p className="text-sm text-text-muted">{authors}</p>
      </div>
      <p className="leading-relaxed text-text">{finding}</p>
      <blockquote className="border-l-2 border-border pl-4 text-lg leading-snug text-text-muted">
        <em>{pullQuote}</em>
      </blockquote>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-accent underline underline-offset-4 hover:no-underline"
      >
        Read the primary source
        <span aria-hidden="true"> ↗</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </article>
  );
}
