/**
 * POST /api/instrument/score
 *
 * Scores one transcript and returns the fixed `ScoreResult` contract. Stateless:
 * nothing is written, and the transcript is never echoed back. The engine used
 * is reported on `engineMode` — the LLM judge when `ANTHROPIC_API_KEY` is set
 * (falling back to the heuristic engine when the judge is unavailable), the
 * heuristic engine otherwise.
 *
 * Request body: `{ turns: Turn[], coached?: boolean, history?: unknown }`.
 * `history` is accepted and ignored — Drift is computed client-side (P2-4).
 *
 * Responses:
 *   200  ScoreResult
 *   400  { error: "invalid_request" }       body was not JSON, or not an object
 *   422  { error: "invalid_transcript" }    turns missing / malformed
 *   413  { error: "transcript_too_large" }  over the turn or character cap
 *   429  { error: "rate_limited" }          too many requests from one address
 *   500  { error: "scoring_failed" }        unexpected scoring failure
 */

import { handleScoreRequest } from "./core.ts";

export const runtime = "nodejs";

/* --- Lightweight in-memory rate guard. Prototype-grade, per process. ------- */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_IN_WINDOW = 60;
const recentHits = new Map<string, number[]>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "unknown";
}

function isRateLimited(key: string, nowMs: number): boolean {
  const cutoff = nowMs - RATE_WINDOW_MS;
  const hits = (recentHits.get(key) ?? []).filter((t) => t > cutoff);
  hits.push(nowMs);
  recentHits.set(key, hits);
  return hits.length > RATE_MAX_IN_WINDOW;
}

export async function POST(request: Request): Promise<Response> {
  if (isRateLimited(clientKey(request), Date.now())) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const { status, body: payload } = await handleScoreRequest(body);
  return Response.json(payload, { status });
}
