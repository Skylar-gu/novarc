/**
 * The written rubric for each signal, as structured data.
 *
 * Every clause is grounded in PRODUCT.md §2. This object is consumed in two
 * places: the results UI shows `oneLineGloss` and `whatItMeasures`, and P2-2
 * renders the whole set to plain text with `rubricPromptText()` to build the
 * LLM judge's prompt. It must therefore be self-contained and unambiguous.
 *
 * Copy register (BUILD_PLAN.md §0.1): declarative, austere, hedged where the
 * product hedges. No exclamation marks, no emoji.
 */

import type { Signal } from "./types.ts";

export interface Rubric {
  signal: Signal;
  /** One line, shown in the UI. Original prose. */
  oneLineGloss: string;
  /** Two to three sentences on what the number represents. */
  whatItMeasures: string;
  /** Observable features that push the value up. */
  raises: string[];
  /** Observable features that push the value down. */
  lowers: string[];
  /** What kind of quoted passage counts as valid evidence for this signal. */
  whatCountsAsASpan: string;
}

export const RUBRICS: Record<Signal, Rubric> = {
  load: {
    signal: "load",
    oneLineGloss: "How much of the thinking was yours.",
    whatItMeasures:
      "Load estimates the share of the cognitive work the person carried " +
      "themselves: framing the problem, generating the reasoning, judging that " +
      "reasoning, and reaching the conclusion. It is a measure of ownership, " +
      "not of how much text the person typed. A brief exchange in which the " +
      "person set the frame and the model supplied a detail can carry high " +
      "Load; a long session spent pasting the model's prose back with light " +
      "edits carries low Load.",
    raises: [
      "The person states the problem, the constraints, or the goal in their own words before the model answers.",
      "Later turns direct, correct, or challenge the model rather than accepting its output as given.",
      "The person supplies the reasoning steps or the criteria and asks the model to check or extend them.",
      "The judgments and the conclusion are the person's, with the model in a supporting role.",
    ],
    lowers: [
      "A user turn closely reproduces the previous assistant turn, which indicates paste-and-polish rather than authorship.",
      "The opening turn requests a finished deliverable without framing the problem.",
      "Later turns mostly acknowledge the output or issue fresh requests without engaging what was said.",
      "The model carries the framing, the reasoning, and the conclusion while the person routes requests.",
    ],
    whatCountsAsASpan:
      "A verbatim quote from a user turn. Evidence for a high value shows the " +
      "person framing, directing, or judging. Evidence for a low value shows " +
      "acceptance without engagement, or text that reproduces the model's " +
      "previous turn.",
  },
  rigor: {
    signal: "rigor",
    oneLineGloss: "How well you reasoned when you engaged.",
    whatItMeasures:
      "Rigor reads the quality of the reasoning the person actually " +
      "demonstrated: whether assumptions were surfaced, evidence was asked " +
      "for, counter-positions were taken seriously, and stated positions were " +
      "revised when the evidence warranted it. It is scored only where the " +
      "conversation gave the person an opportunity to reason. A quick factual " +
      "lookup has no Rigor to measure and is left unscored rather than marked " +
      "low.",
    raises: [
      "The person names an assumption, their own or the model's, and examines it.",
      "The person asks what supports a claim, or requests evidence or a source.",
      "A counterargument is raised and engaged on its merits rather than waved away.",
      "The person revises a stated position, or identifies a flaw in the reasoning offered.",
    ],
    lowers: [
      "Assertions are made confidently with no supporting reason and no test.",
      "The model's claims are accepted without question where questioning was possible.",
      "Fluent, well-organised text that contains no reasoning move: no assumption, no evidence, no counter-position.",
      "A challenge is raised in name only and then dropped.",
    ],
    whatCountsAsASpan:
      "A verbatim quote from a user turn that contains an identifiable " +
      "reasoning move: an assumption named, evidence requested, a " +
      "counter-position engaged, a position revised, or a flaw identified. " +
      "Fluent text with no such move is not evidence for a high value.",
  },
  drift: {
    signal: "drift",
    oneLineGloss: "Where your thinking is heading.",
    whatItMeasures:
      "Drift is the direction of change in independent reasoning across " +
      "months, measured against the person's own baseline rather than a " +
      "population average. It reports whether independent reasoning is " +
      "strengthening, holding, or eroding. It requires a baseline period " +
      "before it reports anything, and it excludes coached sessions so it " +
      "never measures the instrument's own influence.",
    raises: [
      "Load and Rigor on uncoached sessions trend above the personal baseline across the trailing window.",
      "The person sustains ownership of framing and judgment without prompting from the instrument.",
    ],
    lowers: [
      "Load and Rigor on uncoached sessions trend below the personal baseline across the trailing window.",
      "Ownership of framing, reasoning, and judgment declines from session to session.",
    ],
    whatCountsAsASpan:
      "Drift carries no per-session span. Its evidence is the sequence of " +
      "prior scored, uncoached sessions held in the personal record, not any " +
      "single quoted passage. A scoring engine always returns Drift as null; " +
      "the record computes it.",
  },
};

/** Signal order used wherever the set is rendered. */
export const SIGNAL_ORDER: Signal[] = ["load", "rigor", "drift"];

/**
 * Render the rubric set to a single plain-text block. P2-2 embeds this in the
 * LLM judge's prompt; the heuristic engine does not use it. Stable output for a
 * given `RUBRICS` — no timestamps, no randomness.
 */
export function rubricPromptText(): string {
  const lines: string[] = [];
  lines.push("NOVARC INSTRUMENT — SCORING RUBRICS");
  lines.push("");
  lines.push(
    "Score a single AI conversation transcript on how the person reasoned " +
      "while producing the output. Do not evaluate the quality of the model's " +
      "answers. Score only from the person's own turns. Every non-null signal " +
      "must carry at least one receipt: a verbatim quote from the turn it " +
      "cites. When the evidence is thin, abstain.",
  );
  lines.push("");

  for (const signal of SIGNAL_ORDER) {
    const rubric = RUBRICS[signal];
    lines.push(`--- ${signal.toUpperCase()} ---`);
    lines.push(`Gloss: ${rubric.oneLineGloss}`);
    lines.push(`What it measures: ${rubric.whatItMeasures}`);
    lines.push("Raises the value:");
    for (const item of rubric.raises) lines.push(`  - ${item}`);
    lines.push("Lowers the value:");
    for (const item of rubric.lowers) lines.push(`  - ${item}`);
    lines.push(`What counts as a span: ${rubric.whatCountsAsASpan}`);
    lines.push("");
  }

  lines.push(
    "Load and Rigor take a value in the range 0 to 1. Rigor is null when no " +
      "user turn shows any reasoning move. Drift is always null here. Return " +
      "one intervention only for a clear gap, anchored to a specific turn.",
  );

  return lines.join("\n");
}
