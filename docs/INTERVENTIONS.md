# Interventions — what the instrument suggests, and why

When the instrument reads a gap, it returns **one** prompt, anchored to the
turn that showed the gap (PRODUCT §4). This file lists every prompt the
prototype can produce, the research technique behind it, and the honest status
of that link.

Two rules hold for all of them:

1. **One deliberate adjustment, not advice.** Each prompt names a single
   concrete thing to do differently, tied to a specific passage. No general
   coaching, no lists.
2. **Efficacy here is unproven.** The techniques below are well-supported in
   their original settings — learning, judgment, memory. That a single line
   inserted into an AI chat session reproduces the effect is the open question,
   and is what the validation program (PRODUCT §5, VISION §7 Phase 3) exists to
   answer. Until then these are hypotheses, surfaced conservatively and only
   when the evidence for the gap is clear.

Sources are in [`RESEARCH.md`](RESEARCH.md) §3.

---

## The heuristic engine

`lib/instrument/heuristic.ts`, `buildIntervention`. Deterministic; fires only
when a signal falls below the intervention threshold (0.4) and there is a
receipt to anchor to.

### Low Load — a turn that reproduced the model's draft

> "At turn *N* you took the model's draft back with only light edits. Next time
> write your own version first, then use the model to pressure-test it."

- **Technique.** Generation effect (Slamecka & Graf 1978): material you
  produce yourself is retained and understood better than the same material
  received. Reinforced by reward-prediction-error learning (Schultz) — drafting
  first creates a prediction for the model's response to correct.
- **Why this phrasing.** It does not tell the person to stop using the model;
  it moves the model from author to critic, which keeps the generation step
  with the person.
- **Status.** The generation effect is robust for memory and comprehension.
  Its transfer to "draft-then-check with an LLM" is untested.

### Low Load — a turn that accepted the answer without testing it

> "At turn *N* you accepted the model's answer without testing it. State what
> would have to be true for it to be wrong before you move on."

- **Technique.** Considering the opposite (Lord, Lepper & Preston 1984) and
  prospective hindsight / premortem (Mitchell, Russo & Pennington 1989; Klein
  2007): explicitly generating the conditions under which a judgment fails
  surfaces problems that a confirmatory read misses.
- **Why this phrasing.** "What would have to be true for it to be wrong" is the
  consider-the-opposite move stated as a concrete, answerable question rather
  than an instruction to "be critical."
- **Status.** Strong support as a debiasing move in judgment tasks. Not tested
  as a mid-conversation prompt against AI output.

### Low Load — an opening turn that handed over the framing

> "At turn *N* you handed the model the task rather than the frame. Set out the
> problem and the constraints yourself, and let the model fill the gaps."

- **Technique.** Productive failure (Kapur 2008, 2016) and self-explanation
  (Chi et al. 1994): doing the framing yourself — even incompletely — before
  the model answers is the step that makes the answer inform rather than
  replace.
- **Why this phrasing.** It asks for the problem and constraints specifically,
  which is the part most often skipped, and leaves the mechanical completion to
  the model.
- **Status.** Productive failure is well-evidenced in instructional settings
  with deliberate task design. A one-line nudge in a chat is a much weaker
  intervention than the studied version.

### Low Rigor — a claim advanced without its support

> "At turn *N* you advanced a claim without saying what supports it. Add the
> evidence you are relying on, or flag that you do not have it yet."

- **Technique.** Self-explanation (Chi et al. 1989, 1994) and metacognitive
  calibration (Bjork, Dunlosky & Kornell 2013): making the basis of a claim
  explicit is where you find out whether you have one, and naming the absence
  is itself calibration.
- **Why this phrasing.** The "or flag that you do not have it yet" clause
  matters — the goal is an accurate account of the basis, not a forced
  citation.
- **Status.** Self-explanation has moderate, replicated support for
  comprehension (Dunlosky et al. 2013). Effect as a chat-time prompt is
  untested.

---

## The LLM judge

`lib/instrument/judge.ts`. The model is instructed (in `buildUserPrompt`) to
"return at most one intervention, for the weaker of the two signals, anchored
to the turn index it responds to" and to return none "when nothing specific is
warranted." It is not given the four templates above; it writes the prompt.

- **What constrains it.** The rubric text it scores against
  (`lib/instrument/rubrics.ts`, the machine form of `docs/rubrics/`) defines
  what raises and lowers each signal in the same terms the techniques above
  point at — naming assumptions, asking what supports a claim, engaging the
  counter-case, revising. An intervention that follows the rubric lands on one
  of the same moves.
- **What does not constrain it.** Wording, and whether its suggestion reflects
  the research or just sounds plausible. The judge is the lower-confidence path
  for intervention text; the heuristic templates are the audited ones.
- **Downstream check.** Both engines' interventions pass through
  `validateResult`, which drops any intervention whose anchor turn does not
  exist. It does not check the wording.

---

## Design constraints for new interventions

If a new intervention type is added, it should:

1. Map to a named technique in [`RESEARCH.md`](RESEARCH.md) §3, weighted toward
   the higher-utility moves (Dunlosky et al. 2013).
2. State one concrete adjustment, anchored to a receipt.
3. Not claim a benefit the validation program has not yet shown — the UI copy
   around it stays at "try this," not "this will improve your reasoning."
4. Be added to this file with its technique and status before it ships.
