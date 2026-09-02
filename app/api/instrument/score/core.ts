/**
 * The scoring route's core, factored out of `route.ts` so it can be tested
 * without a running server, an API key, or the network.
 *
 * `handleScoreRequest` takes an already-parsed request body and returns a
 * status plus a JSON-serialisable payload. It runs the input guards, then
 * scores the transcript: with the LLM judge when a key is present (falling back
 * to the heuristic engine if the judge is unavailable), or with the heuristic
 * engine directly when there is no key. Validation runs on both paths inside
 * `scoreTranscript`, so a fabricated receipt is stripped regardless of engine.
 *
 * Nothing here persists anything, and the transcript is never echoed back.
 */

import { scoreTranscript, type Judge } from "../../../../lib/instrument/score.ts";
import type { ScoreResult, Turn } from "../../../../lib/instrument/types.ts";
import {
  JudgeUnavailableError,
  makeLlmJudge,
} from "../../../../lib/instrument/judge.ts";

/** Total characters of transcript text accepted in one request. */
export const MAX_TRANSCRIPT_CHARS = 60_000;
/** Turns accepted in one request. */
export const MAX_TURNS = 200;

export type ErrorCode =
  | "invalid_request"
  | "invalid_transcript"
  | "transcript_too_large"
  | "scoring_failed";

export interface CoreResult {
  status: number;
  /** Either a `ScoreResult` (200) or `{ error: ErrorCode }`. */
  body: ScoreResult | { error: ErrorCode };
}

/** Injection points for tests. Production supplies neither. */
export interface ScoreDeps {
  /** Overrides `process.env.ANTHROPIC_API_KEY` presence. */
  apiKeyPresent?: boolean;
  /** Overrides the real LLM judge factory. */
  makeJudge?: () => Judge;
  /** Injectable clock, forwarded to scoring. */
  now?: () => Date;
}

interface ScoreRequestBody {
  turns?: unknown;
  coached?: unknown;
  /** Accepted and ignored: Drift is a client-side computation (P2-4). */
  history?: unknown;
}

function errorResult(status: number, error: ErrorCode): CoreResult {
  return { status, body: { error } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrow one array entry to a `Turn`, or return null. */
function asTurn(value: unknown): Turn | null {
  if (!isRecord(value)) return null;
  if (value.role !== "user" && value.role !== "assistant") return null;
  if (typeof value.text !== "string") return null;
  if (typeof value.index !== "number" || !Number.isFinite(value.index)) {
    return null;
  }
  return { role: value.role, text: value.text, index: value.index };
}

/**
 * Validate the body and return a clean `Turn[]` plus the coached flag, or an
 * error result to return as-is.
 */
function readTranscript(
  body: unknown,
): { turns: Turn[]; coached: boolean } | CoreResult {
  if (!isRecord(body)) return errorResult(400, "invalid_request");

  const { turns: turnsIn, coached: coachedIn } = body as ScoreRequestBody;

  if (!Array.isArray(turnsIn) || turnsIn.length === 0) {
    return errorResult(422, "invalid_transcript");
  }
  if (turnsIn.length > MAX_TURNS) {
    return errorResult(413, "transcript_too_large");
  }

  const turns: Turn[] = [];
  let totalChars = 0;
  for (const entry of turnsIn) {
    const turn = asTurn(entry);
    if (!turn) return errorResult(422, "invalid_transcript");
    totalChars += turn.text.length;
    if (totalChars > MAX_TRANSCRIPT_CHARS) {
      return errorResult(413, "transcript_too_large");
    }
    turns.push(turn);
  }

  const coached = coachedIn === true;
  return { turns, coached };
}

export async function handleScoreRequest(
  body: unknown,
  deps: ScoreDeps = {},
): Promise<CoreResult> {
  const parsed = readTranscript(body);
  if ("status" in parsed) return parsed;
  const { turns, coached } = parsed;
  const { now } = deps;

  const apiKeyPresent =
    deps.apiKeyPresent ?? Boolean(process.env.ANTHROPIC_API_KEY);
  const makeJudge = deps.makeJudge ?? (() => makeLlmJudge());

  try {
    let result: ScoreResult;
    if (apiKeyPresent) {
      try {
        result = await scoreTranscript(turns, {
          judge: makeJudge(),
          coached,
          now,
        });
      } catch (err) {
        if (!(err instanceof JudgeUnavailableError)) throw err;
        // Fall back to the heuristic engine. Passing no judge is what makes
        // `scoreTranscript` stamp `engineMode: "heuristic"`.
        result = await scoreTranscript(turns, { coached, now });
      }
    } else {
      result = await scoreTranscript(turns, { coached, now });
    }
    return { status: 200, body: result };
  } catch {
    return errorResult(500, "scoring_failed");
  }
}
