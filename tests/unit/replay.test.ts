import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chatRaw } from "../../src/lib/meta/client";

const okResponse = (content: string) =>
  ({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  }) as unknown as Response;

const messages = [{ role: "user" as const, content: "bonjour" }];

describe("record and replay", () => {
  beforeEach(() => {
    process.env.META_REPLAY_DIR = mkdtempSync(join(tmpdir(), "kairos-replay-"));
    process.env.MODEL_API_KEY = "test-key-not-real";
  });

  afterEach(() => {
    delete process.env.META_RECORD;
    delete process.env.META_REPLAY;
    delete process.env.META_REPLAY_DIR;
    delete process.env.MODEL_API_KEY;
  });

  it("records a live reply, then replays it without any network call", async () => {
    process.env.META_RECORD = "1";
    const live = vi.fn(async () => okResponse("réponse enregistrée"));
    const recorded = await chatRaw(messages, undefined, live as unknown as typeof fetch);
    expect(recorded.content).toBe("réponse enregistrée");
    expect(live).toHaveBeenCalledTimes(1);

    delete process.env.META_RECORD;
    process.env.META_REPLAY = "1";
    const never = vi.fn();
    const replayed = await chatRaw(messages, undefined, never as unknown as typeof fetch);
    expect(replayed.content).toBe("réponse enregistrée");
    expect(never).not.toHaveBeenCalled();
  });

  it("fails loudly when a request was never recorded", async () => {
    process.env.META_REPLAY = "1";
    await expect(chatRaw(messages)).rejects.toThrow(/Rejeu/);
  });

  it("does not store the API key in the recording", async () => {
    process.env.META_RECORD = "1";
    await chatRaw(messages, undefined, (async () => okResponse("ok")) as unknown as typeof fetch);
    const { readdirSync, readFileSync } = await import("node:fs");
    const dir = process.env.META_REPLAY_DIR as string;
    const text = readdirSync(dir)
      .map((f) => readFileSync(join(dir, f), "utf8"))
      .join("");
    expect(text).not.toContain("test-key-not-real");
  });
});

describe("replay robustness", () => {
  beforeEach(() => {
    process.env.META_REPLAY_DIR = mkdtempSync(join(tmpdir(), "kairos-replay-"));
  });
  afterEach(() => {
    delete process.env.META_REPLAY;
    delete process.env.META_RECORD;
    delete process.env.META_REPLAY_DIR;
  });

  it("treats a corrupted recording as not recorded, with a clean error", async () => {
    process.env.META_RECORD = "1";
    process.env.MODEL_API_KEY = "x";
    await chatRaw(messages, undefined, (async () => okResponse("ok")) as unknown as typeof fetch);
    const { readdirSync, writeFileSync } = await import("node:fs");
    const dir = process.env.META_REPLAY_DIR as string;
    for (const f of readdirSync(dir)) writeFileSync(join(dir, f), "{tronqué");
    delete process.env.META_RECORD;
    process.env.META_REPLAY = "1";
    await expect(chatRaw(messages)).rejects.toThrow(/Rejeu : aucune réponse enregistrée/);
    delete process.env.MODEL_API_KEY;
  });

  it("drops tool calls that have no function name", async () => {
    process.env.MODEL_API_KEY = "x";
    const live = async () =>
      ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: null, tool_calls: [{ id: "1" }, { id: "2", function: { name: "list_products", arguments: "{}" } }] } }],
        }),
      }) as unknown as Response;
    const reply = await chatRaw(messages, undefined, live as unknown as typeof fetch);
    expect(reply.tool_calls).toHaveLength(1);
    delete process.env.MODEL_API_KEY;
  });
});
