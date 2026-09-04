/**
 * Plain-text rendering for the CLI. Every function here takes data and returns a
 * string, so the output is easy to test and the I/O stays in `main.ts`.
 */

import type { DriftScore, ScoreResult } from "../lib/instrument/types.ts";
import type { SessionSummary } from "./discover.ts";

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

function padStart(text: string, width: number): string {
  return text.length >= width ? text : " ".repeat(width - text.length) + text;
}

function shortDate(iso: string | null): string {
  if (!iso) return "     ?";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "     ?";
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${month} ${padStart(String(d.getUTCDate()), 2)}`;
}

function clip(text: string, width: number): string {
  return text.length > width ? `${text.slice(0, width - 1)}…` : text;
}

/** The numbered picker list. */
export function formatSessionList(sessions: SessionSummary[]): string {
  if (sessions.length === 0) return "No Claude Code sessions found.";

  const numWidth = String(sessions.length).length;
  const lines = sessions.map((s, i) => {
    const n = padStart(String(i + 1), numWidth);
    const turns = padStart(`${s.userTurns}u`, 4);
    const when = shortDate(s.endedAt);
    return `  ${n}. ${pad(clip(s.title, 56), 56)}  ${turns}  ${when}`;
  });
  return lines.join("\n");
}

function pct(value: number): string {
  return `${padStart(String(Math.round(value * 100)), 3)}%`;
}

/** One line per scored (or abstained) session. */
export function formatReading(title: string, result: ScoreResult): string {
  const head = `  ${pad(clip(title, 44), 44)}`;
  if (!result.scored) {
    return `${head}  unscored — ${result.reasonIfUnscored ?? "no reason given"}`;
  }
  const load = result.load ? `Load ${pct(result.load.value)}` : "Load    —";
  const rigor = result.rigor ? `Rigor ${pct(result.rigor.value)}` : "Rigor    —";
  const iv = result.intervention ? `  ↳ ${result.intervention.signal} prompt` : "";
  return `${head}  ${load}   ${rigor}${iv}`;
}

/** The Drift line, computed over the whole record. */
export function formatDrift(drift: DriftScore | null): string {
  if (!drift) {
    return "Drift: not enough scored sessions yet.";
  }
  if (!drift.baselineReady) {
    return "Drift: baseline still forming — needs at least 5 uncoached scored sessions.";
  }
  const sign = drift.vsBaseline > 0 ? "+" : "";
  return `Drift: ${drift.direction} (${sign}${drift.vsBaseline} vs baseline, spanning ${drift.windowDays}d)`;
}

/** The intervention text, shown in full under the readings when present. */
export function formatInterventions(
  readings: { title: string; result: ScoreResult }[],
): string {
  const withIv = readings.filter((r) => r.result.intervention);
  if (withIv.length === 0) return "";
  const blocks = withIv.map(({ title, result }) => {
    const iv = result.intervention;
    if (!iv) return "";
    return `  ${title}\n  [${iv.signal}, turn ${iv.anchoredTo}] ${iv.prompt}`;
  });
  return ["Prompts:", ...blocks].join("\n\n");
}
