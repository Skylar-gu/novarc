/**
 * Parser for `validation/set.md`.
 *
 * The validation set is authored as one Markdown file so it is easy to read and
 * edit. This module turns it back into `{ label, turns }` pairs for
 * `validation/run.ts`. The format is described at the top of `set.md`; the
 * parser is deliberately strict and throws on anything it does not recognise so
 * a malformed edit fails loudly rather than silently dropping a transcript.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import type { Turn } from "../lib/instrument/types.ts";

export type LoadBand = "low" | "mid" | "high";

export type Category =
  | "rich"
  | "lookup"
  | "paste-polish"
  | "adversarial"
  | "short"
  | "coached"
  | "mixed";

const CATEGORIES: readonly Category[] = [
  "rich",
  "lookup",
  "paste-polish",
  "adversarial",
  "short",
  "coached",
  "mixed",
];

export interface ReferenceLabel {
  /** The transcript id — the `##` heading in `set.md`. */
  id: string;
  category: Category;
  /** Scored with `coached: true` (a follow-up to an intervention). */
  coached: boolean;
  /** Whether a careful reader expects any score at all, or an abstention. */
  expectScored: boolean;
  /**
   * Expected Load band when scored (low < 0.4 ≤ mid ≤ 0.7 < high), or `null`
   * when not scored or genuinely debatable ("n/a" in the file).
   */
  loadBand: LoadBand | null;
  /**
   * `true`  — Rigor should carry a value.
   * `false` — Rigor should abstain.
   * `null`  — either reading is defensible ("either" in the file).
   */
  rigorScored: boolean | null;
  /** Fluent-but-empty prose that must not earn Rigor (adversarial metric). */
  adversarial: boolean;
  notes: string;
}

export interface ValidationCase {
  label: ReferenceLabel;
  turns: Turn[];
}

const HERE = dirname(fileURLToPath(import.meta.url));
const SET_FILE = join(HERE, "set.md");

const ROLE_RE = /^\*\*(user|assistant):\*\*\s*$/;
const META_RE = /^-\s+([A-Za-z]+):\s*(.*)$/;

function parseYesNo(id: string, key: string, value: string): boolean {
  if (value === "yes") return true;
  if (value === "no") return false;
  throw new Error(`${id}: ${key} must be "yes" or "no", got "${value}"`);
}

function parseLoadBand(id: string, value: string): LoadBand | null {
  if (value === "n/a" || value === "") return null;
  if (value === "low" || value === "mid" || value === "high") return value;
  throw new Error(`${id}: loadBand must be low/mid/high/n/a, got "${value}"`);
}

function parseRigorScored(id: string, value: string): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  if (value === "either") return null;
  throw new Error(`${id}: rigorScored must be yes/no/either, got "${value}"`);
}

function parseCategory(id: string, value: string): Category {
  const found = CATEGORIES.find((c) => c === value);
  if (!found) throw new Error(`${id}: unknown category "${value}"`);
  return found;
}

function buildLabel(id: string, meta: Map<string, string>): ReferenceLabel {
  const need = (key: string): string => {
    const v = meta.get(key);
    if (v === undefined) throw new Error(`${id}: missing "${key}" in label`);
    return v;
  };
  return {
    id,
    category: parseCategory(id, need("category")),
    coached: parseYesNo(id, "coached", need("coached")),
    expectScored: parseYesNo(id, "expectScored", need("expectScored")),
    loadBand: parseLoadBand(id, need("loadBand")),
    rigorScored: parseRigorScored(id, need("rigorScored")),
    adversarial: parseYesNo(id, "adversarial", need("adversarial")),
    notes: need("notes"),
  };
}

interface RawBlock {
  id: string;
  lines: string[];
}

/** Split the file into `## ` blocks, discarding the header before the first. */
function splitBlocks(text: string): RawBlock[] {
  const blocks: RawBlock[] = [];
  let current: RawBlock | null = null;
  for (const line of text.split("\n")) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = { id: heading[1], lines: [] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return blocks;
}

function parseBlock(block: RawBlock): ValidationCase {
  const { id } = block;
  const meta = new Map<string, string>();
  const turns: Turn[] = [];

  let role: "user" | "assistant" | null = null;
  let buffer: string[] = [];
  let seenTurn = false;

  const flush = (): void => {
    if (role === null) return;
    const textValue = buffer.join(" ").replace(/\s+/g, " ").trim();
    if (textValue.length === 0) {
      throw new Error(`${id}: empty ${role} turn`);
    }
    turns.push({ role, text: textValue, index: turns.length });
    buffer = [];
  };

  for (const line of block.lines) {
    if (line.trim() === "---") break;

    const roleMatch = ROLE_RE.exec(line);
    if (roleMatch) {
      flush();
      role = roleMatch[1] === "user" ? "user" : "assistant";
      seenTurn = true;
      continue;
    }

    if (!seenTurn) {
      const metaMatch = META_RE.exec(line);
      if (metaMatch) {
        meta.set(metaMatch[1], metaMatch[2].trim());
        continue;
      }
      // Non-meta prose before the first turn (blank lines etc.) is ignored.
      continue;
    }

    buffer.push(line);
  }
  flush();

  if (turns.length === 0) throw new Error(`${id}: no turns`);
  if (turns[0].role !== "user") {
    throw new Error(`${id}: first turn must be from the user`);
  }

  return { label: buildLabel(id, meta), turns };
}

export function loadValidationSet(): ValidationCase[] {
  const text = readFileSync(SET_FILE, "utf8");
  // Only `##` blocks that actually contain a turn are transcripts; prose
  // sections in the file header (e.g. "## Format") are skipped.
  const cases = splitBlocks(text)
    .filter((b) => b.lines.some((line) => ROLE_RE.test(line)))
    .map(parseBlock);
  if (cases.length === 0) {
    throw new Error("validation/set.md contains no transcripts");
  }
  const ids = new Set<string>();
  for (const c of cases) {
    if (ids.has(c.label.id)) {
      throw new Error(`duplicate transcript id: ${c.label.id}`);
    }
    ids.add(c.label.id);
  }
  return cases;
}
