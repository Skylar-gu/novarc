/**
 * The opt-in public aggregate: a contributor's AI model and their Load/Rigor
 * values for one session — no transcript text, no identity. `aggregate`
 * folds a list of raw contributions into one row per model; it is the only
 * place that turns individual numbers into the thing the dashboard shows.
 */

export const AI_MODELS = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "claude", label: "Claude" },
  { value: "gemini", label: "Gemini" },
  { value: "other", label: "Other" },
] as const;

export type AiModel = (typeof AI_MODELS)[number]["value"];

export function isAiModel(value: unknown): value is AiModel {
  return AI_MODELS.some((model) => model.value === value);
}

/** One opt-in submission. Deliberately thin: no transcript, no identity. */
export interface Contribution {
  model: AiModel;
  /** Load value 0..1, or null if that signal was not scored. */
  load: number | null;
  /** Rigor value 0..1, or null if that signal was not scored. */
  rigor: number | null;
  /** ISO 8601, stamped at write time. */
  contributedAt: string;
}

export interface ModelAggregate {
  model: AiModel;
  /** Submissions tagged with this model, regardless of the threshold below. */
  count: number;
  /** Mean of the non-null Load values, or null below the threshold or if none. */
  meanLoad: number | null;
  /** Mean of the non-null Rigor values, or null below the threshold or if none. */
  meanRigor: number | null;
}

/**
 * Below this many submissions, a model's row reports its count but suppresses
 * the means — otherwise a handful of early contributions could be read back
 * as one person's own score.
 */
export const MIN_CONTRIBUTIONS_TO_SHOW = 5;

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Fold raw contributions into one row per model that has at least one
 * submission, in `AI_MODELS` order.
 */
export function aggregateContributions(
  rows: readonly Contribution[],
): ModelAggregate[] {
  const byModel = new Map<AiModel, Contribution[]>();
  for (const row of rows) {
    const bucket = byModel.get(row.model);
    if (bucket) bucket.push(row);
    else byModel.set(row.model, [row]);
  }

  const result: ModelAggregate[] = [];
  for (const { value: model } of AI_MODELS) {
    const bucket = byModel.get(model);
    if (!bucket || bucket.length === 0) continue;

    const enough = bucket.length >= MIN_CONTRIBUTIONS_TO_SHOW;
    result.push({
      model,
      count: bucket.length,
      meanLoad: enough
        ? mean(
            bucket
              .map((row) => row.load)
              .filter((value): value is number => value !== null),
          )
        : null,
      meanRigor: enough
        ? mean(
            bucket
              .map((row) => row.rigor)
              .filter((value): value is number => value !== null),
          )
        : null,
    });
  }
  return result;
}
