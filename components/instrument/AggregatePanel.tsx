"use client";

import { useEffect, useState } from "react";
import {
  AI_MODELS,
  MIN_CONTRIBUTIONS_TO_SHOW,
  type ModelAggregate,
} from "@/lib/instrument/aggregate";

type Fetch =
  | { status: "loading" }
  | { status: "ready"; aggregates: ModelAggregate[] }
  | { status: "error" };

const MODEL_LABEL: Record<string, string> = Object.fromEntries(
  AI_MODELS.map((model) => [model.value, model.label]),
);

/** Signal mean 0..1 as a 0–100 string, or a dash when it is null. */
function points(value: number | null): string {
  return value === null
    ? "—"
    : String(Math.round(Math.max(0, Math.min(1, value)) * 100));
}

/**
 * The public, opt-in aggregate: per-model count and mean Load/Rigor, folded
 * from every contribution across everyone who opted in — never one person's
 * own row. Fetches once on mount; the data behind it changes slowly enough
 * that polling would just be noise.
 */
export function AggregatePanel() {
  const [state, setState] = useState<Fetch>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/instrument/contribute")
      .then((res) => {
        if (!res.ok) throw new Error("not ok");
        return res.json() as Promise<{ aggregates: ModelAggregate[] }>;
      })
      .then((body) => {
        if (!cancelled) setState({ status: "ready", aggregates: body.aggregates });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <p className="text-sm text-text-muted">Loading the public aggregate…</p>
    );
  }

  if (state.status === "error") {
    return (
      <p className="text-sm text-text-muted">
        Could not load the public aggregate just now.
      </p>
    );
  }

  if (state.aggregates.length === 0) {
    return (
      <p className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-text-muted">
        No opt-in contributions yet. Score a session above and add it to see
        this fill in.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-text-muted">
        Folded from everyone who opted in on the{" "}
        <q>Add this reading to the public aggregate</q> control above — no
        transcript, no identity, ever. A model&rsquo;s mean is shown once it
        has at least {MIN_CONTRIBUTIONS_TO_SHOW} contributions.
      </p>
      <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface-raised">
        {state.aggregates.map((row) => (
          <li
            key={row.model}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3"
          >
            <span className="font-sans text-sm text-text">
              {MODEL_LABEL[row.model] ?? row.model}
            </span>
            <span className="font-sans text-xs tabular-nums text-text-muted">
              {row.count} contribution{row.count === 1 ? "" : "s"}
            </span>
            <span className="ml-auto font-sans text-sm text-text">
              Load{" "}
              <span className="tabular-nums text-text-muted">
                {points(row.meanLoad)}
              </span>
            </span>
            <span className="font-sans text-sm text-text">
              Rigor{" "}
              <span className="tabular-nums text-text-muted">
                {points(row.meanRigor)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
