/**
 * Locate a receipt's quoted span inside the turn it cites, so the UI can show a
 * line of surrounding context around the quote.
 *
 * The scoring engines validate every span against its turn with a
 * whitespace-tolerant match (`spanOccursInTurn`), so a quote that passed
 * validation is present in the turn but its whitespace may not be byte-identical
 * (a reflow, a collapsed newline). The match here is tolerant the same way:
 * the quote's word sequence is turned into a `\s+`-separated pattern.
 */

/** Turn a quote into a whitespace-tolerant regExp source matching its words. */
function toTolerantPattern(quote: string): string | null {
  const words = quote.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  return words
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
}

export interface ReceiptContext {
  /** Text immediately before the quote, whitespace collapsed. */
  before: string;
  /** The matched span as it appears in the turn, whitespace collapsed. */
  match: string;
  /** Text immediately after the quote, whitespace collapsed. */
  after: string;
  /** True when `before` was cut from a longer lead-in. */
  leadClipped: boolean;
  /** True when `after` was cut from a longer tail. */
  trailClipped: boolean;
}

/**
 * Return up to `pad` characters of context on each side of the quote within
 * `turnText`, or `null` when the quote cannot be located (the caller then shows
 * the quote alone). Whitespace in every returned piece is collapsed to single
 * spaces so it renders as one line.
 */
export function receiptContext(
  turnText: string,
  quote: string,
  pad = 96,
): ReceiptContext | null {
  const pattern = toTolerantPattern(quote);
  if (!pattern) return null;

  let match: RegExpExecArray | null;
  try {
    match = new RegExp(pattern).exec(turnText);
  } catch {
    return null;
  }
  if (!match) return null;

  const start = match.index;
  const end = start + match[0].length;

  const leadStart = Math.max(0, start - pad);
  const trailEnd = Math.min(turnText.length, end + pad);

  const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

  return {
    before: collapse(turnText.slice(leadStart, start)),
    match: collapse(match[0]),
    after: collapse(turnText.slice(end, trailEnd)),
    leadClipped: leadStart > 0,
    trailClipped: trailEnd < turnText.length,
  };
}
