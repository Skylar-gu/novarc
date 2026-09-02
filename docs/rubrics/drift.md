# Rubric — Drift

> Where your thinking is heading.

Drift is the direction of change in independent reasoning across months,
measured against the person's own baseline rather than a population average. It
reports whether independent reasoning is strengthening, holding, or eroding. It
requires a baseline period before it reports anything, and it excludes coached
sessions so it never measures the instrument's own influence.

`lib/instrument/rubrics.ts` is the machine-readable form of this file; the two
must stay in sync.

## Drift is not a per-session score

No scoring engine returns a Drift value. The heuristic engine and the LLM judge
both return `drift: null`. Drift is a computation over the personal record — the
sequence of prior scored, uncoached sessions — and it lives in the client
(`lib/instrument/record.ts`, P2-4), not on the server. The record is the user's:
local, inspectable, exportable, deletable.

## What raises Drift

- Load and Rigor on uncoached sessions trend above the personal baseline across
  the trailing window.
- The person sustains ownership of framing and judgment without prompting from
  the instrument.

## What lowers Drift

- Load and Rigor on uncoached sessions trend below the personal baseline across
  the trailing window.
- Ownership of framing, reasoning, and judgment declines from session to
  session.

## What counts as a span

Drift carries no per-session span. Its evidence is the sequence of prior scored,
uncoached sessions held in the personal record, not any single quoted passage.

## How Drift is computed (v0, client-side)

1. **Baseline** — the mean Load and mean Rigor over the first `BASELINE_MIN`
   (=5) scored, non-coached sessions. Until that many exist, Drift reports
   `baselineReady: false`, `direction: "holding"`, `vsBaseline: 0`.
2. **Trend** — the mean of the trailing window, compared to the baseline.
   Coached sessions are excluded from both the baseline and the trend.
3. **Direction** — `strengthening` / `holding` / `eroding` by a documented
   threshold on the signed delta (see `record.ts`).

The exclusion of coached sessions is what keeps Drift honest: if the instrument
prompts a change and the person acts on it, that session is marked coached and
does not move the trend. Drift measures what the person does on their own.
