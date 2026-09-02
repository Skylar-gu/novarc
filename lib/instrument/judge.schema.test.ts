import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { RAW_SCORE_SCHEMA } from "./judge.ts";

/**
 * `jsonSchemaOutputFormat` transforms the schema before it is sent. Its
 * transform only understands a string-valued `type`, so an array-valued
 * `type: ["object", "null"]` silently loses its `properties`/`required`. The
 * schema is written with `anyOf` instead; these tests pin that it survives the
 * transform with structure intact, so a regression to the array form is caught
 * here rather than only with a live API key.
 */

interface Node {
  type?: string;
  anyOf?: Node[];
  properties?: Record<string, Node>;
  required?: string[];
  items?: Node;
}

const out = jsonSchemaOutputFormat(RAW_SCORE_SCHEMA) as {
  type: string;
  schema: Node;
};

function objectBranch(node: Node): Node {
  assert.ok(Array.isArray(node.anyOf), "expected an anyOf node");
  const branch = node.anyOf.find((b) => b.type === "object");
  assert.ok(branch, "anyOf has an object branch");
  return branch;
}

function props(node: Node): Record<string, Node> {
  assert.ok(node.properties, "node has properties");
  return node.properties;
}

test("output format is a json_schema wrapper", () => {
  assert.equal(out.type, "json_schema");
  assert.ok(out.schema && typeof out.schema === "object");
});

test("nullable signals keep their object structure after transform", () => {
  for (const key of ["load", "rigor"] as const) {
    const branch = objectBranch(props(out.schema)[key]);
    assert.deepEqual(
      Object.keys(props(branch)).sort(),
      ["receipts", "value"],
      `${key} object branch keeps its properties`,
    );
    assert.deepEqual((branch.required ?? []).slice().sort(), ["receipts", "value"]);
    const receiptItems = props(branch).receipts.items;
    assert.ok(receiptItems, "receipts.items survives");
    assert.deepEqual(Object.keys(props(receiptItems)).sort(), [
      "quote",
      "rationale",
      "turnRef",
    ]);
  }
});

test("nullable intervention keeps its object structure after transform", () => {
  const branch = objectBranch(props(out.schema).intervention);
  assert.deepEqual(Object.keys(props(branch)).sort(), [
    "anchoredTo",
    "prompt",
    "signal",
  ]);
});

test("reasonIfUnscored is a nullable string", () => {
  const branch = props(out.schema).reasonIfUnscored;
  assert.ok(Array.isArray(branch.anyOf));
  assert.deepEqual(
    branch.anyOf.map((b) => b.type).sort(),
    ["null", "string"],
  );
});

test("top level still requires every key", () => {
  assert.deepEqual(
    (out.schema.required ?? []).slice().sort(),
    ["intervention", "load", "reasonIfUnscored", "rigor", "scored"],
  );
});
