export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[];

/**
 * Minimal class-name merge helper. Flattens nested arrays, drops falsy values,
 * and joins with a single space. No Tailwind conflict resolution — keep
 * variant sets in the primitive components mutually exclusive instead of
 * relying on "last class wins".
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else {
      out.push(String(input));
    }
  }

  return out.join(" ");
}
