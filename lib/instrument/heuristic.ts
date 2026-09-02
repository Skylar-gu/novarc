/**
 * The deterministic heuristic scoring engine.
 *
 * `scoreHeuristic(turns, { coached })` returns a `RawScore` from observable
 * features of the transcript alone. It is the always-available engine: no
 * network, no LLM, no randomness, no clock. The same input always produces a
 * deep-equal output.
 *
 * It does NOT compute Drift (`drift` is always null; Drift is a client-side
 * computation over the personal record, P2-4) and it does NOT validate its own
 * receipt spans (that is `validate.ts`). Its receipts are real by construction
 * — every quote is a literal slice of a turn's text — but the contract still
 * routes them through validation so the heuristic and LLM paths are identical.
 *
 * ------------------------------------------------------------------------------
 * LOAD — estimate of the user's ownership share, 0..1.
 *
 * Weighted sum of four components, each independently in 0..1:
 *
 *   C1  substantive-token share            weight 0.30
 *       userSubstantiveTokens / (userSubstantiveTokens + assistantSubstantiveTokens),
 *       then divided by 0.30 and clamped — a 30%+ share of the substantive
 *       words saturates this component. Filler words and quoted / fenced-code
 *       blocks are stripped from both sides first.
 *
 *   C2  paste-and-polish penalty           weight 0.25
 *       1 minus the fraction of the user's substantive tokens that live in
 *       turns which closely reproduce the immediately preceding assistant turn
 *       (token-containment >= 0.65 over a turn of >= 15 tokens), divided by
 *       0.5 and clamped. Half or more of the user's text being pasted-back
 *       zeroes this component.
 *
 *   C3  first substantive turn: framing vs. deliverable request   weight 0.25
 *       1.0 if the first real user turn frames a problem, states constraints,
 *       or reasons; 0.15 if it only requests a finished artifact; 0.5 if it
 *       does neither clearly; 0.8 if it does both.
 *
 *   C4  later turns: direction / critique vs. acceptance          weight 0.20
 *       fraction of post-opening user turns that direct, correct, question, or
 *       add substantive content, as opposed to acknowledging or firing off a
 *       fresh request. 0.5 when there are no later turns.
 *
 * Weights sum to 1.0. The result is rounded to 3 decimals for a stable,
 * legible value.
 *
 * ------------------------------------------------------------------------------
 * RIGOR — quality of reasoning where reasoning was invited, 0..1 or null.
 *
 * Null when no user turn contains any of five reasoning moves:
 *   1. naming / examining an assumption
 *   2. asking what supports a claim (evidence, source, basis)
 *   3. raising or engaging a counter-position
 *   4. revising a stated position
 *   5. identifying a flaw in an argument
 *
 * When at least one move is present:
 *   moveCount = sum over user turns of (distinct move categories in the turn,
 *               capped at 3 per turn)
 *   substantiveUserTurns = user turns with >= 8 substantive tokens (min 1)
 *   density = moveCount / substantiveUserTurns
 *   value   = clamp(density / 2.0, 0, 1)          rounded to 3 decimals
 * A single weak move buried in a lot of fluent text is capped at 0.35 so that
 * assertive-but-empty writing cannot score high.
 *
 * ------------------------------------------------------------------------------
 * INTERVENTION — one anchored prompt, or null.
 *   Load < 0.40   -> prompt on the lowest-ownership user turn.
 *   else Rigor present and < 0.40 -> prompt on the weakest reasoning turn.
 *   else null.
 *
 * ------------------------------------------------------------------------------
 * GATE — return an unscored `RawScore` when there is not enough to read:
 *   - fewer than 2 user turns, or
 *   - fewer than 40 substantive user tokens in total, or
 *   - the whole exchange is a short factual lookup.
 */

import type { RawScore, Receipt, SignalScore, Turn } from "./types.ts";
import {
  assistantTurns,
  precedingAssistantTurn,
  userTurns,
} from "./normalize.ts";

/* -------------------------------------------------------------------------- */
/* Tunable constants — documented above; surfaced here for the QA pass.        */
/* -------------------------------------------------------------------------- */

