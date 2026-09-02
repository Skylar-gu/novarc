/**
 * The optional LLM judge.
 *
 * `makeLlmJudge()` returns a `Judge` (the injected scoring function `score.ts`
 * expects). It calls the Claude API with structured outputs to get back a raw
 * score, then maps that to the `RawScore` contract. It does NOT verify receipt
 * spans — `score.ts` routes every raw score through `validateResult`, which is
 * the single place fabricated evidence is caught.
 *
 * This module is an enhancement, never a hard dependency: on any failure —
 * network, rate limit, auth, or output that will not parse after one retry — it
 * throws `JudgeUnavailableError`. The scoring route catches that and falls back
 * to the deterministic heuristic engine with a visible mode flag.
 *
 * It may import `@anthropic-ai/sdk`, `./types.ts`, and `./score.ts` (for the
 * `Judge` type). It must not import anything under `app/`.
 */

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import type { Intervention, RawScore, SignalScore, Turn } from "./types.ts";
import type { Judge } from "./score.ts";

/** The default model. Overridable per call or via the environment. */
const DEFAULT_MODEL = "claude-opus-5";

/** Non-streaming cap. Comfortably inside the SDK HTTP timeout. */
const MAX_TOKENS = 16000;

/**
 * Thrown for every failure mode of the LLM path. The route treats it as the
 * signal to fall back to the heuristic engine. The underlying error, when
 * there is one, is attached as `cause`.
 */
export class JudgeUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "JudgeUnavailableError";
  }
}

/**
 * The raw-score schema the model must return. Kept deliberately close to
 * `RawScore`: `scored`, an optional reason, `load` and `rigor` as a value plus
 * receipts or null, and at most one intervention. `drift` and the engine
 * metadata are added by this module and by validation; the model never sees
 * them.
 */
/**
 * Nullable sub-schemas are written as `anyOf: [{type:"null"}, {…}]`, not
 * `type: ["object","null"]`. The installed SDK's `jsonSchemaOutputFormat`
 * transforms the schema before sending it, and its transform only understands a
 * string-valued `type`; an array-valued `type` loses its `properties` and
 * `required`. `anyOf` passes through intact. `schema.test.ts` asserts this.
 */
const SIGNAL_SCHEMA = {
  type: "object",
  properties: {
    value: { type: "number", minimum: 0, maximum: 1 },
    receipts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          quote: { type: "string" },
          turnRef: { type: "integer" },
          rationale: { type: "string" },
        },
        required: ["quote", "turnRef", "rationale"],
        additionalProperties: false,
      },
    },
  },
  required: ["value", "receipts"],
  additionalProperties: false,
} as const;

const NULLABLE_SIGNAL_SCHEMA = {
  anyOf: [{ type: "null" }, SIGNAL_SCHEMA],
} as const;

const INTERVENTION_SCHEMA = {
  type: "object",
  properties: {
    signal: { type: "string", enum: ["load", "rigor"] },
    prompt: { type: "string" },
    anchoredTo: { type: "integer" },
  },
  required: ["signal", "prompt", "anchoredTo"],
  additionalProperties: false,
} as const;

