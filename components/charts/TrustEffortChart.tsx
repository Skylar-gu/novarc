import { cn } from "@/lib/cn";

/**
 * Figure 2 — "Trust in AI vs. self-reported critical-thinking effort".
 *
 * Source study: Lee et al., *The Impact of Generative AI on Critical Thinking*,
 * Microsoft Research and Carnegie Mellon University, CHI 2025 (survey of 319
 * knowledge workers over 936 first-hand uses of generative AI at work). The
 * study reported two opposing associations: higher confidence in the AI went
 * with less self-reported critical-thinking effort; higher confidence in one's
 * own judgment went with more.
 *
 * Slope / dumbbell chart, not a continuous relationship plot. The paper
 * reports a regression coefficient for each association — a direction and a
 * magnitude of linear association — not a fitted curve, so the shape of the
 * relationship between the two ends (linear, threshold, diminishing returns,
 * non-monotonic) is not evidence the paper provides. A continuous line swept
 * across the full axis would assert a smooth function it cannot back up. This
 * draws only two anchored points per series — lower- and higher-confidence
 * groups — joined by a dashed connector that reads as "direction known, path
 * between them unknown," never a measured trajectory.
 *
 * The two series are told apart by three channels, not colour alone — the
 * accent vs. muted-ink tokens, distinct end markers (circle vs. square, each
 * with a 2px surface ring) at *both* anchor points, and a direct label on each
 * series plus a legend. Axes carry no numeric scale, so no precise measurement
 * is implied. Static SVG: no motion to reduce.
 */

const VIEW_W = 640;
const VIEW_H = 380;
const PLOT = { top: 36, right: 32, bottom: 104, left: 64 };
const PLOT_W = VIEW_W - PLOT.left - PLOT.right;
const PLOT_H = VIEW_H - PLOT.top - PLOT.bottom;

const X0 = PLOT.left;
const X1 = PLOT.left + PLOT_W;
const Y_AXIS_BOTTOM = PLOT.top + PLOT_H;
const INSET = 24;
const Y_TOP = PLOT.top + INSET;
const Y_BOTTOM = Y_AXIS_BOTTOM - INSET;

export interface TrustEffortChartProps {
  className?: string;
}

