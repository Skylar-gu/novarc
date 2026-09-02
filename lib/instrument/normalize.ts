/**
 * Operations on an already-normalized conversation.
 *
 * This module does NOT parse transcripts — that is P2-3. Everything here takes a
 * `Turn[]` that some parser already produced and provides:
 *   - the `Turn` type (re-exported from `types.ts`, the canonical definition);
 *   - `spanOccursInTurn`, the anti-fabrication check that `validate.ts` runs on
 *     every receipt;
 *   - small turn-slicing helpers.
 */

import type { Turn, TurnRef } from "./types.ts";

export type { Turn, TurnRef } from "./types.ts";

/**
 * Collapse every run of whitespace (spaces, tabs, newlines) to a single space
 * and trim the ends. Used on both sides of a span comparison so that quoting
 * across a line break, or with incidental indentation, still matches.
 */
export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * The anti-fabrication check.
 *
 * Returns true iff `quote`, after collapsing whitespace, occurs as a substring
 * of the cited turn's text, also whitespace-collapsed. The comparison is
 * **case-sensitive** — a receipt must reproduce the person's words, not a
 * paraphrase with altered capitalisation.
 *
 * An empty or whitespace-only quote is never a valid span (it would trivially
 * "occur" in every turn), and a `turnRef` that matches no turn fails.
 */
export function spanOccursInTurn(
  quote: string,
  turnRef: TurnRef,
  turns: Turn[],
): boolean {
  const needle = collapseWhitespace(quote);
  if (needle.length === 0) return false;

  const turn = turnByRef(turns, turnRef);
  if (!turn) return false;

  return collapseWhitespace(turn.text).includes(needle);
}

/** The turn whose `index` equals `ref`, or `undefined`. */
export function turnByRef(turns: Turn[], ref: TurnRef): Turn | undefined {
  return turns.find((turn) => turn.index === ref);
}

/** Every user turn, in order. */
export function userTurns(turns: Turn[]): Turn[] {
  return turns.filter((turn) => turn.role === "user");
}

/** Every assistant turn, in order. */
export function assistantTurns(turns: Turn[]): Turn[] {
  return turns.filter((turn) => turn.role === "assistant");
}

/**
 * The assistant turn immediately preceding the given turn index, or
 * `undefined` when there is none. Used by paste-and-polish detection.
 */
export function precedingAssistantTurn(
  turns: Turn[],
  ref: TurnRef,
): Turn | undefined {
  let found: Turn | undefined;
  for (const turn of turns) {
    if (turn.index >= ref) break;
    if (turn.role === "assistant") found = turn;
  }
  return found;
}
