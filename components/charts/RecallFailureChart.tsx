import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * Figure 1 — "Recall failure after AI-assisted writing, by group".
 *
 * Source study: Kosmyna et al., *Your Brain on ChatGPT*, MIT Media Lab, 2025
 * (EEG study, n=54, three groups: LLM / search engine / unaided). The study
 * reported that, asked to quote one sentence from the essay they had just
 * written, most of the LLM group could not, while the other two groups largely
 * could. Bar heights follow the first-session figures reported in the paper and
 * are shown to convey that direction, not as exact rates — see the caption.
 *
 * Emphasis form (dataviz skill): one series, nominal categories, the group the
 * finding is about carried in the accent token and the two context bars in a
 * muted ink token. No categorical palette, so no legend and no palette
 * validator run is required. Every bar is directly labelled, so the value is
 * never gated behind interaction. Static SVG: no motion to reduce.
 */

interface Bar {
  /** Category label, one entry per rendered line. */
  label: string[];
  /** Reported share, as a percentage. */
  value: number;
  /** Carry this bar in the accent token; others in muted ink. */
  emphasis?: boolean;
}

const BARS: Bar[] = [
  { label: ["Wrote with", "an LLM"], value: 83, emphasis: true },
  { label: ["Wrote with a", "search engine"], value: 11 },
  { label: ["Wrote", "unaided"], value: 11 },
];

const VIEW_W = 640;
const VIEW_H = 400;
const PLOT = { top: 28, right: 20, bottom: 84, left: 60 };
const PLOT_W = VIEW_W - PLOT.left - PLOT.right;
const PLOT_H = VIEW_H - PLOT.top - PLOT.bottom;
const BAR_W = 56;
const TICKS = [0, 25, 50, 75, 100];

function yFor(value: number): number {
  return PLOT.top + PLOT_H * (1 - value / 100);
}

/** Bar with a 4px-rounded top edge and a square foot on the baseline. */
function barPath(x: number, y: number, w: number, h: number, r = 4): string {
  const radius = Math.min(r, h, w / 2);
  const bottom = y + h;
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${bottom}`,
    "Z",
  ].join(" ");
}

export interface RecallFailureChartProps {
  className?: string;
}

export function RecallFailureChart({ className }: RecallFailureChartProps) {
  const bandW = PLOT_W / BARS.length;

  return (
    <figure
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-6",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="recall-failure-title recall-failure-desc"
          className="block h-auto w-full min-w-[520px]"
          style={
            {
              // Local numeric-alignment hint for the tick column only.
              fontVariantNumeric: "tabular-nums",
            } as CSSProperties
          }
        >
          <title id="recall-failure-title">
            Share of writers who could not quote a sentence from the essay they
            had just written, by writing method
          </title>
          <desc id="recall-failure-desc">
            Bar chart. Writers who used a large language model: about 83 percent
            could not quote their own essay. Writers who used a search engine:
            about 11 percent. Writers who worked unaided: about 11 percent.
            First-session figures reported by Kosmyna and colleagues, 2025;
            shown to convey the reported direction rather than exact rates.
          </desc>

          {/* Y-axis title: what the percentage is a share of. */}
          <text
            transform={`rotate(-90 16 ${PLOT.top + PLOT_H / 2})`}
            x={16}
            y={PLOT.top + PLOT_H / 2}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize={12}
          >
            Could not quote their own sentence
          </text>

          {/* Gridlines and y-axis ticks */}
          {TICKS.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line
                  x1={PLOT.left}
                  x2={PLOT.left + PLOT_W}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={PLOT.left - 10}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="var(--text-muted)"
                  fontSize={12}
                >
                  {tick}
                  {tick === 100 ? "%" : ""}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {BARS.map((bar, index) => {
            const bandCentre = PLOT.left + bandW * (index + 0.5);
            const x = bandCentre - BAR_W / 2;
            const y = yFor(bar.value);
            const h = PLOT.top + PLOT_H - y;
            return (
              <g key={bar.label.join(" ")}>
                <path
                  d={barPath(x, y, BAR_W, h)}
                  fill={bar.emphasis ? "var(--accent)" : "var(--text-muted)"}
                />
                <text
                  x={bandCentre}
                  y={y - 10}
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize={14}
                  fontWeight={600}
                >
                  ~{bar.value}%
                </text>
                {bar.label.map((line, lineIndex) => (
                  <text
                    key={line}
                    x={bandCentre}
                    y={PLOT.top + PLOT_H + 24 + lineIndex * 17}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize={13}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={PLOT.left}
            x2={PLOT.left + PLOT_W}
            y1={PLOT.top + PLOT_H}
            y2={PLOT.top + PLOT_H}
            stroke="var(--text-muted)"
            strokeWidth={1}
          />
        </svg>
      </div>

      <figcaption className="flex flex-col gap-2 text-sm leading-relaxed text-text-muted">
        <span>
          Asked to quote a single sentence from the essay they had just
          finished, far more of the writers who had worked through a chatbot
          could not. The bars follow the first-session figures reported in the
          study and are drawn to show that direction, not exact rates.
        </span>
        <span className="text-xs">
          Source: Kosmyna et al., <cite>Your Brain on ChatGPT</cite>, MIT Media
          Lab, 2025. EEG study, n=54, three groups.
        </span>
      </figcaption>
    </figure>
  );
}
