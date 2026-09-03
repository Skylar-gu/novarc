# INSTRUMENT_PROTOTYPE — what Phase 2 built

The reference for the working prototype at `/instrument`. It records the
architecture, the two scoring engines, the rubric summaries, the privacy
decision, how to enable the language-model judge, and what is deliberately not
done yet.

Companion documents: [`RESEARCH.md`](RESEARCH.md) for the evidence base and its
limits, [`INTERVENTIONS.md`](INTERVENTIONS.md) for every prompt the instrument
can return and the technique behind it, [`VALIDATION.md`](VALIDATION.md) for the
test program and current numbers.

---

## What it is

`/instrument` is a prototype of the reading described in
[`PRODUCT.md`](PRODUCT.md). It is the buildable slice of PRODUCT §7: one AI
conversation transcript in, and back come Load, Rigor, the passages behind each
score, an optional single prompt, and — from the local record — Drift. It
abstains when the evidence is thin.

It is **not** the validated instrument. Its scores have not been checked against
trained human raters, the language-model path has not been exercised against a
live key in this environment, and it should be read as a demonstration of the
method rather than a measurement to rely on. Validation is Phase 3 (see
[`VALIDATION.md`](VALIDATION.md), written under P2-7).

The larger thesis this connects to — generative coupling, the coupling-mode
layer, reasoning-first models — is [`VISION.md`](VISION.md) §4 and is out of
scope for the prototype.

---

## Architecture

The transcript is parsed to a normalized `Turn[]`, gated, scored by one of two
engines, validated (every receipt span must occur verbatim in the turn it
cites), and returned as a `ScoreResult`. Nothing is persisted server-side. The
client writes the derived scores to `localStorage` and computes Drift from that
record.

```mermaid
flowchart TD
  A[Transcript: raw text, ChatGPT export, Claude export, or generic JSON] --> B[parse: lib/instrument/parsers]
  B --> C[normalize: Turn[] = role, text, index]
  C --> D{gate: enough to score?}
  D -- no --> U[unscored, with a reason]
  D -- yes --> E{ANTHROPIC_API_KEY set?}
  E -- no --> H[heuristic engine: lib/instrument/heuristic.ts]
  E -- yes --> J[LLM judge: lib/instrument/judge.ts]
  J -- any failure --> H
  H --> V[validate: lib/instrument/validate.ts, strips fabricated receipts]
  J --> V
  U --> V
  V --> R[ScoreResult: lib/instrument/types.ts]
  R --> REC[client record: lib/instrument/record.ts, localStorage]
  REC --> DR[Drift: lib/instrument/drift.ts, client-side]
```

- **Parse / normalize** — `lib/instrument/parsers/` (`detectAndParse` tries JSON
  shapes first, then plain text); output is `Turn[]` from
  `lib/instrument/normalize.ts`.
- **Gate + score + validate** — `lib/instrument/score.ts` runs the gate, calls
  the injected judge or the heuristic engine, then `validateResult`. The API
  route (`app/api/instrument/score/core.ts`) chooses the engine: LLM judge when
  `ANTHROPIC_API_KEY` is present, falling back to the heuristic engine on any
  `JudgeUnavailableError`; heuristic directly when there is no key. Validation
  runs on both paths.
- **Record + Drift** — `lib/instrument/record.ts` stores one small
  `StoredSession` per scored session under `novarc:instrument:v1`;
  `lib/instrument/drift.ts` computes the trend from that record in the browser.
  The server never sees the record and never computes Drift.

`engineMode: "heuristic" | "llm"` travels on every result; the UI labels which
engine actually ran.

---

## The two engines

Both return the identical output contract — `ScoreResult` in
`lib/instrument/types.ts` — and both must attach real spans. Only the fidelity
and the determinism differ.

### Heuristic engine — always on

`lib/instrument/heuristic.ts`. Deterministic: the same transcript returns the
same score every time. It is the executable form of the written rubrics in
[`docs/rubrics/`](rubrics/). Load is built from four weighted components
(substantive-token share with pasted text excluded, a paste-and-polish penalty,
an opening-turn read, a later-turn engagement fraction). Rigor is detected from
five reasoning-move categories by phrase patterns over the user's turns, scored
by move density, and abstains to `null` when no move is present.

