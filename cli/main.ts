/**
 * `novarc-instrument` — read your own half of a Claude Code session, locally.
 *
 *   npm run instrument                 # pick sessions from a list, score them
 *   npm run instrument -- --list       # just show what's on this machine
 *   npm run instrument -- --last 3     # score the 3 most recent, no prompt
 *   npm run instrument -- --all --dry-run
 *
 * Everything runs on this machine with the deterministic heuristic engine.
 * Nothing is uploaded. Scored readings are appended to `~/.novarc/record.json`
 * (override with `NOVARC_RECORD`), and Drift is recomputed from that file.
 *
 * See `docs/INSTRUMENT_CLI.md`.
 */

import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

import { scoreTranscript } from "../lib/instrument/score.ts";
import { computeDrift } from "../lib/instrument/drift.ts";
import type { ScoreResult, Turn } from "../lib/instrument/types.ts";
import { discoverSessions, type SessionSummary } from "./discover.ts";
import { parseSession } from "./parseSession.ts";
import { parseSelection, SelectionError } from "./select.ts";
import { appendReadings, readRecord, recordPath } from "./record.ts";
import {
  formatDrift,
  formatInterventions,
  formatReading,
  formatSessionList,
} from "./format.ts";

const USAGE = `novarc-instrument — score your half of a Claude Code session, locally

Usage:
  npm run instrument -- [options]

Selection (without one of these you get an interactive list):
  --all              score every discovered session
  --last N           score the N most recent
  --pick "1,3,5-8"   score these positions from the discovered list
  --match TEXT       limit to sessions whose title or path contains TEXT
  --project PATH     limit to sessions whose working dir contains PATH

Other:
  --list             print the discovered sessions and exit
  --limit N          how many to show in the interactive list (default 25)
  --coached          mark these as coached (kept out of the Drift trend)
  --dry-run          score and print, but do not write the record
  --record PATH      record file to read/write (default ~/.novarc/record.json,
                     or $NOVARC_RECORD)
  -h, --help         this text

Nothing leaves your machine. The transcript is read only for sessions you pick.`;

interface Args {
  list: boolean;
  all: boolean;
  last: number | null;
  pick: string | null;
  match: string | null;
  project: string | null;
  limit: number;
  coached: boolean;
  dryRun: boolean;
  record: string | null;
}

function parseCliArgs(argv: string[]): Args {
  const { values } = parseArgs({
    args: argv,
    options: {
      list: { type: "boolean", default: false },
      all: { type: "boolean", default: false },
      last: { type: "string" },
      pick: { type: "string" },
      match: { type: "string" },
      project: { type: "string" },
      limit: { type: "string" },
      coached: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      record: { type: "string" },
      help: { type: "boolean", default: false, short: "h" },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    process.exit(0);
  }

  const toPositiveInt = (raw: string | undefined, name: string): number | null => {
    if (raw === undefined) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      fail(`--${name} needs a positive whole number, got "${raw}".`);
    }
    return n;
  };

  return {
    list: values.list ?? false,
    all: values.all ?? false,
    last: toPositiveInt(values.last, "last"),
    pick: values.pick ?? null,
    match: values.match ?? null,
    project: values.project ?? null,
    limit: toPositiveInt(values.limit, "limit") ?? 25,
    coached: values.coached ?? false,
    dryRun: values["dry-run"] ?? false,
    record: values.record ?? null,
  };
}

function fail(message: string): never {
  process.stderr.write(`error: ${message}\n`);
  process.exit(2);
}

async function chooseInteractively(
  sessions: SessionSummary[],
  limit: number,
): Promise<SessionSummary[]> {
  if (!process.stdin.isTTY) {
    fail(
      "no session selected. Pass --all, --last N, or --pick, or run this in a terminal.",
    );
  }
  const shown = sessions.slice(0, limit);
  process.stdout.write(`${formatSessionList(shown)}\n`);
  if (sessions.length > shown.length) {
    process.stdout.write(
      `  … ${sessions.length - shown.length} more (raise --limit or use --match to narrow)\n`,
    );
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const answer = await rl.question(
        "\nSessions to analyze (e.g. 1,3,5-8, 'all', Enter to cancel): ",
      );
      try {
        const idx = parseSelection(answer, shown.length);
        return idx.map((i) => shown[i]);
      } catch (err) {
        if (err instanceof SelectionError) {
          process.stdout.write(`  ${err.message}\n`);
          continue;
        }
        throw err;
      }
    }
  } finally {
    rl.close();
  }
}

