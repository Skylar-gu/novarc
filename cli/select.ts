/**
 * Parse a selection expression against a list of `count` numbered items.
 *
 * Accepts a comma / whitespace separated list of 1-based positions and ranges:
 *
 *   "1,3,5-8"      -> [0, 2, 4, 5, 6, 7]   (returned 0-based, sorted, de-duped)
 *   "all" | "*"    -> every index
 *   "" (empty)     -> []                    (caller treats as "cancel")
 *
 * Throws `SelectionError` on anything malformed or out of range, with a message
 * meant to be shown to the person at the prompt.
 */

export class SelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelectionError";
  }
}

export function parseSelection(input: string, count: number): number[] {
  const trimmed = input.trim();
  if (trimmed === "") return [];
  if (trimmed.toLowerCase() === "all" || trimmed === "*") {
    return Array.from({ length: count }, (_unused, i) => i);
  }

  const picked = new Set<number>();
  const tokens = trimmed.split(/[\s,]+/).filter((t) => t.length > 0);

  for (const token of tokens) {
    const range = token.match(/^(\d+)-(\d+)$/);
    if (range) {
      const lo = Number(range[1]);
      const hi = Number(range[2]);
      if (lo < 1 || hi > count) {
        throw new SelectionError(
          `Range ${token} is outside 1-${count}.`,
        );
      }
      if (lo > hi) {
        throw new SelectionError(`Range ${token} runs backwards.`);
      }
      for (let n = lo; n <= hi; n += 1) picked.add(n - 1);
      continue;
    }

    if (/^\d+$/.test(token)) {
      const n = Number(token);
      if (n < 1 || n > count) {
        throw new SelectionError(`${n} is outside 1-${count}.`);
      }
      picked.add(n - 1);
      continue;
    }

    throw new SelectionError(
      `Could not read "${token}". Use numbers, ranges (2-5), "all", or blank to cancel.`,
    );
  }

  return [...picked].sort((a, b) => a - b);
}
