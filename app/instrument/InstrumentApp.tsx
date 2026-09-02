"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Section } from "@/components/ui/Section";
import { TranscriptInput } from "@/components/instrument/TranscriptInput";
import { Readout } from "@/components/instrument/Readout";
import { UnscoredNotice } from "@/components/instrument/UnscoredNotice";
import {
  CoachedToggle,
  InterventionCard,
} from "@/components/instrument/InterventionCard";
import { DriftTrend } from "@/components/instrument/DriftTrend";
import { SessionHistory } from "@/components/instrument/SessionHistory";
import { EngineModeBadge } from "@/components/instrument/EngineModeBadge";
import { Button } from "@/components/ui/Button";
import {
  NETWORK_ERROR,
  UNREADABLE_RESPONSE,
  scoreErrorMessage,
} from "@/components/instrument/errorMessage";
import type { ScoreResult, Turn } from "@/lib/instrument/types";
import { useRecord } from "@/lib/instrument/useRecord";
import { hashTranscript } from "@/lib/instrument/record";

type Phase =
  | { status: "input" }
  | { status: "scoring" }
  | { status: "result"; result: ScoreResult; turns: Turn[] }
  | { status: "error"; message: string };

/** Scroll the receipt for a given signal + turn into view, honouring
 *  reduced-motion. The id is namespaced by signal so Load and Rigor can both
 *  cite the same turn without colliding. */
function jumpToTurn(signal: "load" | "rigor", turnRef: number): void {
  const target = document.getElementById(`ev-${signal}-turn-${turnRef}`);
  if (!target) return;
  const reduce = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  target.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "center",
  });
}

/**
 * The client island for `/instrument`: transcript in, one scoring request out,
 * then the reading. The transcript is posted once to `/api/instrument/score`
 * and is not stored anywhere; only the derived scores land in the local record.
 */
export function InstrumentApp() {
  const record = useRecord();
  const { add: addToRecord } = record;
  const [phase, setPhase] = useState<Phase>({ status: "input" });
  const [coached, setCoached] = useState(false);

  // Move focus to the incoming view when the phase changes, so keyboard and
  // screen-reader users are not dropped to <body> when a Section unmounts.
  const resultAnchorRef = useRef<HTMLDivElement>(null);
  const inputAnchorRef = useRef<HTMLDivElement>(null);
  const phaseChangedByUser = useRef(false);
  useEffect(() => {
    if (!phaseChangedByUser.current) return;
    phaseChangedByUser.current = false;
    if (phase.status === "result") resultAnchorRef.current?.focus();
    else if (phase.status === "input") inputAnchorRef.current?.focus();
  }, [phase.status]);

  const score = useCallback(
    async (turns: Turn[]) => {
      setPhase({ status: "scoring" });

      let response: Response;
      try {
        response = await fetch("/api/instrument/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ turns, coached }),
        });
      } catch {
        setPhase({ status: "error", message: NETWORK_ERROR });
        return;
      }

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setPhase({
          status: "error",
          message: scoreErrorMessage(body?.error, response.status),
        });
        return;
      }

      let result: ScoreResult;
      try {
        result = (await response.json()) as ScoreResult;
      } catch {
        setPhase({ status: "error", message: UNREADABLE_RESPONSE });
        return;
      }

      if (typeof result?.scored !== "boolean") {
        setPhase({ status: "error", message: UNREADABLE_RESPONSE });
        return;
      }

      // Stores scored results only; an unscored result is a no-op here.
      addToRecord(result, hashTranscript(turns));
      phaseChangedByUser.current = true;
      setPhase({ status: "result", result, turns });
      setCoached(false);
    },
    [coached, addToRecord],
  );

  const reset = useCallback(() => {
    phaseChangedByUser.current = true;
    setPhase({ status: "input" });
    setCoached(false);
  }, []);

  const isScoring = phase.status === "scoring";
  const showInput = phase.status !== "result";

  const liveMessage =
    phase.status === "scoring"
      ? "Scoring your session."
      : phase.status === "result"
        ? phase.result.scored
          ? "Session scored."
          : "This session was not scored."
        : "";

  // `${signal}:${turnRef}` for every receipt shown, so a jump target is only
  // offered when that exact signal + turn pairing is on screen.
  const receiptKeys = useMemo(() => {
    const keys = new Set<string>();
    if (phase.status !== "result" || !phase.result.scored) return keys;
    for (const receipt of phase.result.load?.receipts ?? []) {
      keys.add(`load:${receipt.turnRef}`);
    }
    for (const receipt of phase.result.rigor?.receipts ?? []) {
      keys.add(`rigor:${receipt.turnRef}`);
    }
    return keys;
  }, [phase]);

  return (
    <>
      {/* Polite live region: state changes are announced without stealing focus. */}
      <div aria-live="polite" className="sr-only" role="status">
        {liveMessage}
      </div>

      {showInput ? (
        <Section title="Your transcript" titleClassName="sr-only" divider={false}>
          <div
            ref={inputAnchorRef}
            tabIndex={-1}
            className="flex flex-col gap-6 outline-none"
          >
            <TranscriptInput onParsed={score} disabled={isScoring} />

            <CoachedToggle
              checked={coached}
              onChange={setCoached}
              disabled={isScoring}
            />

            {isScoring ? (
              <p className="text-sm text-text-muted">
                Scoring this session. This is one request to the scoring route;
                the transcript is not stored.
              </p>
            ) : null}

            {phase.status === "error" ? (
              <div
                role="alert"
                className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-text"
              >
                <p>{phase.message}</p>
                <p className="mt-2 text-text-muted">
                  Your transcript is still in the field above. Adjust it if you
                  need to, then score again.
                </p>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {phase.status === "result" ? (
        <>
          <Section title="The reading" divider={false}>
            <div
              ref={resultAnchorRef}
              tabIndex={-1}
              className="flex flex-col gap-8 outline-none"
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-sans text-sm text-text-muted">
                  {phase.result.scored
                    ? "Scored from your turns only."
                    : "Not scored this session."}
                </p>
                <EngineModeBadge mode={phase.result.engineMode} />
              </div>

              {phase.result.scored ? (
                <div className="grid gap-8 sm:grid-cols-2">
                  <Readout
                    signal="load"
                    score={phase.result.load}
                    turns={phase.turns}
                  />
                  <Readout
                    signal="rigor"
                    score={phase.result.rigor}
                    turns={phase.turns}
                  />
                </div>
              ) : (
                <UnscoredNotice reason={phase.result.reasonIfUnscored} />
              )}

              <InterventionCard
                intervention={phase.result.intervention}
                coached={coached}
                onCoachedChange={setCoached}
                onJumpToTurn={jumpToTurn}
                canJump={
                  phase.result.intervention
                    ? receiptKeys.has(
                        `${phase.result.intervention.signal}:${phase.result.intervention.anchoredTo}`,
                      )
                    : false
                }
              />

              <div>
                <Button type="button" onClick={reset}>
                  Score another session
                </Button>
              </div>
            </div>
          </Section>

          <Section title="Drift">
            <DriftTrend sessions={record.sessions} drift={record.drift} />
          </Section>
        </>
      ) : null}

      <Section title="Recorded sessions">
        <SessionHistory record={record} />
      </Section>
    </>
  );
}
