import { test } from "node:test";
import assert from "node:assert/strict";
import { makeOpenRouterSplitter } from "./openrouterSplit.ts";
import { SplitUnavailableError } from "./llmSplit.ts";

/** Every test pastes this text; `VALID_TURNS`' text must stay a verbatim
 *  substring of it, since `turnsAreVerbatim` now checks that. */
const SOURCE_TEXT = "Skylar Gu\nhello there\n\nClaude\nhi, how can I help";

const VALID_TURNS = {
  turns: [
    { role: "user", text: "hello there" },
    { role: "assistant", text: "hi, how can I help" },
  ],
};

function chatResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function openRouterEnvelope(content: string): unknown {
  return { choices: [{ message: { content } }] };
}

/** Swap `globalThis.fetch` for the duration of one test, restoring after. */
function withFetch(
  impl: typeof fetch,
  run: () => Promise<void>,
): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

test("throws synchronously when OPENROUTER_API_KEY is not set", () => {
  const original = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  try {
    assert.throws(() => makeOpenRouterSplitter(), SplitUnavailableError);
  } finally {
    if (original !== undefined) process.env.OPENROUTER_API_KEY = original;
  }
});

test("a well-formed response from the primary model is used, and the backup is never called", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  let calls = 0;
  await withFetch(
    (async (_input, init) => {
      calls += 1;
      const body = JSON.parse((init as RequestInit).body as string) as {
        model: string;
      };
      assert.equal(body.model, "google/gemini-2.5-flash-lite");
      return chatResponse(openRouterEnvelope(JSON.stringify(VALID_TURNS)));
    }) as typeof fetch,
    async () => {
      const splitter = makeOpenRouterSplitter();
      const turns = await splitter(SOURCE_TEXT);
      assert.equal(calls, 1);
      assert.equal(turns.length, 2);
      assert.equal(turns[0].role, "user");
      assert.equal(turns[1].role, "assistant");
    },
  );
});

test("one malformed reply from the primary model is retried before succeeding", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  let calls = 0;
  await withFetch(
    (async () => {
      calls += 1;
      if (calls === 1) return chatResponse(openRouterEnvelope("not json"));
      return chatResponse(openRouterEnvelope(JSON.stringify(VALID_TURNS)));
    }) as typeof fetch,
    async () => {
      const splitter = makeOpenRouterSplitter();
      const turns = await splitter(SOURCE_TEXT);
      assert.equal(calls, 2);
      assert.equal(turns.length, 2);
    },
  );
});

test("falls back to the backup model when the primary's output never validates", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  const modelsCalled: string[] = [];
  await withFetch(
    (async (_input, init) => {
      const body = JSON.parse((init as RequestInit).body as string) as {
        model: string;
      };
      modelsCalled.push(body.model);
      if (body.model === "google/gemini-2.5-flash-lite") {
        return chatResponse(openRouterEnvelope("not json"));
      }
      return chatResponse(openRouterEnvelope(JSON.stringify(VALID_TURNS)));
    }) as typeof fetch,
    async () => {
      const splitter = makeOpenRouterSplitter();
      const turns = await splitter(SOURCE_TEXT);
      assert.equal(turns.length, 2);
      // Two attempts against the primary, then one against the backup.
      assert.deepEqual(modelsCalled, [
        "google/gemini-2.5-flash-lite",
        "google/gemini-2.5-flash-lite",
        "openai/gpt-4o-mini",
      ]);
    },
  );
});

test("falls back to the backup model when the primary fails outright", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  const modelsCalled: string[] = [];
  await withFetch(
    (async (_input, init) => {
      const body = JSON.parse((init as RequestInit).body as string) as {
        model: string;
      };
      modelsCalled.push(body.model);
      if (body.model === "google/gemini-2.5-flash-lite") {
        return chatResponse({ error: "nope" }, 429);
      }
      return chatResponse(openRouterEnvelope(JSON.stringify(VALID_TURNS)));
    }) as typeof fetch,
    async () => {
      const splitter = makeOpenRouterSplitter();
      const turns = await splitter(SOURCE_TEXT);
      assert.equal(turns.length, 2);
      assert.deepEqual(modelsCalled, [
        "google/gemini-2.5-flash-lite",
        "openai/gpt-4o-mini",
      ]);
    },
  );
});

