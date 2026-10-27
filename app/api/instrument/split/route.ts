/**
 * POST /api/instrument/split
 *
 * Fallback for a pasted conversation the client-side heuristics in
 * `lib/instrument/parsers/` could not segment into turns. Sends the raw text
 * to a smaller model once (`openrouterSplit.ts` when `OPENROUTER_API_KEY` is
 * set, else `llmSplit.ts`), gets back `Turn[]`, and returns it. Nothing is
 * persisted. The free, local, synchronous heuristics remain the default path;
 * this route is only called from the client after those have already failed,
 * and only does anything useful when `OPENROUTER_API_KEY` or
 * `ANTHROPIC_API_KEY` is set.
 *
 * Request body: `{ text: string }`.
 *
 * Responses:
 *   200  { turns: Turn[] }
 *   400  { error: "invalid_request" }        body was not JSON, or not an object
 *   422  { error: "invalid_transcript" }     text missing or empty
 *   413  { error: "transcript_too_large" }   over the character cap
 *   429  { error: "rate_limited" }           too many requests from one address
 *   503  { error: "split_unavailable" }      no OPENROUTER_API_KEY or ANTHROPIC_API_KEY configured
 *   502  { error: "split_failed" }           the model(s) could not split it
 */

import { handleSplitRequest } from "./core.ts";

export const runtime = "nodejs";

/* --- Lightweight in-memory rate guard. Prototype-grade, per process. ------- */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_IN_WINDOW = 30;
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

  const { status, body: payload } = await handleSplitRequest(body);
  return Response.json(payload, { status });
}