export const RAW_SCORE_SCHEMA = {
  type: "object",
  properties: {
    scored: { type: "boolean" },
    reasonIfUnscored: { anyOf: [{ type: "null" }, { type: "string" }] },
    load: NULLABLE_SIGNAL_SCHEMA,
    rigor: NULLABLE_SIGNAL_SCHEMA,
    intervention: {
      anyOf: [{ type: "null" }, INTERVENTION_SCHEMA],
    },
  },
  required: ["scored", "reasonIfUnscored", "load", "rigor", "intervention"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = [
  "You are a measurement instrument. You read one transcript of a person working",
  "with an AI assistant and report how the person reasoned while producing the",
  "result. You never grade the assistant's answers, only the person's own turns.",
  "You return the requested structured object and nothing else. You abstain when",
  "the evidence is thin rather than guessing.",
].join(" ");

/** One turn rendered for the prompt. Assistant turns are included for context;
 *  the instructions forbid scoring them. */
function renderTurn(turn: Turn): string {
  const role = turn.role === "user" ? "PERSON" : "ASSISTANT";
  return `[turn ${turn.index}] ${role}:\n${turn.text}`;
}

function buildUserPrompt(rubricText: string, turns: Turn[]): string {
  return [
    rubricText,
    "",
    "--- SCORING INSTRUCTIONS ---",
    "Score only the person's turns. Do not score the assistant's answers.",
    "Every non-null signal needs at least one receipt. A receipt quote must be",
    "copied verbatim, character for character, from the single turn named by its",
    "turnRef; use that turn's bracketed index as turnRef. Do not paraphrase, and",
    "do not merge text from two turns into one quote.",
    "Set scored to false, with a one-sentence reasonIfUnscored, whenever the",
    "person's input is too thin to read — for example a short factual lookup.",
    "Set rigor to null when no turn shows a reasoning move (an assumption named,",
    "evidence requested, a counter-position engaged, a position revised, a flaw",
    "identified). Rigor being null does not by itself make the session unscored.",
    "Return at most one intervention, for the weaker of the two signals, anchored",
    "to the turn index it responds to. Return null for intervention when nothing",
    "specific is warranted.",
    "load and rigor values are on a 0 to 1 scale.",
    "",
    "--- TRANSCRIPT ---",
    turns.map(renderTurn).join("\n\n"),
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Coercion: the model's object -> RawScore. Shape only; spans are checked    */
/* downstream by validateResult.                                              */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceSignal(value: unknown): SignalScore | null {
  if (!isRecord(value)) return null;
  if (typeof value.value !== "number") return null;
  const receiptsIn = Array.isArray(value.receipts) ? value.receipts : [];
  const receipts = receiptsIn
    .filter(isRecord)
    .filter(
      (r) =>
        typeof r.quote === "string" &&
        typeof r.turnRef === "number" &&
        typeof r.rationale === "string",
    )
    .map((r) => ({
      quote: r.quote as string,
      turnRef: r.turnRef as number,
      rationale: r.rationale as string,
    }));
  return { value: value.value, receipts };
}

function coerceIntervention(value: unknown): Intervention | null {
  if (!isRecord(value)) return null;
  if (value.signal !== "load" && value.signal !== "rigor") return null;
  if (typeof value.prompt !== "string") return null;
  if (typeof value.anchoredTo !== "number") return null;
  return {
    signal: value.signal,
    prompt: value.prompt,
    anchoredTo: value.anchoredTo,
  };
}

/**
 * Map the parsed model output to a `RawScore`, or return `null` when the
 * top-level shape is unusable (which triggers exactly one retry).
 */
function coerceRawScore(parsed: unknown, coached: boolean): RawScore | null {
  if (!isRecord(parsed)) return null;
  if (typeof parsed.scored !== "boolean") return null;

  const reasonIfUnscored =
    typeof parsed.reasonIfUnscored === "string"
      ? parsed.reasonIfUnscored
      : null;

  if (!parsed.scored) {
    return {
      scored: false,
      reasonIfUnscored:
        reasonIfUnscored ?? "the judge abstained without giving a reason",
      load: null,
      rigor: null,
      drift: null,
      intervention: null,
      coached,
    };
  }

  return {
    scored: true,
    reasonIfUnscored,
    load: coerceSignal(parsed.load),
    rigor: coerceSignal(parsed.rigor),
    drift: null,
    intervention: coerceIntervention(parsed.intervention),
    coached,
  };
}

/* -------------------------------------------------------------------------- */
/* The judge factory                                                          */
/* -------------------------------------------------------------------------- */

function toJudgeUnavailable(err: unknown): JudgeUnavailableError {
  if (err instanceof JudgeUnavailableError) return err;
  if (err instanceof Anthropic.RateLimitError) {
    return new JudgeUnavailableError("the scoring service is rate limited", {
      cause: err,
    });
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return new JudgeUnavailableError(
      "the scoring service rejected the credentials",
      { cause: err },
    );
  }
  if (err instanceof Anthropic.APIError) {
    return new JudgeUnavailableError("the scoring service returned an error", {
      cause: err,
    });
  }
  return new JudgeUnavailableError("the scoring service could not be reached", {
    cause: err,
  });
}

/**
 * Build an LLM-backed `Judge`.
 *
 * The model is `opts.model`, else `process.env.INSTRUMENT_MODEL`, else
 * `claude-opus-5`. Credentials are resolved by the SDK from the environment;
 * this function does not read a key directly.
 */
export function makeLlmJudge(opts?: { model?: string }): Judge {
  const model = opts?.model ?? process.env.INSTRUMENT_MODEL ?? DEFAULT_MODEL;
  const format = jsonSchemaOutputFormat(RAW_SCORE_SCHEMA);

  return async function llmJudge(turns, rubricText, { coached }) {
    const client = new Anthropic();
    const basePrompt = buildUserPrompt(rubricText, turns);
    const RETRY_NOTE =
      "\n\n--- NOTE ---\nYour previous reply did not parse as the required " +
      "structured object. Return only a JSON object matching the schema, with " +
      "load, rigor, and intervention each either the object shape or null.";

    let lastMalformed: unknown = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const userPrompt = attempt === 0 ? basePrompt : basePrompt + RETRY_NOTE;
      let parsed: unknown;
      try {
        const response = await client.messages.parse({
          model,
          max_tokens: MAX_TOKENS,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
          output_config: { format },
        });
        parsed = response.parsed_output;
      } catch (err) {
        // Transport, rate-limit, and auth failures are terminal.
        if (err instanceof Anthropic.APIError) throw toJudgeUnavailable(err);
        // A non-API `AnthropicError` here is the structured-output helper
        // failing to parse the response body: treat it as malformed and let
        // the loop take its one retry.
        if (err instanceof Anthropic.AnthropicError) {
          lastMalformed = err;
          continue;
        }
        throw toJudgeUnavailable(err);
      }

      const raw = coerceRawScore(parsed, coached);
      if (raw) return raw;
      lastMalformed = parsed;
    }

    throw new JudgeUnavailableError(
      "the scoring service returned output that did not match the schema",
      { cause: lastMalformed },
    );
  };
}
