# Phase 2 build plan — Make the Instrument real

Phase 1 shipped a faithful static replica of novarc.tech. Phase 2 turns the
central claim into a working artifact: paste an AI conversation transcript, get
back **Load**, **Rigor**, **Drift**, evidence receipts, and one intervention
prompt — abstaining by default when the evidence is thin. See
[`VISION.md`](VISION.md) §2–4 and [`PRODUCT.md`](PRODUCT.md) §7.

This is the wedge (VISION §4.1). The generative-coupling layer (VISION §4.2 —
predict-first, struggle-protecting, calibration-tracking) is Phase 2b and is
**out of scope here**; measurement comes first.

---

## 0. Non-negotiables

0.1 **Honesty over coverage.** Most sessions are unscored and the instrument
    says so (PRODUCT §3). No score without receipts. Abstain by default. Never
    fabricate a receipt — every quoted span must appear verbatim in the turn it
    cites. This is enforced in code (`validate.ts`), not left to the model.

0.2 **The output contract is fixed** (§2 below). Every scoring path — heuristic
    or LLM — returns exactly this shape. UI and record code depend on it.

0.3 **Original prose.** The copy rules from `BUILD_PLAN.md` §0.1 still hold for
    any new user-facing text (rubric explanations shown in the UI, the page
    copy, receipt rationales templated in the heuristic engine). Austere,
    declarative, hedged, no exclamation marks, no emoji.

0.4 **No secret-key assumptions.** The build environment has **no**
    `ANTHROPIC_API_KEY`. The system must be fully functional and testable
    without one. The LLM judge is an *enhancement* that activates when a key is
    present; its absence degrades to the heuristic engine with a visible mode
    flag, never to an error.

0.5 **Local-first capability record.** The user's session history — scores,
    receipts, drift — lives only in their browser (`localStorage`, versioned
    key). The scoring API route is **stateless**: it scores one transcript and
    persists nothing server-side. This resolves the SPEC Part 4 privacy open
    question for the prototype. Surface it in the UI.

0.6 **Fixed stack.** Next.js 16.3.4 / React 19.2.8 / Tailwind v4 / TS strict /
    ESLint 9, as Phase 1. One new runtime dep is allowed: `@anthropic-ai/sdk`
    (P2-2 only). Tests use the built-in `node --test` runner (`node:test` +
    `node:assert/strict`) — **no test-framework dep.**

0.7 Same orchestration as Phase 1: builder → QA agent → orchestrator gate →
    commit. A package is not done until QA and the orchestrator both pass it
    and it is committed.

---

## 1. Architecture

```
transcript (raw text | ChatGPT export | Claude export | generic JSON)
      │
      ▼  P2-3  normalize
Turn[] = { role: "user"|"assistant", text: string, index: number }
      │
      ▼  P2-1 / P2-2  score
      ├── gate: is there enough here to score? ──► unscored { reason }
      │
      ├── heuristic engine (P2-1, always available, deterministic)
      │      rubric-driven; pattern + edit-distance signals; must attach spans
      │
      └── LLM judge (P2-2, optional; ANTHROPIC_API_KEY present)
             client.messages.parse() against the output schema; adaptive
             thinking; must cite spans; falls back to heuristic on error
      │
      ▼  validate (P2-1): every receipt span must occur in its cited turn,
      │  else drop the receipt; if a signal loses all receipts → that signal
      │  goes null; if both core signals are null → whole result unscored
      ▼
ScoreResult (the §2 contract)
      │
      ▼  P2-4  capability record (localStorage) → baseline, Drift
      ▼  P2-5  results UI: readouts, receipts, drift chart, one prompt
```

`engineMode: "heuristic" | "llm"` travels on every result so the UI can label
it. Drift is computed **client-side** from the stored record, never by the
server.

---

## 2. Output contract

`lib/instrument/types.ts` is the single source of truth. Shape:

