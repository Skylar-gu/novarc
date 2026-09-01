import { Inter, Newsreader } from "next/font/google";

/**
 * Web fonts, loaded and self-hosted by `next/font/google` at build time.
 *
 * These are stand-ins for NOVARC's licensed faces:
 *   - sans  : Inter        — UI, body copy, navigation, everything by default.
 *   - serif : Newsreader   — accent words and pull quotes, set in its true
 *             italic (not a synthesised slant).
 *
 * Each exposes a CSS custom property (`--font-inter`, `--font-newsreader`) on
 * <html>; `app/globals.css` composes those into `--font-sans` / `--font-serif`
 * with documented fallback stacks. `display: "swap"` keeps text visible while
 * the font loads; the `fallback` arrays are the metrics-matched substitutes.
 */

export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const serif = Newsreader({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  fallback: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
});

export const fontVariables = `${sans.variable} ${serif.variable}`;
