"use client";

import { useId } from "react";
import type { DriftScore } from "@/lib/instrument/types";
import type { StoredSession } from "@/lib/instrument/record";
import { BASELINE_MIN } from "@/lib/instrument/drift";
import {
  baselineSpan,
  contiguousRuns,
  runPath,
  scaleX,
  scaleY,
} from "@/components/instrument/driftGeometry";

export interface DriftTrendProps {
  /** Every stored session, oldest first (as `useRecord` returns them). */
  sessions: StoredSession[];
  /** Drift over the record, or `null` when nothing is on record yet. */
  drift: DriftScore | null;
}

const VIEW_W = 640;
const VIEW_H = 280;
const PAD = { top: 28, right: 96, bottom: 40, left: 44 };
const X0 = PAD.left;
const X1 = VIEW_W - PAD.right;
const Y_TOP = PAD.top;
const Y_BOTTOM = VIEW_H - PAD.bottom;

const DIRECTION_WORD: Record<DriftScore["direction"], string> = {
  strengthening: "strengthening",
  holding: "holding",
  eroding: "eroding",
};

/** "+0.04" / "-0.03" / "0". `value` is already rounded by `computeDrift`. */
function signedDelta(value: number): string {
  if (value === 0) return "0";
  return value > 0 ? `+${value}` : `${value}`;
}

/**
 * Inline SVG trend of Load and Rigor across the recorded uncoached sessions —
 * essentially the set `computeDrift` reads (it additionally ignores any
 * future-stamped row when it reports a direction). X is session order; Y is the
 * 0–100 signal scale. The baseline period is a shaded band at the left, and the
 * current direction is stated in words below the chart (or, before the baseline
 * is complete, how many more sessions it needs).
 *
 * Following the dataviz skill: the two series are told apart on three channels,
 * not colour alone — the accent token vs. muted ink, a solid vs. dashed stroke,
 * and a circle vs. square end marker, each with a direct label. Colours are
 * tokens only, so the chart re-cascades with the theme; there is no motion.
 */