Known conservatism: it reads surface features only. Phrase matching under-reads
genuine reasoning that does not use the expected wording, and it cannot tell a
confidently asserted position from a carefully reasoned one. Expect it to
abstain or score low on real sessions a careful human rater would score higher.
This is the intended failure direction — under-read rather than over-credit.

### LLM judge — optional

`lib/instrument/judge.ts`. `makeLlmJudge()` builds the prompt from the rubric
text and calls `client.messages.parse()` with a JSON-schema output format
(values 0..1, spans, turn refs, rationales), `thinking: { type: "adaptive" }`,
and the model from `INSTRUMENT_MODEL` (default `claude-opus-5`). It takes one
retry on unparseable output, then throws `JudgeUnavailableError` on any
failure — network, rate limit, auth, or schema mismatch. The route catches that
and falls back to the heuristic engine, so the absence or failure of the judge
degrades to a heuristic reading with a visible mode flag, never to an error.

The judge does not verify its own spans. `score.ts` routes every raw score
through `validateResult`, which is the single place a fabricated receipt is
caught and dropped.

### Interventions

For a signal below the intervention threshold, the heuristic engine returns one
of four fixed prompts (the LLM judge writes its own). Each maps to an
established technique from the learning and judgment literature — the generation
effect, considering the opposite, productive failure, self-explanation —
documented prompt by prompt in [`INTERVENTIONS.md`](INTERVENTIONS.md), with the
honest caveat that a technique's effect *as a one-line chat prompt* is not yet
shown and is what Phase 3 tests.

---

## The rubrics

The written rubrics live in [`docs/rubrics/`](rubrics/); `lib/instrument/rubrics.ts`
is their machine-readable form and the two must stay in sync.

- **Load** ([`load.md`](rubrics/load.md)) — the share of the thinking the person
  carried: framing the problem, generating the reasoning, judging it, reaching
  the conclusion. A measure of ownership, not text volume. A short exchange the
  person framed and drove can read high; a long paste-and-polish session reads
  low.
- **Rigor** ([`rigor.md`](rubrics/rigor.md)) — the quality of the reasoning
  actually shown: assumptions named, evidence asked for, counter-positions
  engaged, positions revised when warranted. Scored only where the conversation
  gave the person something to reason about; a factual lookup is left `null`,
  not marked low.
- **Drift** ([`drift.md`](rubrics/drift.md)) — the direction of change in
  independent reasoning across sessions, measured against the person's own
  baseline. No engine returns a Drift value; it is a client-side computation
  over the record (mean Load and Rigor of the first five scored, uncoached
  sessions as the baseline; trailing window compared to it; coached sessions
  excluded from both). It stays silent until the baseline is ready.

---

## Privacy model

Decided in [`PHASE2_PLAN.md`](PHASE2_PLAN.md) §0.5; this closes the SPEC Part 4
open question for the prototype.

- The transcript is POSTed once to `/api/instrument/score`, scored, and **not
  persisted server-side**. The route is stateless and never echoes the
  transcript back.
- The capability record — scored sessions, baseline, Drift — lives **only in the
  browser**, under the versioned key `novarc:instrument:v1`.
- The record is the user's: it can be exported to JSON, imported back, and
  deleted, per session or in full, from the instrument page.

Revisit this before any server-side history or multi-device sync.

---

## Enabling the LLM judge

- Set `ANTHROPIC_API_KEY` in the environment. When it is present the route tries
  the judge first and falls back to the heuristic engine on any failure.
- Optionally set `INSTRUMENT_MODEL` to override the model (default
  `claude-opus-5`).
- No `.env` file is committed. When the key is unset, the whole prototype still
  works on the heuristic engine and the UI shows the heuristic mode flag.

---

## What is not done

- **The coupling-mode layer** (VISION §4.2) — predict-first, struggle-protecting,
  calibration-tracking behaviour on top of the chat tools. The prototype
  measures; it does not yet intervene in the loop that way.
- **Reasoning-first models and judgment-routing agents** (VISION §4, items 3–4).
- **Human-rater agreement numbers** — needs trained raters scoring the same
  transcripts.
- **Live-API verification of the judge** — the SDK surface is written to the
  current contract but has not been run against a live key in this environment.

See [`VALIDATION.md`](VALIDATION.md) for the validation method and the numbers
as they land (P2-7, in parallel — a forward reference is fine).

---

## Non-goals

From PRODUCT §7. The prototype does not, and will not:

- grade the model's answers;
- add gamification, streaks, or points;
- make social comparison or population percentiles the primary frame.
