/**
 * Find the local Claude Code sessions and summarise each one for the picker.
 *
 * Claude Code keeps one JSON Lines file per session under
 * `~/.claude/projects/<encoded-cwd>/<session-id>.jsonl`. This module lists those
 * files and reads a small header from each — a title, the project path, when it
 * ran, and how many turns each side took — WITHOUT keeping the transcript. The
 * transcript is only read later, and only for the sessions the person picks.
 *
 * `CLAUDE_CONFIG_DIR` overrides `~/.claude` when set (matches Claude Code).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { cleanUserText, parseSession } from "./parseSession.ts";

export interface SessionSummary {
  /** Session id — the file's basename without `.jsonl`. */
  id: string;
  /** Absolute path to the `.jsonl` file. */
  path: string;
  /** Best available label: the model-written title, else the last prompt, else
   *  the first thing the person typed, else "(untitled)". */
  title: string;
  /** Working directory the session ran in, if the file recorded one. */
  cwd: string | null;
  /** Git branch at the time, if recorded. */
  gitBranch: string | null;
  /** ISO timestamp of the first and last events, or null if none were stamped. */
  startedAt: string | null;
  endedAt: string | null;
  /** Turn counts after the same filtering `parseSession` applies. */
  userTurns: number;
  assistantTurns: number;
  /** File size in bytes. */
  bytes: number;
}

export interface DiscoverOptions {
  /** Override the Claude config dir (default: `$CLAUDE_CONFIG_DIR` or `~/.claude`). */
  root?: string;
  /** Only sessions whose recorded `cwd` contains this substring. */
  project?: string;
  /** Only sessions whose title or cwd contains this substring (case-insensitive). */
  match?: string;
}

function configRoot(explicit?: string): string {
  if (explicit) return explicit;
  const fromEnv = process.env.CLAUDE_CONFIG_DIR;
  if (fromEnv && fromEnv.trim() !== "") return fromEnv;
  return join(homedir(), ".claude");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Session metadata that isn't in the parsed `Turn[]`. */
interface HeaderMeta {
  title: string | null;
  lastPrompt: string | null;
  cwd: string | null;
  gitBranch: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

function scanHeader(fileText: string): HeaderMeta {
  const meta: HeaderMeta = {
    title: null,
    lastPrompt: null,
    cwd: null,
    gitBranch: null,
    startedAt: null,
    endedAt: null,
  };

  for (const line of fileText.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    let entry: unknown;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (!isRecord(entry)) continue;

    if (entry.type === "ai-title") {
      meta.title = str(entry.aiTitle) ?? meta.title; // last one wins
      continue;
    }
    if (entry.type === "last-prompt") {
      meta.lastPrompt = str(entry.lastPrompt) ?? meta.lastPrompt;
      continue;
    }

    meta.cwd = meta.cwd ?? str(entry.cwd);
    meta.gitBranch = meta.gitBranch ?? str(entry.gitBranch);

    const ts = str(entry.timestamp);
    if (ts) {
      meta.startedAt = meta.startedAt ?? ts;
      meta.endedAt = ts;
    }
  }

  return meta;
}

function oneLine(text: string, max = 72): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function summarise(path: string, id: string): SessionSummary {
  const fileText = readFileSync(path, "utf8");
  const meta = scanHeader(fileText);
  // Turn data comes from the same parser the scorer uses, so the counts and the
  // fallback title match what would actually be read.
  const turns = parseSession(fileText);
  const firstUser = turns.find((t) => t.role === "user");
  const title =
    meta.title ??
    (meta.lastPrompt ? cleanUserText(meta.lastPrompt) : null) ??
    (firstUser ? firstUser.text : null) ??
    "(untitled)";

  return {
    id,
    path,
    title: oneLine(title) || "(untitled)",
    cwd: meta.cwd,
    gitBranch: meta.gitBranch,
    startedAt: meta.startedAt,
    endedAt: meta.endedAt,
    userTurns: turns.filter((t) => t.role === "user").length,
    assistantTurns: turns.filter((t) => t.role === "assistant").length,
    bytes: statSync(path).size,
  };
}

function listJsonlFiles(projectsDir: string): { path: string; id: string }[] {
  const out: { path: string; id: string }[] = [];
  let projectDirs: string[];
  try {
    projectDirs = readdirSync(projectsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return out;
  }
  for (const dir of projectDirs) {
    const full = join(projectsDir, dir);
    let files: string[];
    try {
      files = readdirSync(full).filter((f) => f.endsWith(".jsonl"));
    } catch {
      continue;
    }
    for (const file of files) {
      out.push({ path: join(full, file), id: file.replace(/\.jsonl$/, "") });
    }
  }
  return out;
}

/**
 * Discover and summarise sessions, newest first.
 *
 * Returns an empty array when the projects directory does not exist — the
 * caller reports "no sessions found" rather than treating it as an error.
 */
export function discoverSessions(opts: DiscoverOptions = {}): SessionSummary[] {
  const projectsDir = join(configRoot(opts.root), "projects");
  const files = listJsonlFiles(projectsDir);

  const summaries: SessionSummary[] = [];
  for (const { path, id } of files) {
    try {
      summaries.push(summarise(path, id));
    } catch {
      // Unreadable file — leave it out rather than abort the whole listing.
    }
  }

  const project = opts.project?.toLowerCase();
  const match = opts.match?.toLowerCase();
  const filtered = summaries.filter((s) => {
    if (project && !(s.cwd ?? "").toLowerCase().includes(project)) return false;
    if (match) {
      const hay = `${s.title} ${s.cwd ?? ""}`.toLowerCase();
      if (!hay.includes(match)) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    const ta = a.endedAt ? Date.parse(a.endedAt) : 0;
    const tb = b.endedAt ? Date.parse(b.endedAt) : 0;
    return tb - ta;
  });
}