function resolveSelection(
  sessions: SessionSummary[],
  args: Args,
): Promise<SessionSummary[]> | SessionSummary[] {
  if (args.all) return sessions;
  if (args.last !== null) return sessions.slice(0, args.last);
  if (args.pick !== null) {
    try {
      return parseSelection(args.pick, sessions.length).map((i) => sessions[i]);
    } catch (err) {
      if (err instanceof SelectionError) fail(err.message);
      throw err;
    }
  }
  return chooseInteractively(sessions, args.limit);
}

interface Reading {
  summary: SessionSummary;
  turns: Turn[];
  result: ScoreResult;
}

async function scoreSelected(
  selected: SessionSummary[],
  coached: boolean,
): Promise<Reading[]> {
  const readings: Reading[] = [];
  for (const summary of selected) {
    const turns = parseSession(readFileSync(summary.path, "utf8"));
    const chars = turns.reduce((n, t) => n + t.text.length, 0);
    if (chars > 60_000) {
      process.stdout.write(
        `  note: "${summary.title}" is ${Math.round(chars / 1000)}k chars — larger than the hosted prototype accepts; scored here in full.\n`,
      );
    }
    const result = await scoreTranscript(turns, { coached });
    readings.push({ summary, turns, result });
  }
  return readings;
}

/* --------------------------------------------------------------------- */

const args = parseCliArgs(process.argv.slice(2));

const sessions = discoverSessions({
  project: args.project ?? undefined,
  match: args.match ?? undefined,
});

if (sessions.length === 0) {
  process.stdout.write(
    "No Claude Code sessions found under ~/.claude/projects (set CLAUDE_CONFIG_DIR if yours is elsewhere).\n",
  );
  process.exit(0);
}

process.stdout.write(
  `${sessions.length} Claude Code session${sessions.length === 1 ? "" : "s"} found.\n`,
);

if (args.list) {
  process.stdout.write(`${formatSessionList(sessions)}\n`);
  process.exit(0);
}

const selected = await resolveSelection(sessions, args);

if (selected.length === 0) {
  process.stdout.write("Nothing selected.\n");
  process.exit(0);
}

process.stdout.write(
  `\nScoring ${selected.length} session${selected.length === 1 ? "" : "s"} with the heuristic engine…\n\n`,
);

const readings = await scoreSelected(selected, args.coached);

for (const { summary, result } of readings) {
  process.stdout.write(`${formatReading(summary.title, result)}\n`);
}

const ivBlock = formatInterventions(
  readings.map((r) => ({ title: r.summary.title, result: r.result })),
);
if (ivBlock) process.stdout.write(`\n${ivBlock}\n`);

const path = args.record ?? recordPath();

if (args.dryRun) {
  process.stdout.write(`\nDry run — ${path} not written.\n`);
} else {
  const outcome = appendReadings(
    readings.map(({ result, turns }) => ({ result, turns })),
    path,
  );
  const parts = [`wrote ${outcome.added}`];
  if (outcome.duplicates > 0) parts.push(`${outcome.duplicates} already on file`);
  if (outcome.unscored > 0) parts.push(`${outcome.unscored} unscored`);
  process.stdout.write(`\n${parts.join(", ")} → ${outcome.path}\n`);
}

const record = readRecord(path);
const drift = computeDrift(record.sessions, { now: new Date() });
process.stdout.write(`${formatDrift(drift)}\n`);
