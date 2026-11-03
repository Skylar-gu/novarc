"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AI_MODELS, type AiModel } from "@/lib/instrument/aggregate";

type Status = "idle" | "pending" | "success" | "error";

export interface ContributeCardProps {
  /** Load value 0..1, or null if that signal was not scored. */
  load: number | null;
  /** Rigor value 0..1, or null if that signal was not scored. */
  rigor: number | null;
}

/**
 * Opt-in: add this session's Load/Rigor, tagged with which AI model it came
 * from, to the public aggregate. No transcript text and no identity ever
 * leave the browser for this — only the two numbers already shown above and
 * the model picked below. Off by default; nothing is sent until the person
 * picks a model and presses the button.
 */
export function ContributeCard({ load, rigor }: ContributeCardProps) {
  const [model, setModel] = useState<AiModel | "">("");
  const [status, setStatus] = useState<Status>("idle");
  const fieldId = useId();

  async function handleSubmit() {
    if (!model || status === "pending") return;
    setStatus("pending");
    try {
      const res = await fetch("/api/instrument/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, load, rigor }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-text">
        Added to the public aggregate. Thanks — no transcript or identity went
        with it, only the model and the two numbers above.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <h3 className="font-sans text-sm font-medium text-text">
        Add this reading to the public aggregate
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-text-muted">
        Opt-in. Only the Load/Rigor numbers above and which AI you used — no
        transcript, no identity.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label htmlFor={fieldId} className="sr-only">
          Which AI model this session used
        </label>
        <select
          id={fieldId}
          value={model}
          disabled={status === "pending"}
          onChange={(event) => setModel(event.target.value as AiModel)}
          className="h-9 rounded-full border border-border bg-surface-raised px-3 text-sm text-text disabled:opacity-50"
        >
          <option value="" disabled>
            Which AI?
          </option>
          {AI_MODELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!model || status === "pending"}
          onClick={handleSubmit}
        >
          {status === "pending" ? "Adding…" : "Add to the aggregate"}
        </Button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-2 min-h-[1.25rem] text-sm text-text-muted"
      >
        {status === "error"
          ? "Could not add that just now. You can try again."
          : ""}
      </p>
    </div>
  );
}
