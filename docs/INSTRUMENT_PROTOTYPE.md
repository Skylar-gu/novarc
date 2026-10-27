# INSTRUMENT_PROTOTYPE — what Phase 2 built

The reference for the working prototype at `/instrument`. It records the
architecture, the two scoring engines, the rubric summaries, the privacy
decision, how to enable the language-model judge, and what is deliberately not
done yet.

Companion documents: [`RESEARCH.md`](RESEARCH.md) for the evidence base and its
limits, [`INTERVENTIONS.md`](INTERVENTIONS.md) for every prompt the instrument
can return and the technique behind it, [`VALIDATION.md`](VALIDATION.md) for the
test program and current numbers, [`INSTRUMENT_CLI.md`](INSTRUMENT_CLI.md) for
`npm run instrument` — the local command-line reader that scores Claude Code
sessions you pick, on your machine, into the same record shape this page uses.

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
  B -- heuristics fail --> S[turn-splitter: llmSplit.ts or openrouterSplit.ts, optional]
  S --> C
  B -- heuristics succeed --> C[normalize: Turn[] = role, text, index]
  C --> D{gate: enough to score?}
  D -- no --> U[unscored, with a reason]
  D -- yes --> E{OPENROUTER_API_KEY or ANTHROPIC_API_KEY set?}
  E -- no --> H[heuristic engine: lib/instrument/heuristic.ts]
  E -- yes --> J[LLM judge: judge.ts or openrouterJudge.ts]
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
  `lib/instrument/normalize.ts`. When every local heuristic fails to tell the
  two sides apart, `TranscriptInput` can send the raw text once to
  `/api/instrument/split`, where a smaller model (`lib/instrument/llmSplit.ts`)
  splits it instead — see "The turn-splitter" below.
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

### LLM judge — optional, two interchangeable backends

Both backends share one system prompt, one user-prompt builder, one
JSON-schema output format (values 0..1, spans, turn refs, rationales), and one
raw-score coercion — all defined once in `lib/instrument/judge.ts` and reused
by the other — so they read the transcript under identical instructions and
are interchangeable behind the same `Judge` contract.

- `lib/instrument/judge.ts`. `makeLlmJudge()` calls `client.messages.parse()`
  against the Claude API, with `thinking: { type: "adaptive" }` and the model
  from `INSTRUMENT_MODEL` (default `claude-opus-5`).
- `lib/instrument/openrouterJudge.ts`. `makeOpenRouterJudge()` calls
  OpenRouter's chat-completions endpoint directly with `fetch` (no SDK), with
  the model from `INSTRUMENT_MODEL` (default `google/gemini-2.5-flash`) —
  picked for low per-token cost at the volume this route expects.

`core.ts` selects the backend: `OPENROUTER_API_KEY` present -> the OpenRouter
judge; else `ANTHROPIC_API_KEY` present -> the Claude judge; else the
heuristic engine directly. Either backend takes one retry on unparseable
output, then throws `JudgeUnavailableError` on any failure — network, rate
limit, auth, or schema mismatch. The route catches that and falls back to the
heuristic engine, so the absence or failure of a judge degrades to a heuristic
reading with a visible mode flag, never to an error.

Neither judge verifies its own spans. `score.ts` routes every raw score
through `validateResult`, which is the single place a fabricated receipt is
caught and dropped — regardless of which backend produced it.

### The turn-splitter — optional, parsing only, two backends

`/api/instrument/split`. The free, local, synchronous heuristics in
`lib/instrument/parsers/` are tried first and remain the default: labelled
lines (`You:` / `Assistant:`), bare speaker-name lines with no colon (the
shape produced when a conversation is copied straight off a chat page), and
blank-line blocks. Only when all of those fail does the input UI offer to send
the raw text once to this route, which asks a smaller model to copy it back
out split into `{ role, text }` turns — verbatim, with no summarizing or
rewording. It never scores or reasons about content, so it runs on cheaper
models than the judge.

Both backends share one system prompt, one user-prompt builder, one
JSON-schema output format, and one raw-turns coercion — all defined once in
`lib/instrument/llmSplit.ts` and reused by the other.

- `lib/instrument/llmSplit.ts`. `makeLlmSplitter()` calls
  `client.messages.parse()` against the Claude API, with the model from
  `INSTRUMENT_SPLIT_MODEL` (default `claude-haiku-5`).
- `lib/instrument/openrouterSplit.ts`. `makeOpenRouterSplitter()` calls
  OpenRouter's chat-completions endpoint directly with `fetch`, trying a
  primary model (`INSTRUMENT_SPLIT_MODEL`, default
  `google/gemini-2.5-flash-lite`) and, only if that one fails outright or its
  output never validates, a backup model (`INSTRUMENT_SPLIT_BACKUP_MODEL`,
  default `openai/gpt-4o-mini`). This is the one place in the prototype that
  falls back across models rather than just retrying the same one — splitting
  is cheap and low-stakes next to scoring, so the extra round trip is worth it
  here.

`core.ts` selects the backend the same way the scoring route does:
`OPENROUTER_API_KEY` present → the OpenRouter splitter; else
`ANTHROPIC_API_KEY` present → the Claude splitter; else the local heuristics'
failure is reported as-is. Any failure (no key, network, rate limit, schema
mismatch on every model tried) throws `SplitUnavailableError`; the route
reports that the transcript could not be split, and the person is left to
label it by hand.

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
- If the local heuristics cannot segment a paste and the person chooses to
  fall back to the turn-splitter, the raw text is POSTed once to
  `/api/instrument/split` under the same rule: stateless, not persisted, and
  the response is only the turns derived from it.
- The capability record — scored sessions, baseline, Drift — lives **only in the
  browser**, under the versioned key `novarc:instrument:v1`.
- The record is the user's: it can be exported to JSON, imported back, and
  deleted, per session or in full, from the instrument page.

Revisit this before any server-side history or multi-device sync.

---

## Enabling the LLM judge and the turn-splitter

Both routes pick a backend from whichever key is set, `OPENROUTER_API_KEY`
first:

- Set `OPENROUTER_API_KEY` to use the cheaper OpenRouter backends for both.
  The judge uses `google/gemini-2.5-flash`; the splitter tries
  `google/gemini-2.5-flash-lite` first, falling back to `openai/gpt-4o-mini`
  only if that one fails or its output never validates. Override either with
  `INSTRUMENT_MODEL` (judge) or `INSTRUMENT_SPLIT_MODEL` /
  `INSTRUMENT_SPLIT_BACKUP_MODEL` (splitter, primary and backup respectively).
- Else set `ANTHROPIC_API_KEY` to use the Claude backends instead:
  `claude-opus-5` for the judge, `claude-haiku-5` for the splitter — same two
  override variables apply.
- No `.env` file is committed. When neither key is set, the scoring route
  works on the heuristic engine with its mode flag shown, and a paste the
  local parsers cannot segment just has to be labelled by hand — the split
  route reports `split_unavailable` rather than silently doing nothing.

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
