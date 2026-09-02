# Rubric — Load

> How much of the thinking was yours.

Load estimates the share of the cognitive work the person carried themselves:
framing the problem, generating the reasoning, judging that reasoning, and
reaching the conclusion. It is a measure of ownership, not of how much text the
person typed. A brief exchange in which the person set the frame and the model
supplied a detail can carry high Load; a long session spent pasting the model's
prose back with light edits carries low Load.

`lib/instrument/rubrics.ts` is the machine-readable form of this file; the two
must stay in sync.

## What raises Load

- The person states the problem, the constraints, or the goal in their own
  words before the model answers.
- Later turns direct, correct, or challenge the model rather than accepting its
  output as given.
- The person supplies the reasoning steps or the criteria and asks the model to
  check or extend them.
- The judgments and the conclusion are the person's, with the model in a
  supporting role.

## What lowers Load

- A user turn closely reproduces the previous assistant turn — paste-and-polish
  rather than authorship.
- The opening turn requests a finished deliverable without framing the problem.
- Later turns mostly acknowledge the output or issue fresh requests without
  engaging what was said.
- The model carries the framing, the reasoning, and the conclusion while the
  person routes requests.

## What counts as a span

A verbatim quote from a user turn. Evidence for a high value shows the person
framing, directing, or judging. Evidence for a low value shows acceptance
without engagement, or text that reproduces the model's previous turn.

## How the heuristic engine approximates this (v0)

The deterministic engine in `lib/instrument/heuristic.ts` combines four
components, each in 0..1:

| Component | Weight | Reads |
|-----------|--------|-------|
| Substantive-token share | 0.30 | The person's own words as a fraction of all substantive words. Tokens inside paste-and-polish turns are excluded — they are the model's words handed back. A 30%+ owned share saturates the component. |
| Paste-and-polish penalty | 0.25 | Zeroes as the fraction of the person's text that closely reproduces the preceding assistant turn approaches one half. |
| Opening turn | 0.25 | 1.0 if the first substantive turn frames a problem or reasons; 0.15 if it only requests an artifact; 0.5 if neither; 0.8 if both. |
| Later turns | 0.20 | Fraction of post-opening turns that direct, correct, question, or add substantive content rather than accept. A paste turn can never count as engagement. |

This is a proxy. It reads surface features — token shares, overlap with the
model's text, a small set of framing and direction phrases. It cannot tell a
confidently asserted position from a carefully reasoned one, so a fluent,
directive session with shallow thinking can still read as high Load. The LLM
judge (`lib/instrument/judge.ts`, optional) is the higher-fidelity path; both
return the same contract and both must attach real spans.
