import { cn } from "@/lib/cn";

export interface PaperEntryProps {
  /** Short attribution line, e.g. "Gerlich · Societies · 2025". */
  authors: string;
  /** Paper or project title. */
  title: string;
  /** One or two sentences on the finding and why it matters here. */
  summary: string;
  /** Method or confidence badge, e.g. "Correlational · N=666", "Preprint". */
  tag: string;
  /** URL of the primary source. Opens in a new tab. */
  href: string;
  className?: string;
}

/**
 * A compact citation row for the research landscape: lighter than
 * `StudyCard`, meant to run many-to-a-cluster rather than two-to-a-page.
 * Carries the same "method, not just finding" framing as the anchor studies,
 * via the badge, so a skimming reader can tell a 600-person survey from a
 * single unreplicated preprint without opening the link.
 */
export function PaperEntry({
  authors,
  title,
  summary,
  tag,
  href,
  className,
}: PaperEntryProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-2 border-t border-border py-6 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="max-w-xl font-serif text-lg font-medium leading-snug text-text">
          {title}
        </h4>
        <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          {tag}
        </span>
      </div>
      <p className="font-sans text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
        {authors}
      </p>
      <p className="max-w-2xl leading-relaxed text-text-muted">{summary}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-accent underline underline-offset-4 hover:no-underline"
      >
        Read the source
        <span aria-hidden="true"> ↗</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </article>
  );
}
