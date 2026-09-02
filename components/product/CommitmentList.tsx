import type { ReactNode } from "react";

export interface Commitment {
  /** Short principle label, e.g. "Every score opens to its evidence". */
  label: string;
  /** One or two sentences expanding the label. */
  body: ReactNode;
}

export interface CommitmentListProps {
  items: Commitment[];
}

/**
 * The instrument's reporting standard, as a numbered list of commitments.
 * Labels are plain text rather than headings, so the wrapping section's `<h2>`
 * stays the only heading in this block and heading order is not broken.
 */
export function CommitmentList({ items }: CommitmentListProps) {
  return (
    <ol className="flex max-w-2xl flex-col gap-8">
      {items.map((item, index) => (
        <li key={item.label} className="flex gap-4">
          <span
            aria-hidden="true"
            className="mt-1 font-sans text-xs font-medium tabular-nums tracking-[0.22em] text-text-muted"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col gap-2">
            <p className="font-sans text-sm font-medium uppercase tracking-[0.16em] text-text">
              {item.label}
            </p>
            <p className="leading-relaxed text-text-muted">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
