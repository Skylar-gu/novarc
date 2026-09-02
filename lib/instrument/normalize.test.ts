import { test } from "node:test";
import assert from "node:assert/strict";
import {
  collapseWhitespace,
  precedingAssistantTurn,
  spanOccursInTurn,
  turnByRef,
  userTurns,
} from "./normalize.ts";
import type { Turn } from "./types.ts";

const TURNS: Turn[] = [
  { role: "user", text: "I think the   lock is\nthe cause.", index: 0 },
  { role: "assistant", text: "Row locks are plausible.", index: 1 },
  { role: "user", text: "What would confirm it?", index: 2 },
];

test("collapseWhitespace normalises runs and trims", () => {
  assert.equal(collapseWhitespace("  a\n\t b   c "), "a b c");
});

test("spanOccursInTurn matches an exact substring of the cited turn", () => {
  assert.equal(spanOccursInTurn("the cause", 0, TURNS), true);
});

test("spanOccursInTurn tolerates whitespace differences (newline vs space)", () => {
  assert.equal(spanOccursInTurn("lock is the cause", 0, TURNS), true);
});

test("spanOccursInTurn is case-sensitive", () => {
  assert.equal(spanOccursInTurn("THE CAUSE", 0, TURNS), false);
});

test("spanOccursInTurn fails when the span is in a different turn", () => {
  assert.equal(spanOccursInTurn("Row locks are plausible.", 0, TURNS), false);
  assert.equal(spanOccursInTurn("Row locks are plausible.", 1, TURNS), true);
});

test("spanOccursInTurn rejects an empty or whitespace-only quote", () => {
  assert.equal(spanOccursInTurn("", 0, TURNS), false);
  assert.equal(spanOccursInTurn("   \n ", 0, TURNS), false);
});

test("spanOccursInTurn fails on a turnRef that matches no turn", () => {
  assert.equal(spanOccursInTurn("anything", 99, TURNS), false);
});

test("turnByRef returns the turn with the matching index", () => {
  assert.equal(turnByRef(TURNS, 2)?.text, "What would confirm it?");
  assert.equal(turnByRef(TURNS, 5), undefined);
});

test("userTurns keeps order and drops assistant turns", () => {
  assert.deepEqual(
    userTurns(TURNS).map((t) => t.index),
    [0, 2],
  );
});

test("precedingAssistantTurn finds the nearest earlier assistant turn", () => {
  assert.equal(precedingAssistantTurn(TURNS, 2)?.index, 1);
  assert.equal(precedingAssistantTurn(TURNS, 0), undefined);
});