```ts
type TurnRef = number; // index into the normalized Turn[]

interface Receipt {
  quote: string;      // verbatim span from the cited turn
  turnRef: TurnRef;
  rationale: string;  // one sentence, why this span supports the signal
}

interface SignalScore {
  value: number;      // 0..1
  receipts: Receipt[]; // >= 1 when the signal is non-null (0.1)
}

interface DriftScore {
  direction: "strengthening" | "holding" | "eroding";
  vsBaseline: number;   // signed delta vs. the personal baseline
  windowDays: number;
  baselineReady: boolean; // false → direction is "holding" and vsBaseline 0
}

interface Intervention {
  signal: "load" | "rigor";
  prompt: string;       // one specific, anchored suggestion (PRODUCT §4)
  anchoredTo: TurnRef;
}

interface ScoreResult {
  scored: boolean;
  reasonIfUnscored: string | null;
  load: SignalScore | null;
  rigor: SignalScore | null;
  drift: DriftScore | null;      // null until the record has any history
  intervention: Intervention | null;
  coached: boolean;             // this session followed a prior intervention
  engineMode: "heuristic" | "llm";
  scoredAt: string;             // ISO 8601
}
```

Non-goals (PRODUCT §7): grading the model's answers; gamification; streaks;
social comparison as the primary frame.

---

## 3. Work packages

Dependency order: **P2-1 → {P2-2, P2-3, P2-4} → P2-5 → {P2-6, P2-7}.**

### P2-1 — Instrument core (contract, rubrics, heuristic engine, validation)
Lane: `lib/instrument/**` except `judge.ts`; `docs/rubrics/**`.
- `types.ts` — the §2 contract, exact.
- `rubrics.ts` — the written rubric for each signal as structured data
  (criteria, what raises/lowers the value, what makes a span count) plus a
  short prose gloss per signal for the UI. Grounded in PRODUCT §2.
- `normalize.ts` — `Turn[]` type + helpers (turn slicing, span lookup:
  `spanOccursInTurn(quote, turnRef, turns)` with whitespace-tolerant match).
- `heuristic.ts` — `scoreHeuristic(turns, history): ScoreResult`. Deterministic.
  Signals from observable features: user-turn share of substantive tokens,
  edit distance between consecutive user turns and the preceding assistant
  turn (paste-and-polish detection → low Load), presence of reasoning markers
  in user turns (named assumptions, requests for evidence, engaging a
  counter-position, revising a stance → Rigor), question complexity. Every
  non-null signal must produce >= 1 real span. Thin input → unscored with a
  reason.
- `validate.ts` — `validateResult(result, turns)`: strip receipts whose span
  is not in the cited turn; null out a signal that loses all receipts;
  unscore a result whose core signals are both null; clamp values to 0..1.
- `score.ts` — `scoreTranscript(turns, { history, judge? })`: runs the gate,
  calls `judge` if supplied else `scoreHeuristic`, then `validateResult`.
  `judge` is an injected `(turns, rubrics) => Promise<RawScore>` so this file
  never imports the SDK and stays unit-testable.
- `fixtures/` — >= 8 transcripts as JSON: rich reasoning, pure lookup (must
  unscore), paste-and-polish (low Load), fluent-but-empty (must NOT score
  Rigor high), short, a coached follow-up, plus 2 realistic mixed ones.
- `*.test.ts` next to each module; `npm run test` script → `node --test`.
  Cover: span validation drops fabricated receipts; abstain path; clamps;
  each fixture's expected coarse outcome (scored/unscored, Load band).

### P2-2 — LLM judge + scoring API route
Lane: `lib/instrument/judge.ts`, `app/api/instrument/**`, `package.json`.
- Add `@anthropic-ai/sdk`. **Load the `claude-api` skill first** and follow its
  current TypeScript surface — do not write SDK calls from memory.
- `judge.ts` — `makeLlmJudge(): Judge`. Builds the prompt from `rubrics.ts`,
  calls `client.messages.parse()` with `output_config.format` set to the raw
  score schema (values 0..1 + spans + turn refs + rationales),
  `thinking: { type: "adaptive" }`, `model` from `process.env.INSTRUMENT_MODEL`
  default `claude-opus-5`, `max_tokens` ~16000. Typed-exception chain. On any
  API error, throw a tagged error the route catches to fall back.
