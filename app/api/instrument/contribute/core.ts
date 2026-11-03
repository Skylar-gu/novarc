/**
 * The contribute route's core, factored out of `route.ts` so it can be tested
 * without a running server or the filesystem (an injectable `dataFile` takes
 * the place of a mock).
 *
 * POST appends one opt-in submission — AI model plus Load/Rigor, no
 * transcript, no identity — as a JSON line to a local file. This is the same
 * storage approach `/api/waitlist` already uses (see that route's comment):
 * no external service, and `data/` is gitignored so nothing lands in version
 * control. On Vercel's serverless filesystem this does not durably persist
 * across deploys or instances; a real backend is a later step, the same
 * caveat the waitlist route already carries.
 *
 * GET reads the file back and returns the per-model aggregate from
 * `lib/instrument/aggregate.ts`. Neither route ever returns another
 * contributor's individual row — only the folded aggregate.
 */

import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  aggregateContributions,
  isAiModel,
  type Contribution,
  type ModelAggregate,
} from "../../../../lib/instrument/aggregate.ts";

const DATA_FILE = path.join(process.cwd(), "data", "instrument-aggregate.jsonl");

export type ContributeErrorCode = "invalid_contribution" | "storage_unavailable";

export interface ContributeResult {
  status: number;
  body: { ok: true } | { ok: false; error: ContributeErrorCode };
}

export interface AggregateResult {
  status: number;
  body: { aggregates: ModelAggregate[] } | { error: "storage_unavailable" };
}

/** Injection points for tests. Production supplies neither. */
export interface ContributeDeps {
  /** Overrides the on-disk path, so tests never touch the real data file. */
  dataFile?: string;
  now?: () => Date;
}

function isScoreOrNull(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1)
  );
}

/** Validate the body down to the three fields that matter, or return null. */
function readContribution(
  body: unknown,
): Pick<Contribution, "model" | "load" | "rigor"> | null {
  if (typeof body !== "object" || body === null) return null;
  const { model, load, rigor } = body as Record<string, unknown>;
  if (!isAiModel(model)) return null;
  if (!isScoreOrNull(load) || !isScoreOrNull(rigor)) return null;
  // At least one signal must carry a value, or there is nothing to aggregate.
  if (load === null && rigor === null) return null;
  return { model, load, rigor };
}

export async function handleContributeRequest(
  body: unknown,
  deps: ContributeDeps = {},
): Promise<ContributeResult> {
  const parsed = readContribution(body);
  if (!parsed) {
    return { status: 422, body: { ok: false, error: "invalid_contribution" } };
  }

  const row: Contribution = {
    ...parsed,
    contributedAt: (deps.now ?? (() => new Date()))().toISOString(),
  };
  const line = `${JSON.stringify(row)}\n`;
  const file = deps.dataFile ?? DATA_FILE;

  try {
    await mkdir(path.dirname(file), { recursive: true });
    await appendFile(file, line, "utf8");
  } catch {
    return { status: 500, body: { ok: false, error: "storage_unavailable" } };
  }

  return { status: 200, body: { ok: true } };
}

export async function handleAggregateRequest(
  deps: ContributeDeps = {},
): Promise<AggregateResult> {
  const file = deps.dataFile ?? DATA_FILE;

  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return { status: 200, body: { aggregates: [] } };
    }
    return { status: 500, body: { error: "storage_unavailable" } };
  }

  const rows: Contribution[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const candidate = JSON.parse(trimmed) as Partial<Contribution>;
      if (
        isAiModel(candidate.model) &&
        isScoreOrNull(candidate.load ?? null) &&
        isScoreOrNull(candidate.rigor ?? null) &&
        typeof candidate.contributedAt === "string"
      ) {
        rows.push({
          model: candidate.model,
          load: candidate.load ?? null,
          rigor: candidate.rigor ?? null,
          contributedAt: candidate.contributedAt,
        });
      }
    } catch {
      // Skip a malformed line rather than failing the whole read.
    }
  }

  return { status: 200, body: { aggregates: aggregateContributions(rows) } };
}