const LOAD_WEIGHTS = { share: 0.3, paste: 0.25, opening: 0.25, later: 0.2 };
const SHARE_SATURATION = 0.3; // substantive-token share that saturates C1
const PASTE_CONTAINMENT = 0.65; // token containment above which a turn is "pasted"
const PASTE_MIN_TOKENS = 15; // a shorter echo is not counted as paste
const PASTE_SATURATION = 0.5; // paste fraction that zeroes C2
const RIGOR_DENSITY_SATURATION = 2.0; // moves-per-substantive-turn that saturates
const RIGOR_FLUENT_CAP = 0.35; // cap when a lone weak move sits in long prose
const RIGOR_FLUENT_TOKENS = 150; // "long prose" threshold for that cap
const SUBSTANTIVE_TURN_TOKENS = 8; // min tokens for a turn to be a reasoning site
const GATE_MIN_USER_TURNS = 2;
const GATE_MIN_USER_TOKENS = 40;
const LOOKUP_MAX_TURN_TOKENS = 13; // per-turn mean below which turns look like lookups
const LOOKUP_MAX_USER_TOKENS = 90; // total above which it is no longer "a lookup"
const INTERVENTION_THRESHOLD = 0.4;
const QUOTE_MAX_CHARS = 200;

/* -------------------------------------------------------------------------- */
/* Text utilities                                                             */
/* -------------------------------------------------------------------------- */

const FILLER = new Set([
  "thanks",
  "thank",
  "thankyou",
  "ty",
  "thx",
  "cheers",
  "perfect",
  "great",
  "awesome",
  "nice",
  "cool",
  "ok",
  "okay",
  "k",
  "yep",
  "yeah",
  "yes",
  "no",
  "sure",
  "please",
  "pls",
  "lgtm",
  "got",
  "understood",
  "noted",
]);