- `app/api/instrument/score/route.ts` — `POST { turns, history, coached }`.
  `runtime = "nodejs"`. If `ANTHROPIC_API_KEY` present → try the LLM judge,
  fall back to heuristic on error (result still returns, `engineMode` reflects
  what actually ran). If absent → heuristic directly. Always run
  `scoreTranscript` so validation applies to both. Basic input guards
  (turn count, total size cap), 400 on malformed, 200 with the contract
  otherwise. Never echo the transcript back.
- Route test with an injected fake judge (no network): asserts fallback on
  judge throw, asserts heuristic path when "no key", asserts validation runs.
- Document in the package report: live-API path is written to the skill's
  current surface but **not** verified against a live key in this environment.

### P2-3 — Transcript ingest + normalize UI
Lane: `lib/instrument/parsers/**`, `components/instrument/TranscriptInput.tsx`.
- `parsers/` — `parsePlainText` (heuristic role attribution: leading
  "You:"/"Me:"/"User:"/"Assistant:"/"ChatGPT:"/"Claude:" markers, or blank-line
  blocks alternating from a user-first assumption), `parseChatGptExport`
  (the `conversations.json` / single-conversation `mapping` shape),
  `parseClaudeExport` (the `chat_messages` shape), `parseGenericJson`
  (`[{role, content}]`). `detectAndParse(input: string): Turn[]` tries JSON
  first, then plain text. Unknown/short → throw a typed `ParseError` with a
  human message.
- `TranscriptInput.tsx` — client component: a textarea + a file picker
  (`.json`/`.txt`, read locally, never uploaded raw except to the score
  route), format auto-detected, a live preview of the parsed `Turn[]`
  (role-labelled), a clear error state, and a "score this" action that hands
  `Turn[]` up via a callback. Tokens only, matches Phase 1 design language.
- Parser tests over fixture exports (include 1 real-shaped ChatGPT and 1
  Claude export fixture, hand-anonymised).

### P2-4 — Capability record (local-first) + Drift
Lane: `lib/instrument/record.ts`, `lib/instrument/useRecord.ts`.
- `record.ts` — versioned `localStorage` schema (`novarc:instrument:v1`):
  `StoredSession { id, scoredAt, load, rigor, coached, engineMode }` (receipts
  are shown once, not stored — keep the record small; store the transcript
  hash only). API: `listSessions`, `addSession`, `deleteSession`,
  `clearAll`, `exportJson`, `importJson` (validate shape, version-check).
- Baseline: mean Load and Rigor over the first `BASELINE_MIN` (=5) scored,
  non-coached sessions. `computeDrift(sessions): DriftScore` — compares the
  trailing window mean to the baseline; `baselineReady` false until
  `BASELINE_MIN` reached (then `direction: "holding"`, `vsBaseline: 0`);
  excludes `coached` sessions from both baseline and trend (PRODUCT §4).
  Direction thresholds documented in the file.
- `useRecord.ts` — `useSyncExternalStore` hook (the Phase 1 pattern; no
  set-state-in-effect), SSR-safe (empty on the server), tolerant of a private
  window / disabled storage (try/catch, render as "no record yet").
- Tests for `computeDrift` and `importJson` validation (run under `node --test`
  with a `localStorage` shim, or factor the pure math out of the storage I/O).

### P2-5 — Instrument page + results UI
Lane: `app/instrument/**`, `components/instrument/**` except `TranscriptInput`.
- `app/instrument/page.tsx` — the working prototype. Client-driven:
  `TranscriptInput` → POST `/api/instrument/score` (send `history` from the
  record + `coached` toggle) → results. Metadata + OG per Phase 1 conventions;
  a plain-language note that this is a prototype, **not** the validated
  instrument, and that the transcript is sent once for scoring and not stored.
- `components/instrument/`:
  - `Readout.tsx` — Load and Rigor as labelled values with the decorative bar
    (reuse the `InterfacePreview` visual language; real data).
  - `ReceiptList.tsx` — each score expands to its receipts: quote, turn ref,
    rationale. Collapsed by default; keyboard-accessible disclosure.
  - `DriftTrend.tsx` — inline SVG trend of Load/Rigor over stored sessions
    with the baseline marked; "not enough history yet" state before
    `BASELINE_MIN`. Follow the `dataviz` skill; tokens only; theme-aware;
    `overflow-x-auto`.
  - `UnscoredNotice.tsx` — the abstain state, showing the reason.
  - `InterventionCard.tsx` — the single prompt, the signal it came from, and a
    link/scroll to the anchored turn. A "mark my next session as coached"
    affordance.
  - `SessionHistory.tsx` — past sessions from the record; delete one; export /
    import / clear the whole record (VISION principle 8).
