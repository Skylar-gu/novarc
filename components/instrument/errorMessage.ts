/**
 * Map a scoring-route failure to one short, human sentence.
 *
 * The route (`app/api/instrument/score`) answers a non-200 with a JSON body of
 * the form `{ error: <code> }` and a matching status. A dropped connection
 * throws before any of that is available, so the client passes `undefined` for
 * the code and the caller shows {@link NETWORK_ERROR} instead.
 *
 * Copy register (BUILD_PLAN §0.1): declarative, hedged, no exclamation marks.
 */

/** Shown when `fetch` itself rejects — the request never reached the route. */
export const NETWORK_ERROR =
  "The score request could not reach the server. Check your connection and try again.";

/** Shown when the route answers 200 but the body is not a readable score. */
export const UNREADABLE_RESPONSE =
  "The scoring engine replied, but the response could not be read. Try scoring again.";

/** The error codes the route is documented to return. */
export type ScoreErrorCode =
  | "invalid_request"
  | "invalid_transcript"
  | "transcript_too_large"
  | "rate_limited"
  | "scoring_failed";

const BY_CODE: Record<ScoreErrorCode, string> = {
  invalid_request:
    "The request was malformed. Reload the page and try scoring again.",
  invalid_transcript:
    "That transcript could not be read as a set of turns. Check the format and try again.",
  transcript_too_large:
    "That transcript is longer than the prototype accepts. Score a shorter part of it.",
  rate_limited:
    "You are scoring faster than the prototype allows. Wait a moment, then try again.",
  scoring_failed:
    "The scoring engine did not return a reading. Try again in a moment.",
};

const BY_STATUS: Record<number, string> = {
  400: BY_CODE.invalid_request,
  413: BY_CODE.transcript_too_large,
  422: BY_CODE.invalid_transcript,
  429: BY_CODE.rate_limited,
  500: BY_CODE.scoring_failed,
};

/**
 * Resolve a message for a non-200 response. Prefers the body's `error` code;
 * falls back to the HTTP status; last resort is a generic line. Never returns
 * an empty string.
 */
export function scoreErrorMessage(
  code: string | undefined | null,
  status: number,
): string {
  if (code && code in BY_CODE) {
    return BY_CODE[code as ScoreErrorCode];
  }
  if (status in BY_STATUS) {
    return BY_STATUS[status];
  }
  if (status >= 500) return BY_CODE.scoring_failed;
  return "Something went wrong while scoring. Try again in a moment.";
}
