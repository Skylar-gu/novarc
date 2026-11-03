/**
 * POST /api/instrument/contribute
 *
 * Opt-in only: stores one submission's AI model and Load/Rigor values to the
 * public aggregate. No transcript, no identity — see `core.ts`. Storage is a
 * local JSONL file, the same prototype-grade approach `/api/waitlist` already
 * uses; not durable on a serverless filesystem, a real backend is later.
 *
 * Request body: `{ model: AiModel, load: number | null, rigor: number | null }`.
 *
 * Responses:
 *   200  { ok: true }
 *   400  { ok: false, error: "invalid_request" }        body was not JSON
 *   422  { ok: false, error: "invalid_contribution" }   model/load/rigor missing or malformed
 *   429  { ok: false, error: "rate_limited" }            too many requests from one address
 *   500  { ok: false, error: "storage_unavailable" }     could not write the file
 *
 * GET /api/instrument/contribute
 *
 * Reads the aggregate back. Never returns an individual contributor's row.
 *
 * Responses:
 *   200  { aggregates: ModelAggregate[] }
 *   500  { error: "storage_unavailable" }
 */

import { handleAggregateRequest, handleContributeRequest } from "./core.ts";

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
    return Response.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const { status, body: payload } = await handleContributeRequest(body);
  return Response.json(payload, { status });
}

export async function GET(): Promise<Response> {
  const { status, body } = await handleAggregateRequest();
  return Response.json(body, { status });
}
