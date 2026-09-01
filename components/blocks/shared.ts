/**
 * Small helpers shared across the `components/blocks/**` library. Kept
 * dependency-free and server-safe (no `"use client"`).
 */

/**
 * Zero-pad an index for the recurring numbered-section / numbered-card motif.
 *
 * @example formatIndex(3) // "03"
 */
export function formatIndex(index: number): string {
  return Math.trunc(Math.abs(index)).toString().padStart(2, "0");
}
