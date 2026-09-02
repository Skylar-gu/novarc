# Rubric — Rigor

> How well you reasoned when you engaged.

Rigor reads the quality of the reasoning the person actually demonstrated:
whether assumptions were surfaced, evidence was asked for, counter-positions
were taken seriously, and stated positions were revised when the evidence
warranted it. It is scored only where the conversation gave the person an
opportunity to reason. A quick factual lookup has no Rigor to measure and is
left unscored rather than marked low.

`lib/instrument/rubrics.ts` is the machine-readable form of this file; the two
must stay in sync.

## What raises Rigor

- The person names an assumption, their own or the model's, and examines it.
- The person asks what supports a claim, or requests evidence or a source.
- A counterargument is raised and engaged on its merits rather than waved away.
- The person revises a stated position, or identifies a flaw in the reasoning
  offered.

## What lowers Rigor

- Assertions are made confidently with no supporting reason and no test.
- The model's claims are accepted without question where questioning was
  possible.
- Fluent, well-organised text that contains no reasoning move: no assumption,
  no evidence, no counter-position.
- A challenge is raised in name only and then dropped.

## What counts as a span

A verbatim quote from a user turn that contains an identifiable reasoning move:
an assumption named, evidence requested, a counter-position engaged, a position
revised, or a flaw identified. Fluent text with no such move is not evidence
for a high value.

## The abstain rule

If no user turn contains any reasoning move, Rigor is **null** — not zero. A
session can score high on Load and carry no Rigor score at all; that is the
correct outcome for a session where the person directed the work but never had
to reason through anything contested.

## How the heuristic engine approximates this (v0)

The deterministic engine in `lib/instrument/heuristic.ts` detects five move
categories with phrase patterns over the user's turns:

1. naming or examining an assumption
2. asking what supports a claim (evidence, source, basis)
3. raising or engaging a counter-position
4. revising a stated position
5. identifying a flaw in an argument

With at least one move present, the value is the move density —
`min(3, moves per turn)` summed, divided by the number of substantive user
turns, then divided by 2 and clamped to 0..1. A single move buried in more than
roughly 150 words of user text is capped at 0.35 so that assertive-but-empty
writing cannot score high.

This is a proxy, and a conservative one. Phrase matching under-reads genuine
reasoning that does not use the expected wording — a pointed "isn't that a
problem for step 4?" may carry no detected move. Expect the heuristic to abstain
or score low on real sessions that a careful human rater would score higher.
The LLM judge (`lib/instrument/judge.ts`, optional) is the higher-fidelity path.
