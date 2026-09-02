/**
 * The validation / abstain layer.
 *
 * `validateResult` turns a `RawScore` (from either engine) into the fixed
 * `ScoreResult` contract, enforcing the non-negotiables in code:
 *
 *   - every receipt span must occur verbatim in the turn it cites, else the
 *     receipt is dropped (`spanOccursInTurn`);
 *   - a signal that loses all of its receipts becomes null;
 *   - a non-finite or out-of-range value is clamped to 0..1;
 *   - if both core signals (load and rigor) end up null, the whole result is
 *     unscored;
 *   - an intervention is dropped when its anchor turn does not exist or when
 *     the signal it points at ended up null;
 *   - `drift` is always null here (client-side, P2-4);
 *   - `engineMode` and `scoredAt` are stamped (the clock is injectable).
 */

import type {
  Intervention,
  RawScore,
  Receipt,
  ScoreResult,
  SignalScore,
  Turn,
} from "./types.ts";
import { spanOccursInTurn, turnByRef } from "./normalize.ts";

export interface ValidateOptions {
  engineMode?: "heuristic" | "llm";
  /** Injectable clock. Defaults to the real time. */
  now?: () => Date;
}

const UNSCORED_AFTER_VALIDATION =
  "insufficient evidence after receipt validation";

function keepRealReceipts(receipts: Receipt[], turns: Turn[]): Receipt[] {
  return receipts.filter((receipt) =>
    spanOccursInTurn(receipt.quote, receipt.turnRef, turns),
  );
}

/** Validate one signal: verify its receipts, clamp its value, null it if it
 *  has lost every receipt or carries a non-finite value. */
function validateSignal(
  signal: SignalScore | null,
  turns: Turn[],
): SignalScore | null {
  if (signal === null) return null;
  if (!Number.isFinite(signal.value)) return null;

  const receipts = keepRealReceipts(signal.receipts, turns);
  if (receipts.length === 0) return null;

  const value = Math.min(1, Math.max(0, signal.value));
  return { value, receipts };
}

function validateIntervention(
  intervention: Intervention | null,
  turns: Turn[],
  load: SignalScore | null,
  rigor: SignalScore | null,
): Intervention | null {
  if (intervention === null) return null;

  // Anchor must point at a real turn.
  if (turnByRef(turns, intervention.anchoredTo) === undefined) return null;

  // The signal it explains must have survived validation.
  const target = intervention.signal === "load" ? load : rigor;
  if (target === null) return null;

  return intervention;
}

export function validateResult(
  raw: RawScore,
  turns: Turn[],
  opts: ValidateOptions = {},
): ScoreResult {
  const engineMode = opts.engineMode ?? "heuristic";
  const now = opts.now ?? (() => new Date());
  const scoredAt = now().toISOString();

  // Gate path: the engine already abstained. Carry the reason through.
  if (!raw.scored) {
    return {
      scored: false,
      reasonIfUnscored:
        raw.reasonIfUnscored ?? "insufficient evidence to score this session",
      load: null,
      rigor: null,
      drift: null,
      intervention: null,
      coached: raw.coached,
      engineMode,
      scoredAt,
    };
  }

  const load = validateSignal(raw.load, turns);
  const rigor = validateSignal(raw.rigor, turns);

  // Both core signals gone -> the result cannot stand.
  if (load === null && rigor === null) {
    return {
      scored: false,
      reasonIfUnscored: raw.reasonIfUnscored ?? UNSCORED_AFTER_VALIDATION,
      load: null,
      rigor: null,
      drift: null,
      intervention: null,
      coached: raw.coached,
      engineMode,
      scoredAt,
    };
  }

  return {
    scored: true,
    reasonIfUnscored: null,
    load,
    rigor,
    drift: null,
    intervention: validateIntervention(raw.intervention, turns, load, rigor),
    coached: raw.coached,
    engineMode,
    scoredAt,
  };
}
