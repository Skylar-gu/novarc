import type { ReactNode } from "react";
import Link from "next/link";

export interface InstrumentTeaserProps {
  /** Small label above the line, e.g. a date. */
  eyebrow: string;
  /** The single serif line. */
  children: ReactNode;
  /** Trailing link. */
  cta: { label: string; href: string };
}

/**
 * A quiet one-line band that points at the first product. Used once on the
 * home page, between the founding principle and the full argument.
 */
export function InstrumentTeaser({ eyebrow, children, cta }: InstrumentTeaserProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="font-sans text-xs font-medium uppercase tracking-[0.22em] text-text-muted">
        {eyebrow}
      </p>
      <p className="max-w-3xl font-serif text-2xl font-medium leading-snug text-text sm:text-3xl">
        {children}
      </p>
      <Link
        href={cta.href}
        className="inline-block font-sans text-sm font-medium text-accent underline underline-offset-4"
      >
        {cta.label}
      </Link>
    </div>
  );
}
