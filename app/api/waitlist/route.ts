import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Waitlist capture. Validates an email address and appends one JSON line to
 * `data/waitlist.jsonl` at the repo root. No external calls — a real backend
 * comes later (SPEC.md Part 4).
 *
 * Responses:
 *   200 { ok: true }                     — stored, or honeypot tripped (no signal)
 *   400 { ok: false, error: "invalid_request" }   — body was not JSON
 *   422 { ok: false, error: "invalid_email" }     — address failed validation
 *   500 { ok: false, error: "storage_unavailable" } — could not write the file
 */

export const runtime = "nodejs";

/** One `@`, a dotted domain, no whitespace. Deliberately permissive. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_UA_LENGTH = 512;

interface WaitlistPayload {
  email?: unknown;
  company?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let payload: WaitlistPayload;
  try {
    payload = (await request.json()) as WaitlistPayload;
  } catch {
    return Response.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  // Honeypot: a real submission never carries this field. Reply 200 with no
  // side effect so automated clients cannot tell they were filtered.
  const honeypot =
    typeof payload.company === "string" ? payload.company.trim() : "";
  if (honeypot.length > 0) {
    return Response.json({ ok: true });
  }

  const email =
    typeof payload.email === "string" ? payload.email.trim() : "";
  if (
    email.length === 0 ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_RE.test(email)
  ) {
    return Response.json(
      { ok: false, error: "invalid_email" },
      { status: 422 },
    );
  }

  const line =
    JSON.stringify({
      email,
      ts: new Date().toISOString(),
      ua: request.headers.get("user-agent")?.slice(0, MAX_UA_LENGTH) ?? null,
    }) + "\n";

  try {
    const dir = path.join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "waitlist.jsonl"), line, "utf8");
  } catch {
    return Response.json(
      { ok: false, error: "storage_unavailable" },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
