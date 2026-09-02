/**
 * Test fixtures for the instrument core.
 *
 * Each `.json` file in this directory is a hand-authored `Turn[]` — a synthetic
 * AI conversation written to exercise one behaviour of the scoring engine. They
 * are loaded from disk (not imported as JSON modules) so this file stays a
 * plain `.ts` with no import-attribute friction.
 *
 * `EXPECTATIONS` records the coarse outcome each fixture must produce. Tests
 * assert against bands, not exact values, so heuristic tuning does not make the
 * suite brittle — but the current exact values are noted for reference in
 * `docs/rubrics/` and the P2-1 build report.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Turn } from "../types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

function load(name: string): Turn[] {
  return JSON.parse(readFileSync(join(HERE, `${name}.json`), "utf8")) as Turn[];
}

export type LoadBand = "low" | "mid" | "high";

/** low < 0.4 ≤ mid ≤ 0.7 < high. Mirrors the intervention threshold at 0.4. */
export function loadBand(value: number): LoadBand {
  if (value < 0.4) return "low";
  if (value <= 0.7) return "mid";
  return "high";
}

export interface FixtureExpectation {
  /** What this fixture is for. */
  purpose: string;
  scored: boolean;
  /** Only checked when `scored`. */
  loadBand?: LoadBand;
  /** `true` → Rigor must be non-null; `false` → Rigor must be null; omit → either. */
  rigorScored?: boolean;
  /** Expected intervention signal, or `null` for none. Omit → not asserted. */
  intervention?: "load" | "rigor" | null;
}

export interface Fixture extends FixtureExpectation {
  name: string;
  turns: Turn[];
}

const EXPECTATIONS: Record<string, FixtureExpectation> = {
  "rich-reasoning": {
    purpose:
      "The person frames the problem, names an assumption, asks for a test, engages a counterargument, and revises. Both signals should score; Rigor non-null.",
    scored: true,
    loadBand: "high",
    rigorScored: true,
    intervention: null,
  },
  "pure-lookup": {
    purpose:
      "Three short factual questions. Below the substantive-input floor — must abstain.",
    scored: false,
  },
  "paste-and-polish": {
    purpose:
      "The person requests a paragraph, then pastes the model's text back twice with light edits. Load must read low and an intervention must fire on it; no reasoning move, so Rigor is null.",
    scored: true,
    loadBand: "low",
    rigorScored: false,
    intervention: "load",
  },
  "fluent-but-empty": {
    purpose:
      "Confident, well-organised assertions with no assumption named, no evidence asked, no counter-position engaged. Rigor must abstain (null) rather than score the fluency.",
    scored: true,
    rigorScored: false,
  },
  "too-short": {
    purpose: "A single user turn. Below the turn-count floor — must abstain.",
    scored: false,
  },
  "coached-followup": {
    purpose:
      "A substantive session scored with `coached: true`. `coached` must pass through to the result; the session still scores.",
    scored: true,
    loadBand: "high",
    rigorScored: true,
  },
  "mixed-planning": {
    purpose:
      "A realistic planning session: the person directs and owns the decisions but reasoning moves are sparse. Load high; Rigor may be null under the heuristic.",
    scored: true,
    loadBand: "high",
  },
  "mixed-debugging": {
    purpose:
      "A realistic debugging session: the person corrects the model and identifies a flaw in a shared assumption. Load high; Rigor non-null; an intervention on the weaker signal.",
    scored: true,
    loadBand: "high",
    rigorScored: true,
    intervention: "rigor",
  },
};

export const FIXTURES: Fixture[] = Object.entries(EXPECTATIONS).map(
  ([name, expectation]) => ({
    name,
    turns: load(name),
    ...expectation,
  }),
);

export function fixture(name: keyof typeof EXPECTATIONS): Fixture {
  const found = FIXTURES.find((f) => f.name === name);
  if (!found) throw new Error(`unknown fixture: ${name}`);
  return found;
}
