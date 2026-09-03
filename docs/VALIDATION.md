# Validation

PRODUCT §5 commits the instrument to four tests before release, results
published either way. This file records the **seed** of that program — a small
fixed set of transcripts and a script that scores them — and is honest about
how little it yet covers.

- Set: [`validation/set.md`](../validation/set.md) — 18 synthetic transcripts,
  each with a hand-assigned reference reading.
- Harness: `validation/run.ts` (`npm run validate`).
- Parser: `validation/parse.ts` turns the Markdown set back into transcripts.

---

## The four methods, and what the seed does

| PRODUCT §5 method | Seed status |
|---|---|
| **Agreement with human raters** | *Partial, and not with independent raters.* The set carries reference labels, and the harness reports how often the engine matches them (scored / abstain, Load band, Rigor abstain). But the labels were written by the same project that built the engine, and several transcripts were shaped until the conservative heuristic read them cleanly. This measures self-consistency with the rubric, not agreement with people. Independent raters on real transcripts are still to come. |
| **Adversarial testing** | *Started.* Three transcripts (`adversarial-*`) are fluent, confident prose with no reasoning move — the kind of writing that could earn a high score by sounding like thinking. The harness checks that Rigor abstains or stays below the intervention threshold on all three. A larger set, ideally written by someone outside the project, is needed. |
| **Repeat stability** | *Covered for the heuristic.* Every transcript is scored three times and the results compared byte for byte. The deterministic engine must be identical across runs or the harness fails. The LLM judge's stability is reported for information only. |
| **Longitudinal calibration** | *Not started.* Drift needs a time series of real sessions from one person against their own baseline. Nothing here exercises it. VISION §7 Phase 3. |

---

## Current numbers — heuristic engine

`npm run validate`, no `ANTHROPIC_API_KEY` set:

```
Validation seed — 18 transcripts in validation/set.md

heuristic engine — per transcript

  id                                expect        got                                           checks
  ----------------------------------------------------------------------------------------------------
  rich-01-index-strategy            score/high    L=1.00 (high) R=0.50 iv=-                     scored:ok band:ok rigor:ok
  rich-02-vendor-migration          score/high    L=0.95 (high) R=0.38 iv=rigor                 scored:ok band:ok rigor:ok
  rich-03-experiment-design         score/high    L=1.00 (high) R=0.50 iv=-                     scored:ok band:ok rigor:ok
  lookup-01-shell                   abstain       abstain: Under the minimum of substantive u   scored:ok
  lookup-02-http                    abstain       abstain: Under the minimum of substantive u   scored:ok
  lookup-03-git                     abstain       abstain: Under the minimum of substantive u   scored:ok
  paste-01-announcement             score/low     L=0.12 (low) R=null iv=load                   scored:ok band:ok rigor:ok
  paste-02-bio                      score/low     L=0.14 (low) R=null iv=load                   scored:ok band:ok rigor:ok
  paste-03-summary                  score/low     L=0.21 (low) R=null iv=load                   scored:ok band:ok rigor:ok
  adversarial-01-strategy-confident score/high    L=0.88 (high) R=null iv=-                     scored:ok band:ok rigor:ok adv:ok
  adversarial-02-postmortem-fluent  score/high    L=1.00 (high) R=null iv=-                     scored:ok band:ok rigor:ok adv:ok
  adversarial-03-rhetorical         score/high    L=1.00 (high) R=null iv=-                     scored:ok band:ok rigor:ok adv:ok
  short-01-single-turn              abstain       abstain: Fewer than two user turns. There i   scored:ok
  short-02-abandoned                abstain       abstain: Under the minimum of substantive u   scored:ok
  coached-01-followup               score/high    L=1.00 (high) R=0.67 iv=-                     scored:ok band:ok rigor:ok
  coached-02-revision               score/high    L=1.00 (high) R=0.33 iv=rigor                 scored:ok band:ok rigor:ok
  mixed-01-planning                 score/high    L=1.00 (high) R=null iv=-                     scored:ok band:ok
  mixed-02-debugging                score/high    L=0.88 (high) R=0.25 iv=rigor                 scored:ok band:ok rigor:ok

heuristic engine — summary

  scored-agreement         100% (18/18)
  Load-band agreement      100% (13/13)
  Rigor-abstain agreement  100% (12/12)
  adversarial pass rate    100% (3/3)
  stability (3x)             all identical

PASS: heuristic stable across 3 runs; scored-agreement 100% (floor 80%).
```

### How to read 100%

It means the engine does what its own rubric says on eighteen unambiguous,
synthetic cases, and that it is perfectly deterministic. It does **not** mean
the instrument is accurate. The cases were built to be clear-cut and, in
several instances, adjusted until the conservative heuristic could place them.
The real questions — does it agree with people, on messy real transcripts,
about sessions that sit near a boundary — are not answered here.

Two disagreements the seed does not score against, but that are visible in the
table and worth noting:

- `rich-02` and `coached-02` are solid reasoning sessions, and the heuristic
  reads Rigor low enough (0.38, 0.33) to fire an intervention. A human rater
  probably would not prompt on either. This is the engine's known
  conservatism, called out in `docs/rubrics/rigor.md`.
- `mixed-01` sets an explicit go/no-go gate with a threshold — arguably a
  reasoning move — and the heuristic scores Rigor null. The label leaves Rigor
  unasserted there rather than pick a side.

---

## Pending

- **LLM judge.** `validation/run.ts` runs the judge and prints the same four
  numbers when `ANTHROPIC_API_KEY` is set. The build environment has no key, so
  there are no judge numbers to publish yet.
- **Independent human-rater agreement.** No external raters have scored these or
  any transcripts. This is the gap that matters most.
- **A real, messy set.** Every transcript here is written for the purpose.
  Real exported conversations — long, off-topic, multi-session — are not
  represented.
- **Longitudinal / Drift calibration.** Needs real usage over time.

## Failure conditions

`npm run validate` exits non-zero if:

- the heuristic engine is not byte-identical across the three repeats, or
- scored-agreement drops below **80%** (the documented floor; set loose because
  the heuristic is expected to under-read some sessions a rater would score).

It is wired as a regression guard: a change to the scoring engine that breaks
one of these clear cases fails the check.