- Heading contract holds: one `<h1>` (a `Hero` or a page `<h1>`), sections via
  `Section title=`, cards `<h3>`.

### P2-6 — Wire into the site + docs
Lane: `lib/site.ts`, `components/chrome/**`, `app/product/page.tsx`,
`app/sitemap.ts`, `docs/**`, `README.md`.
- Nav: add "Instrument" (or "Try it") to `navItems` / `exploreItems`.
- `/product`: a section linking to `/instrument` — "try the prototype", with
  the not-the-validated-instrument disclaimer. Re-authored copy.
- `app/sitemap.ts`: add `/instrument`.
- `docs/INSTRUMENT_PROTOTYPE.md` — architecture, the two-tier engine, the
  rubric summaries, the privacy decision, known limitations, how to enable the
  LLM judge (`ANTHROPIC_API_KEY`, `INSTRUMENT_MODEL`).
- Update `docs/SPEC.md` Part 4 Phase 2 checklist, `docs/BUILD_NOTES.md`,
  `README.md` status.

### P2-7 — Validation harness seed (VISION Phase 3, first slice)
Lane: `validation/**`, `docs/VALIDATION.md`.
- `validation/set/` — 15–20 transcripts with hand-assigned reference labels
  (`{ expectScored, loadBand, rigorBand, notes }`), spanning rich / lookup /
  paste-polish / adversarial fluent-empty / short / coached.
- `validation/run.ts` — scores the set with the heuristic engine (and the LLM
  judge when a key is present), reports: scored-agreement rate, Load/Rigor
  band-agreement, and a stability check (score each item 3× → variance; the
  heuristic must be exactly stable, the LLM judge within a band).
  `npm run validate` → `node --test` or a plain script printing a table.
- `docs/VALIDATION.md` — the method (mirrors PRODUCT §5), the current numbers
  from the heuristic engine, and an explicit statement that LLM-judge numbers
  and human-rater agreement are pending a key / raters. Publish good or bad.

---

## 4. File-lane ownership (parallel-safe)

| Path | Package |
|------|---------|
| `lib/instrument/**` (not `judge.ts`), `docs/rubrics/**` | P2-1 |
| `lib/instrument/judge.ts`, `app/api/instrument/**`, `package.json` | P2-2 |
| `lib/instrument/parsers/**`, `components/instrument/TranscriptInput.tsx` | P2-3 |
| `lib/instrument/record.ts`, `lib/instrument/useRecord.ts` | P2-4 |
| `app/instrument/**`, `components/instrument/**` (not `TranscriptInput`) | P2-5 |
| `lib/site.ts`, `components/chrome/**`, `app/product/page.tsx`, `app/sitemap.ts`, `docs/**`, `README.md` | P2-6 |
| `validation/**`, `docs/VALIDATION.md` | P2-7 |

Builders validate with `npx tsc --noEmit` + `npm run lint` + `npm run test`
(their own new tests). The orchestrator runs the single authoritative
`npm run build` after each wave merges.

---

## 5. Progress log

| WP | Builder | QA verdict | Orchestrator | Commit |
|----|---------|-----------|--------------|--------|
| P2-1 | started by agent; core files landed; finished by orchestrator (fixtures, tests, rubric docs) after the agent's session ended mid-task | deferred to the Wave B integration review (P2-2/3/4 consume this contract directly) | reviewed every file; found + fixed paste-and-polish Load inflation (C1 now excludes pasted tokens; C4 excludes paste turns); 39 tests green | `e764f6b`+ this |
| P2-2 | — | — | — | — |
| P2-3 | — | — | — | — |
| P2-4 | — | — | — | — |
| P2-5 | — | — | — | — |
| P2-6 | — | — | — | — |
| P2-7 | — | — | — | — |