export function DriftTrend({ sessions, drift }: DriftTrendProps) {
  const titleId = useId();
  const descId = useId();

  // The trend set: uncoached sessions that carry at least one signal value.
  // `computeDrift` additionally ignores any future-stamped row (clock skew, a
  // bad import) when it reports a direction; such a row can still appear as a
  // point here, so the caption speaks of "recorded uncoached sessions" rather
  // than claiming an exact match with the direction's input.
  const trend = sessions.filter(
    (s) => !s.coached && (s.load !== null || s.rigor !== null),
  );
  const n = trend.length;

  const baselineCount = baselineSpan(n, BASELINE_MIN);
  const baselineReady = drift?.baselineReady ?? false;
  const needed = Math.max(0, BASELINE_MIN - n);

  const directionSentence = (() => {
    if (n === 0) {
      return "Drift begins once you have one scored, uncoached session on record.";
    }
    if (!baselineReady || !drift) {
      return `The baseline needs ${needed} more uncoached ${
        needed === 1 ? "session" : "sessions"
      } before Drift reports a direction. Until then it holds.`;
    }
    return (
      `Against your personal baseline, your independent reasoning is ` +
      `${DIRECTION_WORD[drift.direction]} ` +
      `(${signedDelta(drift.vsBaseline)} on the 0–1 scale, over ${
        drift.windowDays
      } ${drift.windowDays === 1 ? "day" : "days"}).`
    );
  })();

  const box = { x0: X0, x1: X1, yTop: Y_TOP, yBottom: Y_BOTTOM };
  const loadValues = trend.map((s) => s.load);
  const rigorValues = trend.map((s) => s.rigor);
  const loadRuns = contiguousRuns(loadValues);
  const rigorRuns = contiguousRuns(rigorValues);

  const lastVertex = (runs: ReturnType<typeof contiguousRuns>) => {
    const lastRun = runs[runs.length - 1];
    return lastRun ? lastRun[lastRun.length - 1] : null;
  };
  const loadEnd = lastVertex(loadRuns);
  const rigorEnd = lastVertex(rigorRuns);

  // Direct-label y positions, nudged apart if the two ends nearly coincide.
  let loadLabelY = loadEnd ? scaleY(loadEnd.v, Y_TOP, Y_BOTTOM) : null;
  let rigorLabelY = rigorEnd ? scaleY(rigorEnd.v, Y_TOP, Y_BOTTOM) : null;
  if (loadLabelY !== null && rigorLabelY !== null) {
    if (Math.abs(loadLabelY - rigorLabelY) < 14) {
      const mid = (loadLabelY + rigorLabelY) / 2;
      loadLabelY = mid - 8;
      rigorLabelY = mid + 8;
    }
  }

  const xBaselineEnd =
    baselineCount >= 1 ? scaleX(baselineCount - 1, n, X0, X1) : X0;
  const baselineWidth = Math.max(0, xBaselineEnd - X0);
  const baselineBoundaryVisible = baselineCount >= 1 && baselineCount < n;

  const yTicks = [0, 0.5, 1];

  return (
    <figure className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 sm:p-6">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby={`${titleId} ${descId}`}
          className="block h-auto w-full min-w-[520px]"
        >
          <title id={titleId}>
            Load and Rigor across your recorded uncoached sessions, oldest to
            newest
          </title>
          <desc id={descId}>
            One line per signal on a 0 to 100 scale, with session order along the
            horizontal. The shaded band at the left is the baseline period,{" "}
            {baselineCount} of {BASELINE_MIN} sessions.{" "}
            {directionSentence.replace(/–/g, " to ")} Coached sessions are not
            shown; Drift excludes them from the trend.
          </desc>

          {/* Baseline band */}
          {baselineWidth > 0 ? (
            <rect
              x={X0}
              y={Y_TOP}
              width={baselineWidth}
              height={Y_BOTTOM - Y_TOP}
              fill="var(--surface)"
            />
          ) : null}
          {baselineBoundaryVisible ? (
            <line
              x1={xBaselineEnd}
              x2={xBaselineEnd}
              y1={Y_TOP}
              y2={Y_BOTTOM}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ) : null}
          {n > 0 ? (
            <text
              x={X0 + Math.max(baselineWidth / 2, 22)}
              y={Y_TOP - 10}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize={11}
            >
              {baselineReady ? "baseline" : "baseline forming"}
            </text>
          ) : null}

          {/* Y grid + ticks (0..100) */}
          {yTicks.map((t) => {
            const y = scaleY(t, Y_TOP, Y_BOTTOM);
            return (
              <g key={t}>
                <line
                  x1={X0}
                  x2={X1}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth={1}
                  strokeDasharray={t === 0 ? undefined : "2 4"}
                />
                <text
                  x={X0 - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--text-muted)"
                  fontSize={11}
                >
                  {Math.round(t * 100)}
                </text>
              </g>
            );
          })}

          {/* X-axis meaning as words */}
          <text
            x={X0}
            y={Y_BOTTOM + 22}
            textAnchor="start"
            fill="var(--text-muted)"
            fontSize={11}
          >
            earlier
          </text>
          <text
            x={X1}
            y={Y_BOTTOM + 22}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize={11}
          >
            later
          </text>

          {/* Rigor — muted ink, dashed, square markers (drawn first, under Load) */}
          {rigorRuns.map((run, index) => (
            <path
              key={`rigor-${index}`}
              d={runPath(run, n, box)}
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth={2}
              strokeDasharray="5 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {rigorRuns.flat().map((vertex) => {
            const x = scaleX(vertex.i, n, X0, X1);
            const y = scaleY(vertex.v, Y_TOP, Y_BOTTOM);
            return (
              <rect
                key={`rigor-pt-${vertex.i}`}
                x={x - 2.5}
                y={y - 2.5}
                width={5}
                height={5}
                fill="var(--text-muted)"
                stroke="var(--surface-raised)"
                strokeWidth={1}
              />
            );
          })}
          {rigorEnd ? (
            <rect
              x={scaleX(rigorEnd.i, n, X0, X1) - 4}
              y={scaleY(rigorEnd.v, Y_TOP, Y_BOTTOM) - 4}
              width={8}
              height={8}
              fill="var(--text-muted)"
              stroke="var(--surface-raised)"
              strokeWidth={2}
            />
          ) : null}
          {rigorEnd && rigorLabelY !== null ? (
            <text
              x={X1 + 8}
              y={rigorLabelY + 4}
              textAnchor="start"
              fill="var(--text-muted)"
              fontSize={12}
            >
              Rigor
            </text>
          ) : null}

          {/* Load — accent, solid, circle markers */}
          {loadRuns.map((run, index) => (
            <path
              key={`load-${index}`}
              d={runPath(run, n, box)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {loadRuns.flat().map((vertex) => {
            const x = scaleX(vertex.i, n, X0, X1);
            const y = scaleY(vertex.v, Y_TOP, Y_BOTTOM);
            return (
              <circle
                key={`load-pt-${vertex.i}`}
                cx={x}
                cy={y}
                r={2.5}
                fill="var(--accent)"
                stroke="var(--surface-raised)"
                strokeWidth={1}
              />
            );
          })}
          {loadEnd ? (
            <circle
              cx={scaleX(loadEnd.i, n, X0, X1)}
              cy={scaleY(loadEnd.v, Y_TOP, Y_BOTTOM)}
              r={4}
              fill="var(--accent)"
              stroke="var(--surface-raised)"
              strokeWidth={2}
            />
          ) : null}
          {loadEnd && loadLabelY !== null ? (
            <text
              x={X1 + 8}
              y={loadLabelY + 4}
              textAnchor="start"
              fill="var(--text)"
              fontSize={12}
            >
              Load
            </text>
          ) : null}

          {n === 0 ? (
            <text
              x={(X0 + X1) / 2}
              y={(Y_TOP + Y_BOTTOM) / 2}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize={12}
            >
              no sessions on record yet
            </text>
          ) : null}
        </svg>
      </div>

      <figcaption className="flex flex-col gap-2 text-sm leading-relaxed text-text-muted">
        <span className="text-text">{directionSentence}</span>
        <span className="text-xs">
          Two lines, told apart by colour, by solid against dashed, and by a
          round against a square end marker. Load is the share of the thinking
          you carried; Rigor is the quality of your reasoning where you engaged.
          {n > 0 && !baselineReady
            ? " The trend holds until the baseline is complete."
            : ""}
        </span>
      </figcaption>
    </figure>
  );
}