export function TrustEffortChart({ className }: TrustEffortChartProps) {
  return (
    <figure
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6",
        className,
      )}
    >
      <h3 className="font-sans text-lg font-semibold text-text">
        Confidence in the AI vs. confidence in one&rsquo;s own judgment
      </h3>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="trust-effort-title trust-effort-desc"
          className="block h-auto w-full min-w-[540px]"
        >
          <title id="trust-effort-title">
            Two opposing associations reported between a worker&rsquo;s
            confidence and their self-reported critical-thinking effort,
            compared between lower- and higher-confidence groups
          </title>
          <desc id="trust-effort-desc">
            Schematic slope chart with no numeric scale, comparing two groups —
            lower confidence and higher confidence — rather than a continuous
            curve. Workers with higher confidence in the AI self-reported less
            critical-thinking effort than those with lower confidence in it.
            Workers with higher confidence in their own judgment self-reported
            more effort than those with lower confidence in it. The directions
            are those reported by Lee and colleagues, CHI 2025, who reported a
            regression coefficient for each, not a fitted curve; the dashed
            connectors mark that the shape of the relationship between the two
            groups is not established, only its direction.
          </desc>

          {/* Y-axis only — the x-position is two discrete groups, not a
             continuous scale, so no x-axis line is drawn. */}
          <line
            x1={X0}
            x2={X0}
            y1={PLOT.top}
            y2={Y_AXIS_BOTTOM}
            stroke="var(--border)"
            strokeWidth={1}
          />
          {/* Category ticks at the two anchor points only. */}
          <line
            x1={X0}
            x2={X0}
            y1={Y_AXIS_BOTTOM}
            y2={Y_AXIS_BOTTOM + 6}
            stroke="var(--border)"
            strokeWidth={1}
          />
          <line
            x1={X1}
            x2={X1}
            y1={Y_AXIS_BOTTOM}
            y2={Y_AXIS_BOTTOM + 6}
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Y-axis: meaning as words, plus a rotated title */}
          <text
            x={X0 - 10}
            y={PLOT.top + 4}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize={12}
          >
            more
          </text>
          <text
            x={X0 - 10}
            y={Y_AXIS_BOTTOM}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize={12}
          >
            less
          </text>
          <text
            transform={`rotate(-90 16 ${PLOT.top + PLOT_H / 2})`}
            x={16}
            y={PLOT.top + PLOT_H / 2}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize={12}
          >
            Self-reported critical-thinking effort
          </text>

          {/* X-axis: two discrete groups, not a continuous scale */}
          <text
            x={X0}
            y={Y_AXIS_BOTTOM + 24}
            textAnchor="start"
            fill="var(--text-muted)"
            fontSize={12}
          >
            lower-confidence group
          </text>
          <text
            x={X1}
            y={Y_AXIS_BOTTOM + 24}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize={12}
          >
            higher-confidence group
          </text>

          {/* Series A — confidence in the AI: higher-confidence group reports
             less effort than the lower-confidence group. Dashed: only the two
             endpoints are evidenced, not the path between them. */}
          <line
            x1={X0}
            x2={X1}
            y1={Y_TOP}
            y2={Y_BOTTOM}
            stroke="var(--text-muted)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="2 5"
          />
          <rect
            x={X0 - 5}
            y={Y_TOP - 5}
            width={10}
            height={10}
            fill="var(--text-muted)"
            stroke="var(--surface-raised)"
            strokeWidth={2}
          />
          <rect
            x={X1 - 5}
            y={Y_BOTTOM - 5}
            width={10}
            height={10}
            fill="var(--text-muted)"
            stroke="var(--surface-raised)"
            strokeWidth={2}
          />
          <text
            x={X1 - 14}
            y={Y_BOTTOM + 16}
            textAnchor="end"
            fill="var(--text-muted)"
            fontSize={13}
          >
            Confidence in the AI
          </text>

          {/* Series B — confidence in one's own judgment: higher-confidence
             group reports more effort than the lower-confidence group. */}
          <line
            x1={X0}
            x2={X1}
            y1={Y_BOTTOM}
            y2={Y_TOP}
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="2 5"
          />
          <circle
            cx={X0}
            cy={Y_BOTTOM}
            r={5}
            fill="var(--accent)"
            stroke="var(--surface-raised)"
            strokeWidth={2}
          />
          <circle
            cx={X1}
            cy={Y_TOP}
            r={5}
            fill="var(--accent)"
            stroke="var(--surface-raised)"
            strokeWidth={2}
          />
          <text
            x={X1 - 14}
            y={Y_TOP - 12}
            textAnchor="end"
            fill="var(--text)"
            fontSize={13}
          >
            Confidence in one&rsquo;s own judgment
          </text>

          {/* Legend */}
          <g transform={`translate(${X0}, ${Y_AXIS_BOTTOM + 52})`}>
            <line
              x1={0}
              x2={22}
              y1={0}
              y2={0}
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="2 5"
            />
            <text
              x={30}
              y={0}
              dominantBaseline="central"
              fill="var(--text-muted)"
              fontSize={12}
            >
              Confidence in one&rsquo;s own judgment &rarr; more effort
            </text>
            <line
              x1={0}
              x2={22}
              y1={22}
              y2={22}
              stroke="var(--text-muted)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="2 5"
            />
            <text
              x={30}
              y={22}
              dominantBaseline="central"
              fill="var(--text-muted)"
              fontSize={12}
            >
              Confidence in the AI &rarr; less effort
            </text>
          </g>
        </svg>
      </div>

      <figcaption className="flex flex-col gap-2 text-sm leading-relaxed text-text-muted">
        <span>
          Across the tasks surveyed, the two kinds of confidence pulled in
          opposite directions: trust placed in the tool went with less scrutiny
          of its output, while trust in one&rsquo;s own judgment went with more.
          The study reports this as a regression coefficient, not a curve, so
          the dashed lines here compare only two groups — lower- and
          higher-confidence — and carry the reported direction, not a measured
          shape in between.
        </span>
        <span className="text-xs">
          Source: Lee et al.,{" "}
          <cite>The Impact of Generative AI on Critical Thinking</cite>,
          Microsoft Research and Carnegie Mellon University, CHI 2025. Survey of
          319 knowledge workers over 936 tasks.
        </span>
      </figcaption>
    </figure>
  );
}
