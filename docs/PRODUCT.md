# PRODUCT — The NOVARC Instrument

> Nobody can tell you what AI is doing to your thinking. Not because it's
> unanswerable — because the instrument doesn't exist yet.

The first NOVARC product. In validation as of 2026-09-01; launches 2026; unnamed
publicly until launch. This document is the spec for what it does and how it must
behave.

---

## 1. What it is

A **measurement instrument for human cognition under AI assistance.** It runs inside
the tools people already use — ChatGPT, Claude, Gemini — and it does not evaluate the
model's output. It reads **how the person reasoned while producing that output**. Daily
AI use becomes three signals.

Framing to keep: it is an *instrument*, not a coach, not a productivity dashboard, not a
score for its own sake. The comparison class is a blood panel or an EEG readout — it
measures something real about you and reports it plainly.

---

## 2. The three signals

### 2.1 Load — "how much of the thinking was yours"

The share of cognitive work the person genuinely carried:

- framing the problem
- generating the reasoning
- evaluating that reasoning
- reaching the judgment

Measured as **ownership of the work, not volume of text.** A long paste-and-polish
session is low Load; a short exchange where the person did the framing and the model
filled in a detail can be high Load.

### 2.2 Rigor — "how well you reasoned when you engaged"

The quality of the reasoning actually demonstrated:

- assumptions surfaced
- evidence demanded
- counterarguments taken seriously
- positions revised when the evidence warranted it

**Scored only where the conversation offered the opportunity.** A quick factual lookup
has no Rigor to measure and must not be penalized for it.

### 2.3 Drift — "where your thinking is heading"

The trend across months, measured **against the person's own baseline**, not a
population average. Answers one question: is independent reasoning **strengthening,
holding, or eroding**?

- Requires a baseline period before it reports anything.
- Coached behavior (see §4) is excluded so Drift never measures the instrument's own
  influence.

---

## 3. The standard — "it reports the truth, including when the truth is unwelcome"

1. **Most sessions are not scored, and the instrument says so.** A lookup reveals
   nothing about reasoning. Neither does a session too short to read. "An instrument
   that scores everything is guessing — and we would rather report nothing than guess."
2. **No score without a receipt.** When a score is shown, the evidence is shown with
   it: the exact passages, quoted from the person's own conversation, that produced the
   score. Every number expands to its source text.
3. **Abstain by default.** Insufficient evidence → no score, explicitly, not a
   low-confidence guess.
4. **Own baseline, not a leaderboard.** No population percentiles as the headline;
   comparison is you-vs-you over time.

---

## 4. Measurement, then intervention

- The instrument doesn't only observe. For a detected gap it returns **one targeted,
  specific prompt** tied to what it actually saw — "a single deliberate adjustment
  rather than general advice."
- **Coached behavior is flagged and excluded from long-term trend calculation**, so the
  instrument never measures the effect of its own prompting.
- Intervention is minimal and legible: the user should always be able to see *why* a
  given prompt was surfaced (which passage, which signal).

---

## 5. Validation program (pre-launch)

Four methods, run before release:

| Method | Question it answers |
|--------|---------------------|
| Agreement vs. human scoring | Do the instrument's scores match careful human raters? |
| Adversarial testing | Can fluent-but-empty reasoning fool it into a high score? |
| Stability testing | Does the same transcript get the same score on repeat? |
| Longitudinal calibration | Does Drift track real change against a self-baseline? |

**Results are published regardless of outcome.** The waitlist is notified first.

---

## 6. Interface

- Visual readouts for **Load** and **Rigor**; **Drift** as a trend line against
  baseline.
- **Evidence receipts:** each score expands to exact quoted passages from the user's
  own conversation.
- **Mobile and desktop** layouts. Mobile shows Load, Rigor, and the supporting
  conversation excerpts.
- Unscored sessions are shown as unscored — not hidden, not faked.

---

## 7. Build notes (for our prototype — Phase 2 in SPEC.md)

- **Input:** a single AI conversation transcript (user + assistant turns), plus the
  user's rolling history for baseline/Drift.
- **Output contract:**
  ```
  {
    scored: boolean,
    reason_if_unscored: string | null,
    load:  { value: 0..1, receipts: [ {quote, turn_ref, rationale} ] } | null,
    rigor: { value: 0..1, receipts: [ ... ] } | null,
    drift: { direction: "strengthening"|"holding"|"eroding", vs_baseline: number, window_days: int } | null,
    intervention: { signal: "load"|"rigor", prompt: string, anchored_to: turn_ref } | null,
    coached: boolean
  }
  ```
- **Scoring engine v0:** explicit written rubric per signal; an LLM-as-judge pass that
  must cite spans; a hard abstain path when spans are thin.
- **Privacy:** decide local-first vs. server scoring before touching real transcripts
  (open question in SPEC.md §Part 4).
- **Non-goals:** grading the model's answers; gamification; streaks; social comparison
  as the primary frame.
