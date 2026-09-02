/**
 * The NOVARC Instrument output contract.
 *
 * This file is the single source of truth for the shape every scoring path —
 * the deterministic heuristic engine and the optional LLM judge — must return.
 * It mirrors PHASE2_PLAN.md §2 and PRODUCT.md §7 in intent, verbatim.
 *
 * Terminology:
 *   - A `Turn` is one already-normalized message in the conversation. Transcript
 *     parsing lives elsewhere (P2-3); everything here operates on `Turn[]`.
 *   - A `Receipt` is a verbatim span quoted from the turn it cites. No score is
 *     ever shown without at least one receipt (non-negotiable 0.1).
 *   - A `RawScore` is what a judge (heuristic or LLM) produces *before*
 *     validation. Its receipt spans are not yet guaranteed to be real.
 *   - A `ScoreResult` is a `RawScore` after `validateResult` has checked every
 *     span against its cited turn, dropped fabrications, nulled empty signals,
 *     and stamped the engine mode and time.
 */

/** An index into the normalized `Turn[]`. Matches `Turn.index`. */
export type TurnRef = number;

/** The three signals. `drift` is never scored per-session; see `DriftScore`. */
export type Signal = "load" | "rigor" | "drift";

/** One already-normalized conversation message. Canonical definition; also
 *  re-exported from `normalize.ts`. */
export interface Turn {
  role: "user" | "assistant";
  text: string;
  index: number;
}

/** A verbatim span of the user's own words, with the turn it came from and a
 *  one-sentence reason it supports the signal it is attached to. */
export interface Receipt {
  /** Verbatim substring of the cited turn (whitespace-tolerant on match). */
  quote: string;
  turnRef: TurnRef;
  /** One sentence: why this span supports the signal. */
  rationale: string;
}

/** A scored signal. `receipts` holds at least one entry whenever the signal is
 *  non-null (non-negotiable 0.1). */
export interface SignalScore {
  /** Clamped to the range 0..1 by `validateResult`. */
  value: number;
  receipts: Receipt[];
}

/** The trend signal. Computed client-side from the personal record (P2-4),
 *  never by a scoring engine. Present on `ScoreResult` only once history
 *  exists; the core scoring path always sets `drift: null`. */
export interface DriftScore {
  direction: "strengthening" | "holding" | "eroding";
  /** Signed delta of the trailing window mean vs. the personal baseline. */
  vsBaseline: number;
  windowDays: number;
  /** False until the baseline period is complete; then `direction` is
   *  `"holding"` and `vsBaseline` is 0. */
  baselineReady: boolean;
}

/** One targeted, anchored suggestion for a detected gap (PRODUCT §4). */
export interface Intervention {
  signal: "load" | "rigor";
  /** One specific sentence, anchored to `anchoredTo`. Original prose. */
  prompt: string;
  anchoredTo: TurnRef;
}

/** The fixed output contract. Every scoring path returns exactly this shape. */
export interface ScoreResult {
  scored: boolean;
  reasonIfUnscored: string | null;
  load: SignalScore | null;
  rigor: SignalScore | null;
  drift: DriftScore | null;
  intervention: Intervention | null;
  /** This session followed a prior intervention; excluded from Drift (§4). */
  coached: boolean;
  engineMode: "heuristic" | "llm";
  /** ISO 8601 timestamp set at validation time (injectable clock in tests). */
  scoredAt: string;
}

/**
 * What a judge returns before validation.
 *
 * Same signal and intervention data as `ScoreResult`, but:
 *   - no `engineMode` / `scoredAt` (stamped by `validateResult`);
 *   - `drift` is always `null` (the heuristic engine never computes it, and the
 *     LLM judge is not asked to);
 *   - receipt spans are *claimed*, not yet verified against their turns.
 *
 * When `scored` is `false` the signal fields are `null` and
 * `reasonIfUnscored` carries a plain-language reason (the gate path).
 */
export interface RawScore {
  scored: boolean;
  reasonIfUnscored: string | null;
  load: SignalScore | null;
  rigor: SignalScore | null;
  drift: null;
  intervention: Intervention | null;
  coached: boolean;
}
