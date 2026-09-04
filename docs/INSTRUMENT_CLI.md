# INSTRUMENT_CLI — reading your own sessions, locally

`cli/` is a small command-line reader for the instrument. It is modelled on
[Paxel](https://paxel.ycombinator.com/) — a local tool that scores your AI
coding sessions — with one deliberate difference: **it never reads a
conversation you did not pick.** There is no "scan everything" mode.

```
npm run instrument                 # list your sessions, pick some, score them
npm run instrument -- --list       # just show what is on this machine
npm run instrument -- --last 3     # score the 3 most recent, no prompt
npm run instrument -- --match orders --dry-run
```

---

## What it does

1. **Discovers** Claude Code sessions at `~/.claude/projects/**/*.jsonl` (set
   `CLAUDE_CONFIG_DIR` if yours is elsewhere). For each it reads a short header —
   a title, the working directory, when it ran, how many turns each side took —
   and nothing more.
2. **Lists** them, newest first, and waits for you to choose (`1,3,5-8`, `all`,
   or Enter to cancel). Non-interactive selection: `--all`, `--last N`,
   `--pick "1,3,5-8"`, narrowed by `--match TEXT` / `--project PATH`.
3. **Reads the transcript only for the sessions you chose**, reduces each to the
   instrument's `Turn[]`, and scores it with the deterministic heuristic engine
   (`lib/instrument/heuristic.ts`) — the same engine the web prototype runs when
   no API key is set. No network call, no language-model judge.
4. **Appends** the scored readings to `~/.novarc/record.json` (override with
   `NOVARC_RECORD`) and recomputes Drift over the whole file.

Nothing is uploaded. The record file is the same `{ version, sessions }`
document the web prototype keeps in `localStorage`, so it can be imported there
later (`docs/INSTRUMENT_PROTOTYPE.md` → privacy model).

---

## What counts as "your half" of a session

`cli/parseSession.ts` is intentionally conservative and easy to audit. From each
`.jsonl` it keeps:

- **user turns** — messages you typed. It drops: tool results echoed back as
  user turns (`toolUseResult` present, or a `tool_result` content block), meta
  and compact-summary injections (`isMeta` / `isCompactSummary`), and subagent
  turns (`isSidechain`). It strips the wrappers Claude Code injects —
  `<system-reminder>`, `<command-name>` / `<command-message>` / `<command-args>`,
  `<local-command-stdout>`, `<user-prompt-submit-hook>`, `[Request interrupted
  by user]` — and if a turn is nothing but those, it is dropped.
- **assistant turns** — the model's `text` blocks only. `thinking` and
  `tool_use` blocks are discarded.

Consecutive turns from the same side are merged. The result is what
`scoreTranscript` sees.

---

## Flags

| Flag | Effect |
|---|---|
| `--list` | Print the discovered sessions and exit. |
| `--all` | Select every discovered session. |
| `--last N` | Select the N most recent. |
| `--pick "1,3,5-8"` | Select these positions from the discovered list. |
| `--match TEXT` | Limit to sessions whose title or path contains TEXT. |
| `--project PATH` | Limit to sessions whose working dir contains PATH. |
| `--limit N` | How many to show in the interactive list (default 25). |
| `--coached` | Mark these readings as coached (excluded from the Drift trend). |
| `--dry-run` | Score and print, but do not write the record. |
| `--record PATH` | Record file to read/write. |
| `-h`, `--help` | Usage. |

`--match` and `--last` are stable for scripting; positional `--pick` is resolved
against the current list, which can shift if a session is being written to right
now.

---

## Known limits (v1)

- **Claude Code only.** Codex CLI and Cursor have their own local stores; adding
  them is a parser each.
- **No account, no sync.** The record is one file on one machine. Cross-device
  history is out of scope here — see the discussion in `docs/INSTRUMENT_PROTOTYPE.md`.
- **One session, one reading.** A long multi-hour session is scored as a single
  unit. The heuristic under-reads reasoning density over hundreds of turns
  (`docs/RESEARCH.md` on the conservatism), so very long sessions tend to read
  low on Rigor. Segmenting a transcript into windows and aggregating is the
  obvious next step and is not done yet.
- **Not `npx`-installable yet.** It runs from the repo (`npm run instrument`).
  Packaging it as a standalone binary is a later step.
- **The heuristic is not the validated instrument.** Same caveat as the
  prototype: these readings demonstrate the method, they are not a measurement
  to act on. See `docs/VALIDATION.md`.

---

## Files

| File | Role |
|---|---|
| `cli/main.ts` | Arg parsing, the interactive picker, orchestration. |
| `cli/discover.ts` | Find and summarise sessions for the list. |
| `cli/parseSession.ts` | One `.jsonl` → `Turn[]`, with the filtering above. |
| `cli/select.ts` | Parse `"1,3,5-8"` / `all` selection expressions. |
| `cli/record.ts` | Read/write `~/.novarc/record.json` in the shared record shape. |
| `cli/format.ts` | Plain-text rendering (pure, tested). |

Tests sit beside each file and run under `npm run test`.
