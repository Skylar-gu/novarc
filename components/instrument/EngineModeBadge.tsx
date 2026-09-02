import { cn } from "@/lib/cn";

export interface EngineModeBadgeProps {
  mode: "heuristic" | "llm";
  className?: string;
}

/**
 * A small inline indicator of which engine produced a reading.
 *
 * The wording is deliberately plain. `"llm"` reads "language-model judge", not
 * "measured" or "verified" — a model reading a transcript against the rubric is
 * a judgement, and the prototype should not imply more certainty than that.
 * `"heuristic"` reads "heuristic engine" — deterministic pattern and
 * edit-distance signals, with no model call.
 */
export function EngineModeBadge({ mode, className }: EngineModeBadgeProps) {
  const label = mode === "llm" ? "language-model judge" : "heuristic engine";
  const title =
    mode === "llm"
      ? "A language model read the transcript against the written rubric and cited the passages behind each score."
      : "The deterministic heuristic engine scored this: pattern and edit-distance signals over your turns, with no model call.";

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 font-sans text-xs text-text-muted",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          mode === "llm" ? "bg-accent" : "bg-text-muted",
        )}
      />
      {label}
    </span>
  );
}