/** Strip fenced code, block quotes, and inline code from a turn's text. */
function stripQuotedBlocks(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*>.*$/gm, " ")
    .replace(/`[^`]*`/g, " ");
}

/** Lowercased word tokens. */
function tokenize(text: string): string[] {
  const matched = text.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g);
  return matched ?? [];
}

/** Tokens that carry meaning: quoted blocks removed, filler words dropped. */
function substantiveTokens(text: string): string[] {
  return tokenize(stripQuotedBlocks(text)).filter((tok) => !FILLER.has(tok));
}

function substantiveTokenCount(text: string): number {
  return substantiveTokens(text).length;
}

/** True when the turn is nothing but filler and punctuation. */
function isFillerOnly(text: string): boolean {
  return substantiveTokenCount(text) === 0;
}

/** Multiset token-containment of `inner` within `outer`, in 0..1. */
function tokenContainment(inner: string[], outer: string[]): number {
  if (inner.length === 0) return 0;
  const outerCounts = new Map<string, number>();
  for (const tok of outer) outerCounts.set(tok, (outerCounts.get(tok) ?? 0) + 1);
  let shared = 0;
  const innerCounts = new Map<string, number>();
  for (const tok of inner) innerCounts.set(tok, (innerCounts.get(tok) ?? 0) + 1);
  for (const [tok, count] of innerCounts) {
    shared += Math.min(count, outerCounts.get(tok) ?? 0);
  }
  return shared / inner.length;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** A verbatim slice of `text`, at most `maxChars`, cut back to a word break.
 *  No ellipsis is added — the result must stay a literal substring. */
function snippet(text: string, maxChars = QUOTE_MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut;
}

/** Split into rough sentences, keeping terminal punctuation. */
function sentences(text: string): string[] {
  const matched = text.match(/[^.!?\n]+[.!?]*/g);
  return (matched ?? []).map((s) => s.trim()).filter((s) => s.length > 0);
}

/* -------------------------------------------------------------------------- */
/* Reasoning-move detection                                                   */
/* -------------------------------------------------------------------------- */

type Move =
  | "assumption"
  | "evidence"
  | "counter"
  | "revision"
  | "flaw";

const MOVE_PATTERNS: Record<Move, RegExp> = {
  assumption:
    /\b(assum(?:e|es|ed|ing|ption|ptions)|presuppos\w*|premise|takes? (?:it|this|that) for granted|going in i (?:think|believe)|my prior)\b/i,
  evidence:
    /\b(what(?:'s| is| are)? the evidence|how do (?:we|you|i) know|what supports?|on what basis|is there (?:a )?(?:source|citation|study|data)|source for|citation for|evidence for|back(?:s| up| that up) with|why do you (?:say|claim|think)|what makes you)\b/i,
  counter:
    /\b(counter(?:argument|point|-?position|-?example)?|the (?:opposing|other) (?:view|side)|on the other hand|devil'?s advocate|one could argue|the case against|the argument against|steelman|objection to|isn'?t it also true|but what if)\b/i,
  revision:
    /\b(i was wrong|i(?:'ve| have) changed my mind|i(?:'ve| have) reconsidered|on reflection|i now think|that changes my (?:view|mind)|fair(?: enough)?,? i(?:'ll| will)? (?:revise|drop|concede)|good point,? (?:i|that)|you(?:'re| are) right,? i|i concede|i'll revise|scratch that)\b/i,
  flaw:
    /\b(that(?:'s| is)? circular|circular reasoning|non[- ]sequitur|begs the question|doesn'?t follow|does not follow|that(?:'s| is)? a contradiction|contradicts|inconsistent with|conflat\w+|the flaw (?:here|in)|assumes the conclusion|gap in (?:the|your|that) reasoning|false (?:dichotomy|dilemma))\b/i,
};

/** Distinct move categories present in a single turn (order stable). */
function movesInTurn(text: string): Move[] {
  const order: Move[] = ["assumption", "evidence", "counter", "revision", "flaw"];
  return order.filter((move) => MOVE_PATTERNS[move].test(text));
}

const MOVE_RATIONALE: Record<Move, string> = {
  assumption: "The person names an assumption and holds it up for examination.",
  evidence: "The person asks what supports the claim rather than accepting it.",
  counter: "The person raises a counter-position and engages it on its merits.",
  revision: "The person revises a stated position as the exchange develops.",
  flaw: "The person identifies a flaw in the reasoning offered.",
};

/* -------------------------------------------------------------------------- */
/* Opening-turn and later-turn classification                                 */
/* -------------------------------------------------------------------------- */

const FRAMING = /\b(i(?:'m| am) trying to|i(?:'m| am) deciding|the problem is|the question is|my goal is|the goal is|i want to understand|i(?:'m| am) not sure whether|i think|my view is|it seems to me|the constraint|the trade-?off|i(?:'m| am) weighing|here(?:'s| is) (?:my|the) (?:context|situation|reasoning)|given that|assuming|because|should i|we need to (?:decide|choose)|which (?:approach|option) )\b/i;

const DELIVERABLE =
  /\b(write (?:me )?(?:a|an|the|some)|draft (?:me )?(?:a|an|the)|generate (?:a|an|the|some)|create (?:a|an|the)|give me (?:a|an|the|some)|make me (?:a|an|the)|produce (?:a|an|the)|compose (?:a|an|the)|code (?:for|me|up)|build (?:me )?(?:a|an|the)|rewrite this|summar(?:ise|ize) this|turn this into)\b/i;

const DIRECTION =
  /\b(no,|not (?:quite|really|that)|actually,|instead|rather than|that(?:'s| is)? not|that doesn'?t|you missed|you(?:'re| are) wrong|reconsider|revise|redo|change the|restructure|cut the|drop the|move the|tighten|expand on|why|how come|what about|isn'?t|shouldn'?t|but |however|i disagree|i don'?t think|the issue with|the problem with|too (?:long|short|vague|generic))\b/i;

/** True when a later user turn engages rather than merely accepts. */
function laterTurnEngages(text: string): boolean {
  if (isFillerOnly(text)) return false;
  if (DIRECTION.test(text)) return true;
  if (movesInTurn(text).length > 0) return true;
  const subst = substantiveTokenCount(text);
  const asks = /\?/.test(text);
  if (asks && subst >= 6) return true;
  return subst >= 18; // a substantial block of new content
}

/* -------------------------------------------------------------------------- */
/* Per-user-turn ownership proxy (for the intervention anchor)                 */
/* -------------------------------------------------------------------------- */

interface UserTurnFeatures {
  turn: Turn;
  ordinal: number; // 0 for the first user turn, 1 for the second, ...
  substTokens: number;
  isPaste: boolean;
  ownership: number; // rough 0..1 proxy, lowest = weakest ownership
}

function analyseUserTurns(turns: Turn[]): UserTurnFeatures[] {
  const users = userTurns(turns);
  return users.map((turn, ordinal) => {
    const prevAssistant = precedingAssistantTurn(turns, turn.index);
    const userTokens = substantiveTokens(turn.text);
    const substTokens = userTokens.length;
    const isPaste =
      substTokens >= PASTE_MIN_TOKENS &&
      prevAssistant !== undefined &&
      tokenContainment(userTokens, substantiveTokens(prevAssistant.text)) >=
        PASTE_CONTAINMENT;

    let ownership = 0.5;
    if (isPaste) ownership = 0.0;
    else if (isFillerOnly(turn.text)) ownership = 0.1;
    else {
      if (FRAMING.test(turn.text)) ownership += 0.3;
      if (DIRECTION.test(turn.text)) ownership += 0.25;
      if (movesInTurn(turn.text).length > 0) ownership += 0.25;
      if (DELIVERABLE.test(turn.text) && ordinal === 0) ownership -= 0.35;
      if (/\?/.test(turn.text) && substTokens >= 6) ownership += 0.1;
      if (substTokens < 6) ownership -= 0.2;
    }
    return { turn, ordinal, substTokens, isPaste, ownership: clamp01(ownership) };
  });
}

/* -------------------------------------------------------------------------- */
/* The gate                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Cheap reject. Returns an unscored `RawScore` when there is not enough of the
 * person's own input to read, otherwise `null`. Exposed so `score.ts` can run
 * it before ever calling a judge.
 */
export function runGate(
  turns: Turn[],
  opts: { coached: boolean },
): RawScore | null {
  const users = userTurns(turns);
  const unscored = (reason: string): RawScore => ({
    scored: false,
    reasonIfUnscored: reason,
    load: null,
    rigor: null,
    drift: null,
    intervention: null,
    coached: opts.coached,
  });

  if (users.length < GATE_MIN_USER_TURNS) {
    return unscored(
      "Fewer than two user turns. There is not enough of the person's own input to read.",
    );
  }

  const userTokenTotal = users.reduce(
    (sum, turn) => sum + substantiveTokenCount(turn.text),
    0,
  );
  if (userTokenTotal < GATE_MIN_USER_TOKENS) {
    return unscored(
      "Under the minimum of substantive user input needed to score a session.",
    );
  }

  // A short factual lookup: every user turn is filler or a brief question, none
  // carries a reasoning move, and the whole exchange is small.
  const everyTurnIsLookupShaped = users.every((turn) => {
    if (isFillerOnly(turn.text)) return true;
    const subst = substantiveTokenCount(turn.text);
    const looksLikeQuestion =
      /\?/.test(turn.text) ||
      /^\s*(what|when|where|who|which|whom|whose|how|is|are|was|were|does|do|did|can|could|define|list|name|give)\b/i.test(
        turn.text.trim(),
      );
    return looksLikeQuestion && subst <= LOOKUP_MAX_TURN_TOKENS;
  });
  const meanTurnTokens = userTokenTotal / users.length;
  const noMovesAnywhere = users.every(
    (turn) => movesInTurn(turn.text).length === 0,
  );
  if (
    everyTurnIsLookupShaped &&
    noMovesAnywhere &&
    meanTurnTokens <= LOOKUP_MAX_TURN_TOKENS &&
    userTokenTotal <= LOOKUP_MAX_USER_TOKENS
  ) {
    return unscored(
      "The exchange is a short factual lookup. It reveals nothing about how the person reasons.",
    );
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Load                                                                       */
/* -------------------------------------------------------------------------- */

interface LoadComputation {
  value: number;
  components: { c1: number; c2: number; c3: number; c4: number };
  features: UserTurnFeatures[];
}

function computeLoad(turns: Turn[]): LoadComputation {
  const features = analyseUserTurns(turns);
  const users = userTurns(turns);
  const assistants = assistantTurns(turns);

  // C1 — substantive-token share. Tokens that live in paste-and-polish turns
  // are the model's words, not the person's cognitive work, so they are
  // excluded from the numerator: echoing a long answer back must not read as
  // a large share of the thinking.
  const userSub = users.reduce(
    (sum, t) => sum + substantiveTokenCount(t.text),
    0,
  );
  const userSubOwned = features
    .filter((f) => !f.isPaste)
    .reduce((sum, f) => sum + f.substTokens, 0);
  const asstSub = assistants.reduce(
    (sum, t) => sum + substantiveTokenCount(t.text),
    0,
  );
  const share = userSubOwned / Math.max(1, userSubOwned + asstSub);
  const c1 = clamp01(share / SHARE_SATURATION);

  // C2 — paste-and-polish penalty. Denominator is the user's whole substantive
  // output (paste included), so this reads the fraction of what they "wrote"
  // that was actually the model's text handed back.
  const pasteTokens = features
    .filter((f) => f.isPaste)
    .reduce((sum, f) => sum + f.substTokens, 0);
  const pasteFraction = pasteTokens / Math.max(1, userSub);
  const c2 = clamp01(1 - pasteFraction / PASTE_SATURATION);

  // C3 — the first substantive user turn: framing vs. deliverable request.
  const firstSubstantive = features.find((f) => f.substTokens >= 5);
  let c3 = 0.5;
  if (firstSubstantive) {
    const text = firstSubstantive.turn.text;
    const frames = FRAMING.test(text) || movesInTurn(text).length > 0;
    const requests = DELIVERABLE.test(text);
    if (frames && requests) c3 = 0.8;
    else if (frames) c3 = 1.0;
    else if (requests) c3 = 0.15;
    else c3 = 0.5;
  }

  // C4 — later turns: direction / critique vs. acceptance. A paste-and-polish
  // turn stays in the denominator but can never count as engagement.
  const laterTurns = features.filter((f) => f.ordinal > 0);
  let c4 = 0.5;
  if (laterTurns.length > 0) {
    const engaged = laterTurns.filter(
      (f) => !f.isPaste && laterTurnEngages(f.turn.text),
    ).length;
    c4 = clamp01(engaged / laterTurns.length);
  }

  const value = round3(
    clamp01(
      LOAD_WEIGHTS.share * c1 +
        LOAD_WEIGHTS.paste * c2 +
        LOAD_WEIGHTS.opening * c3 +
        LOAD_WEIGHTS.later * c4,
    ),
  );

  return { value, components: { c1, c2, c3, c4 }, features };
}

function loadReceipts(load: LoadComputation): Receipt[] {
  const { value, features } = load;

  if (value < INTERVENTION_THRESHOLD) {
    // Quote the weakest-ownership user turn.
    const weakest = [...features].sort(
      (a, b) => a.ownership - b.ownership || a.ordinal - b.ordinal,
    )[0];
    let rationale: string;
    if (weakest.isPaste) {
      rationale =
        "This turn reproduces the model's previous message with little change.";
    } else if (isFillerOnly(weakest.turn.text)) {
      rationale =
        "This turn accepts the model's output without engaging what it said.";
    } else if (weakest.ordinal === 0 && DELIVERABLE.test(weakest.turn.text)) {
      rationale =
        "The opening turn requests a finished deliverable without framing the problem.";
    } else {
      rationale =
        "This turn routes a request to the model rather than carrying the reasoning.";
    }
    return [
      { quote: snippet(weakest.turn.text), turnRef: weakest.turn.index, rationale },
    ];
  }

  // Mid or high Load: quote the strongest framing / direction turn.
  const scored = features
    .map((f) => {
      let strength = f.ownership;
      if (FRAMING.test(f.turn.text)) strength += 0.5;
      if (DIRECTION.test(f.turn.text)) strength += 0.3;
      if (movesInTurn(f.turn.text).length > 0) strength += 0.2;
      return { f, strength };
    })
    .sort((a, b) => b.strength - a.strength || a.f.ordinal - b.f.ordinal);
  const best = scored[0].f;
  const rationale = FRAMING.test(best.turn.text)
    ? "The person frames the problem and the constraints in their own words."
    : DIRECTION.test(best.turn.text)
      ? "This turn directs and corrects the model rather than accepting its answer."
      : "The person carries the framing and the judgment in this turn.";
  return [{ quote: snippet(best.turn.text), turnRef: best.turn.index, rationale }];
}

/* -------------------------------------------------------------------------- */
/* Rigor                                                                      */
/* -------------------------------------------------------------------------- */

interface RigorComputation {
  score: SignalScore | null;
  weakestTurn: Turn | null; // for the intervention anchor
}

function computeRigor(turns: Turn[]): RigorComputation {
  const users = userTurns(turns);

  const perTurn = users.map((turn) => ({
    turn,
    moves: movesInTurn(turn.text),
    substTokens: substantiveTokenCount(turn.text),
  }));

  const totalMoves = perTurn.reduce(
    (sum, t) => sum + Math.min(3, t.moves.length),
    0,
  );

  if (totalMoves === 0) {
    return { score: null, weakestTurn: null };
  }

  const substantiveUserTurns = Math.max(
    1,
    perTurn.filter((t) => t.substTokens >= SUBSTANTIVE_TURN_TOKENS).length,
  );
  const density = totalMoves / substantiveUserTurns;
  let value = clamp01(density / RIGOR_DENSITY_SATURATION);

  const userTokenTotal = perTurn.reduce((sum, t) => sum + t.substTokens, 0);
  if (totalMoves === 1 && userTokenTotal > RIGOR_FLUENT_TOKENS) {
    value = Math.min(value, RIGOR_FLUENT_CAP);
  }
  value = round3(value);

  // Receipt: the turn with the most move categories; quote the sentence that
  // carries the first detected move.
  const richest = [...perTurn]
    .filter((t) => t.moves.length > 0)
    .sort((a, b) => b.moves.length - a.moves.length)[0];
  const move = richest.moves[0];
  const carrier =
    sentences(richest.turn.text).find((s) => MOVE_PATTERNS[move].test(s)) ??
    snippet(richest.turn.text);
  const receipts: Receipt[] = [
    {
      quote: snippet(carrier),
      turnRef: richest.turn.index,
      rationale: MOVE_RATIONALE[move],
    },
  ];

  // Weakest reasoning turn = substantive user turn with the fewest moves.
  const weakestTurn =
    [...perTurn]
      .filter((t) => t.substTokens >= SUBSTANTIVE_TURN_TOKENS)
      .sort((a, b) => a.moves.length - b.moves.length)[0]?.turn ??
    richest.turn;

  return { score: { value, receipts }, weakestTurn };
}

/* -------------------------------------------------------------------------- */
/* Intervention                                                               */
/* -------------------------------------------------------------------------- */

function buildIntervention(
  load: LoadComputation,
  rigor: RigorComputation,
): RawScore["intervention"] {
  if (load.value < INTERVENTION_THRESHOLD) {
    const weakest = [...load.features].sort(
      (a, b) => a.ownership - b.ownership || a.ordinal - b.ordinal,
    )[0];
    const n = weakest.turn.index;
    const prompt = weakest.isPaste
      ? `At turn ${n} you took the model's draft back with only light edits. Next time write your own version first, then use the model to pressure-test it.`
      : isFillerOnly(weakest.turn.text)
        ? `At turn ${n} you accepted the model's answer without testing it. State what would have to be true for it to be wrong before you move on.`
        : `At turn ${n} you handed the model the task rather than the frame. Set out the problem and the constraints yourself, and let the model fill the gaps.`;
    return { signal: "load", prompt, anchoredTo: n };
  }

  if (
    rigor.score !== null &&
    rigor.score.value < INTERVENTION_THRESHOLD &&
    rigor.weakestTurn !== null
  ) {
    const n = rigor.weakestTurn.index;
    return {
      signal: "rigor",
      prompt: `At turn ${n} you advanced a claim without saying what supports it. Add the evidence you are relying on, or flag that you do not have it yet.`,
      anchoredTo: n,
    };
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

export function scoreHeuristic(
  turns: Turn[],
  opts: { coached: boolean },
): RawScore {
  const gate = runGate(turns, opts);
  if (gate) return gate;

  const load = computeLoad(turns);
  const rigor = computeRigor(turns);

  const loadScore: SignalScore = {
    value: load.value,
    receipts: loadReceipts(load),
  };

  return {
    scored: true,
    reasonIfUnscored: null,
    load: loadScore,
    rigor: rigor.score,
    drift: null,
    intervention: buildIntervention(load, rigor),
    coached: opts.coached,
  };
}
