import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { discoverSessions } from "./discover.ts";

/** Lay out `<root>/projects/<project>/<id>.jsonl` and return `root`. */
function fixture(
  files: { project: string; id: string; events: unknown[] }[],
): string {
  const root = mkdtempSync(join(tmpdir(), "novarc-claude-"));
  for (const { project, id, events } of files) {
    const dir = join(root, "projects", project);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, `${id}.jsonl`),
      events.map((e) => JSON.stringify(e)).join("\n") + "\n",
    );
  }
  return root;
}

const user = (content: string, ts: string, extra: Record<string, unknown> = {}) => ({
  type: "user",
  message: { role: "user", content },
  timestamp: ts,
  cwd: "/home/me/proj",
  gitBranch: "main",
  ...extra,
});
const asst = (text: string, ts: string) => ({
  type: "assistant",
  message: { role: "assistant", content: [{ type: "text", text }] },
  timestamp: ts,
});

test("discovers a session and counts turns from the shared parser", () => {
  const root = fixture([
    {
      project: "proj",
      id: "aaa",
      events: [
        user("hello there", "2026-02-01T10:00:00Z"),
        asst("hi", "2026-02-01T10:00:01Z"),
        user("follow up", "2026-02-01T10:01:00Z"),
      ],
    },
  ]);
  const [s] = discoverSessions({ root });
  assert.equal(s.id, "aaa");
  assert.equal(s.userTurns, 2);
  assert.equal(s.assistantTurns, 1);
  assert.equal(s.cwd, "/home/me/proj");
  assert.equal(s.gitBranch, "main");
});

test("ai-title wins over first prompt, last title wins", () => {
  const root = fixture([
    {
      project: "proj",
      id: "bbb",
      events: [
        user("some long first question about indexes", "2026-02-01T10:00:00Z"),
        { type: "ai-title", aiTitle: "First title" },
        { type: "ai-title", aiTitle: "Index strategy" },
      ],
    },
  ]);
  const [s] = discoverSessions({ root });
  assert.equal(s.title, "Index strategy");
});

test("falls back to the first cleaned user turn when there is no title", () => {
  const root = fixture([
    {
      project: "proj",
      id: "ccc",
      events: [
        user(
          "<command-name>/login</command-name>",
          "2026-02-01T10:00:00Z",
          { isMeta: true },
        ),
        user("actual first question", "2026-02-01T10:00:05Z"),
      ],
    },
  ]);
  const [s] = discoverSessions({ root });
  assert.equal(s.title, "actual first question");
});

test("newest session comes first", () => {
  const root = fixture([
    {
      project: "p",
      id: "old",
      events: [user("q", "2026-01-01T00:00:00Z"), asst("a", "2026-01-01T00:00:01Z")],
    },
    {
      project: "p",
      id: "new",
      events: [user("q", "2026-03-01T00:00:00Z"), asst("a", "2026-03-01T00:00:01Z")],
    },
  ]);
  const ids = discoverSessions({ root }).map((s) => s.id);
  assert.deepEqual(ids, ["new", "old"]);
});

test("match filters on title and cwd, case-insensitively", () => {
  const root = fixture([
    {
      project: "p",
      id: "one",
      events: [{ type: "ai-title", aiTitle: "Database indexes" }, user("q", "2026-02-01T10:00:00Z")],
    },
    {
      project: "p",
      id: "two",
      events: [{ type: "ai-title", aiTitle: "Frontend layout" }, user("q", "2026-02-01T10:00:00Z")],
    },
  ]);
  const ids = discoverSessions({ root, match: "INDEX" }).map((s) => s.id);
  assert.deepEqual(ids, ["one"]);
});

test("a missing projects directory yields an empty list", () => {
  assert.deepEqual(discoverSessions({ root: join(tmpdir(), "nope-novarc") }), []);
});