test("a turn whose text is not actually in the pasted text is rejected as fabricated", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  const modelsCalled: string[] = [];
  const FABRICATED_TURNS = {
    turns: [
      // Echoes the prompt's own instructions instead of the pasted text —
      // the failure mode observed in production that this check exists for.
      { role: "user", text: "Split the conversation below into turns" },
      { role: "assistant", text: "hi, how can I help" },
    ],
  };
  await withFetch(
    (async (_input, init) => {
      const body = JSON.parse((init as RequestInit).body as string) as {
        model: string;
      };
      modelsCalled.push(body.model);
      if (body.model === "google/gemini-2.5-flash-lite") {
        return chatResponse(
          openRouterEnvelope(JSON.stringify(FABRICATED_TURNS)),
        );
      }
      return chatResponse(openRouterEnvelope(JSON.stringify(VALID_TURNS)));
    }) as typeof fetch,
    async () => {
      const splitter = makeOpenRouterSplitter();
      const turns = await splitter(SOURCE_TEXT);
      // The primary's fabricated reply never validates (two attempts), so
      // the backup is the one that actually produced the result.
      assert.deepEqual(modelsCalled, [
        "google/gemini-2.5-flash-lite",
        "google/gemini-2.5-flash-lite",
        "openai/gpt-4o-mini",
      ]);
      assert.equal(turns.length, 2);
      assert.equal(turns[0].text, "hello there");
    },
  );
});

test("throws SplitUnavailableError when both models fail", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  await withFetch(
    (async () => chatResponse(openRouterEnvelope("not json"))) as typeof fetch,
    async () => {
      const splitter = makeOpenRouterSplitter();
      await assert.rejects(
        splitter(SOURCE_TEXT),
        SplitUnavailableError,
      );
    },
  );
});

test("a network failure on the primary still allows the backup to succeed", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  await withFetch(
    (async (_input, init) => {
      const body = JSON.parse((init as RequestInit).body as string) as {
        model: string;
      };
      if (body.model === "google/gemini-2.5-flash-lite") {
        throw new Error("ECONNRESET");
      }
      return chatResponse(openRouterEnvelope(JSON.stringify(VALID_TURNS)));
    }) as typeof fetch,
    async () => {
      const splitter = makeOpenRouterSplitter();
      const turns = await splitter(SOURCE_TEXT);
      assert.equal(turns.length, 2);
    },
  );
});

test("respects INSTRUMENT_SPLIT_MODEL and INSTRUMENT_SPLIT_BACKUP_MODEL overrides", async () => {
  process.env.OPENROUTER_API_KEY = "test-key";
  const originalPrimary = process.env.INSTRUMENT_SPLIT_MODEL;
  const originalBackup = process.env.INSTRUMENT_SPLIT_BACKUP_MODEL;
  process.env.INSTRUMENT_SPLIT_MODEL = "custom/primary";
  process.env.INSTRUMENT_SPLIT_BACKUP_MODEL = "custom/backup";
  try {
    const modelsCalled: string[] = [];
    await withFetch(
      (async (_input, init) => {
        const body = JSON.parse((init as RequestInit).body as string) as {
          model: string;
        };
        modelsCalled.push(body.model);
        if (body.model === "custom/primary") {
          return chatResponse(openRouterEnvelope("not json"));
        }
        return chatResponse(openRouterEnvelope(JSON.stringify(VALID_TURNS)));
      }) as typeof fetch,
      async () => {
        const splitter = makeOpenRouterSplitter();
        const turns = await splitter(SOURCE_TEXT);
        assert.equal(turns.length, 2);
        assert.ok(modelsCalled.includes("custom/primary"));
        assert.ok(modelsCalled.includes("custom/backup"));
      },
    );
  } finally {
    if (originalPrimary === undefined) delete process.env.INSTRUMENT_SPLIT_MODEL;
    else process.env.INSTRUMENT_SPLIT_MODEL = originalPrimary;
    if (originalBackup === undefined) {
      delete process.env.INSTRUMENT_SPLIT_BACKUP_MODEL;
    } else {
      process.env.INSTRUMENT_SPLIT_BACKUP_MODEL = originalBackup;
    }
  }
});
