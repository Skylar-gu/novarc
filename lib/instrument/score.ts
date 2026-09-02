/**
 * The scoring entry point.
 *
 * `scoreTranscript` runs the cheap gate, then either the injected `judge` or
 * the deterministic heuristic engine, then always `validateResult`. The judge
 * is injected so this file never imports an SDK and stays unit-testable; the
 * LLM judge itself is P2-2's `judge.ts`.
 *
 * This file must not import `@anthropic-ai/sdk` or anything under `app/`.
 */

import type { RawScore, ScoreResult, Turn } from "./types.ts";
import { runGate, scoreHeuristic } from "./heuristic.ts";
import { rubricPromptText } from "./rubrics.ts";
import { validateResult } from "./validate.ts";

/** A scoring function: transcript + rubric text + options -> raw score.
 *  The heuristic engine matches this shape via a thin adapter below. */
export type Judge = (
  turns: Turn[],
  rubricText: string,
  opts: { coached: boolean },
) => Promise<RawScore>;

export interface ScoreTranscriptOptions {
  /** The person's rolling history. Reserved for parity with the API surface;
   *  Drift is computed client-side (P2-4), so the core path does not use it. */
  history?: unknown;
  /** When supplied, used instead of the heuristic engine. */
  judge?: Judge;
  /** This session followed a prior intervention. */
  coached?: boolean;
  /** Injectable clock, forwarded to validation. */
  now?: () => Date;
}

export async function scoreTranscript(
  turns: Turn[],
  options: ScoreTranscriptOptions = {},
): Promise<ScoreResult> {
  const { judge, now } = options;
  const coached = options.coached ?? false;
  const engineMode: "heuristic" | "llm" = judge ? "llm" : "heuristic";

  // Cheap reject before any judge call.
  const gate = runGate(turns, { coached });
  if (gate) {
    return validateResult(gate, turns, { engineMode, now });
  }

  const raw = judge
    ? await judge(turns, rubricPromptText(), { coached })
    : scoreHeuristic(turns, { coached });

  return validateResult(raw, turns, { engineMode, now });
}
