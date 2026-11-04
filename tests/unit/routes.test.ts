import { beforeEach, describe, expect, it, vi } from "vitest";

const runAgent = vi.fn();
const ingestSource = vi.fn();
vi.mock("../../src/lib/meta/agent", () => ({ runAgent }));
vi.mock("../../src/lib/meta/client", () => ({ chatRaw: vi.fn() }));
vi.mock("../../src/lib/meta/ingest", () => ({ ingestSource }));

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("http://x/api", { method: "POST", body, headers });
const json = (o: unknown) => JSON.stringify(o);

beforeEach(() => {
  vi.resetModules(); // le limiteur est un état de module : un par test
  runAgent.mockReset();
  ingestSource.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/agent", () => {
  const load = async () => (await import("../../src/app/api/agent/route")).POST;

  it.each([["not json"], ["null"], ["[]"], [json({})], [json({ question: 5 })], [json({ question: "   " })]])(
    "answers 400 on body %s",
    async (raw) => {
      const POST = await load();
      expect((await POST(post(raw))).status).toBe(400);
      expect(runAgent).not.toHaveBeenCalled();
    },
  );

  it("answers 413 above 2000 characters, 200 at exactly 2000", async () => {
    runAgent.mockResolvedValue({ answer: "ok", verified: true });
    const POST = await load();
    expect((await POST(post(json({ question: "a".repeat(2001) })))).status).toBe(413);
    expect((await POST(post(json({ question: "a".repeat(2000) })))).status).toBe(200);
  });

  it("answers 413 on an oversized body before parsing it", async () => {
    const POST = await load();
    expect((await POST(post("x".repeat(30_001)))).status).toBe(413);
  });

  it("answers 502 with a generic message when the model fails (no detail leak)", async () => {
    runAgent.mockRejectedValue(new Error("secret-api-key-abc"));
    const POST = await load();
    const res = await POST(post(json({ question: "riz ?" })));
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("secret");
  });

  it("trims the question and returns the agent result", async () => {
    runAgent.mockResolvedValue({ answer: "ok", verified: true });
    const POST = await load();
    const res = await POST(post(json({ question: "  riz ?  " })));
    expect(runAgent.mock.calls[0][0]).toBe("riz ?");
    expect(await res.json()).toEqual({ answer: "ok", verified: true });
  });

  it("rate-limits the 11th request in a minute with 429, even with forged x-forwarded-for", async () => {
    runAgent.mockResolvedValue({ answer: "ok", verified: true });
    const POST = await load();
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await POST(post(json({ question: "q" }), { "x-forwarded-for": `1.2.3.${i}` }))).status);
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

describe("POST /api/ingest", () => {
  const load = async () => (await import("../../src/app/api/ingest/route")).POST;

  it.each([["not json"], ["[]"], [json({ source: "" })], [json({ source: 3 })]])("answers 400 on %s", async (raw) => {
    const POST = await load();
    expect((await POST(post(raw))).status).toBe(400);
    expect(ingestSource).not.toHaveBeenCalled();
  });

  it("answers 413 above 20000 characters of source", async () => {
    const POST = await load();
    expect((await POST(post(json({ source: "a".repeat(20_001) })))).status).toBe(413);
  });

  it("answers 502 without leaking the upstream error", async () => {
    ingestSource.mockRejectedValue(new Error("https://internal/key=zzz"));
    const POST = await load();
    const res = await POST(post(json({ source: "Rice production 100 kt" })));
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("zzz");
  });

  it("returns the extraction on success", async () => {
    ingestSource.mockResolvedValue({ origin: "user_source" });
    const POST = await load();
    const res = await POST(post(json({ source: "Rice production 100 kt" })));
    expect(await res.json()).toEqual({ origin: "user_source" });
  });
});

describe("GET /api/forecast", () => {
  it("serves the deterministic forecast with a known state", async () => {
    const { GET } = await import("../../src/app/api/forecast/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(["forecast", "reference_band", "insufficient_data"]).toContain((await res.json()).result.state);
  });

  it("answers 500 without leaking the path when data are unreadable", async () => {
    vi.doMock("../../src/lib/forecast/load", () => ({
      loadForecast: () => {
        throw new Error("ENOENT /secret/path");
      },
    }));
    const { GET } = await import("../../src/app/api/forecast/route");
    const res = await GET();
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("secret");
    vi.doUnmock("../../src/lib/forecast/load");
  });
});
