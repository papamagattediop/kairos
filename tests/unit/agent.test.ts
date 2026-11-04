import { describe, expect, it } from "vitest";
import {
  collectNumbers,
  executeTool,
  runAgent,
  unverifiedNumbers,
} from "../../src/lib/meta/agent";
import type { AssistantReply } from "../../src/lib/meta/client";

const call = (name: string, args: unknown, id: string | undefined = "c1") => ({
  id: id as string,
  type: "function" as const,
  function: { name, arguments: typeof args === "string" ? args : JSON.stringify(args) },
});

const scripted = (replies: AssistantReply[]) => {
  let i = 0;
  return async () => replies[Math.min(i++, replies.length - 1)];
};

const deps = {
  extract: async () => ({ inputs: {}, rejected: [] }),
  forecast: async () => ({ noModelClaimed: true, persistenceKt: 2218, referenceLowerKt: 1596, referenceUpperKt: 3083 }),
  isTrusted: () => true,
};
const BALANCE = { demandKt: 2000, productionKt: 1250, importsKt: 600, stockReleaseKt: 0 };

describe("executeTool", () => {
  it("computes a balance through the engine", async () => {
    const result = await executeTool("compute_balance", JSON.stringify(BALANCE), deps);
    expect(result).toMatchObject({ state: "scenario", gapKt: 150 });
  });

  it("refuses when a term is null instead of inventing it", async () => {
    const result = await executeTool(
      "compute_balance",
      JSON.stringify({ ...BALANCE, stockReleaseKt: null }),
      deps,
    );
    expect(result).toMatchObject({ state: "insufficient_data" });
  });

  it("treats a non-numeric term as missing", async () => {
    const result = await executeTool("compute_balance", JSON.stringify({ ...BALANCE, demandKt: "2000" }), deps);
    expect(result).toMatchObject({ state: "insufficient_data" });
  });

  it("rejects a value that is not trusted (model-invented argument)", async () => {
    const strict = { ...deps, isTrusted: (n: number) => n === 2000 };
    const result = await executeTool(
      "compute_balance",
      JSON.stringify({ demandKt: 612, productionKt: null, importsKt: null, stockReleaseKt: null }),
      strict,
    );
    expect(result).toMatchObject({ error: expect.stringContaining("absente") });
    expect(JSON.stringify(result)).not.toContain("612");
  });

  it("returns an error for unknown tools and unreadable arguments", async () => {
    expect(await executeTool("nope", "{}", deps)).toMatchObject({ error: expect.any(String) });
    for (const bad of ["{pas du json", "null", "5", "[]"]) {
      expect(await executeTool("compute_balance", bad, deps)).toMatchObject({ error: "arguments illisibles" });
    }
  });

  it("does not crash when a tool dependency rejects", async () => {
    const failing = { ...deps, extract: async () => Promise.reject(new Error("boom")) };
    expect(await executeTool("extract_terms", '{"source":"x"}', failing)).toMatchObject({
      error: "outil indisponible",
    });
  });

  it("lists products with their display policy", async () => {
    const result = (await executeTool("list_products", "{}", deps)) as Array<{ id: string; display: string }>;
    expect(result.find((p) => p.id === "rice")?.display).toBe("observed_balance");
    expect(result.find((p) => p.id === "millet")?.display).toBe("refusal");
  });
});

describe("get_forecast tool", () => {
  it("returns what the code computed, and its numbers count as known for the answer", async () => {
    const chat = scripted([
      { content: null, tool_calls: [call("get_forecast", {})] },
      { content: "La fourchette de référence va de 1596 à 3083 kt, autour de 2218.", tool_calls: [] },
    ]);
    const result = await runAgent("Quelles importations prévoir ?", chat, deps);
    expect(result.trace[0]).toMatchObject({ tool: "get_forecast", result: { persistenceKt: 2218 } });
    expect(result.verified).toBe(true);
  });

  it("flags a forecast figure the tool never produced", async () => {
    const chat = scripted([
      { content: null, tool_calls: [call("get_forecast", {})] },
      { content: "La fourchette va jusqu à 4000 kt.", tool_calls: [] },
    ]);
    const result = await runAgent("Quelles importations prévoir ?", chat, deps);
    expect(result.verified).toBe(false);
    expect(result.unverifiedNumbers).toContain("4000");
  });

  it("does not crash when the data cannot be read", async () => {
    const broken = { ...deps, forecast: async () => Promise.reject(new Error("fichier absent")) };
    expect(await executeTool("get_forecast", "{}", broken)).toMatchObject({ error: "outil indisponible" });
  });
});

describe("collectNumbers", () => {
  it("reads numeric leaves, numbers in strings, and arrays without merging them", () => {
    const found = collectNumbers({ gapKt: 150, box: [12, 34], campaign: "MY2025/26" });
    expect(found).toEqual(expect.arrayContaining([150, 12, 34, 2025, 26]));
    expect(found).not.toContain(1234);
  });
});

describe("unverifiedNumbers", () => {
  it("accepts formatted numbers present in tool results", () => {
    const results = [{ gapKt: 1250.5 }];
    expect(unverifiedNumbers("L'écart est de 1 250,5 kt.", results)).toEqual([]);
    expect(unverifiedNumbers("L'écart est de 1250.5 kt.", results)).toEqual([]);
  });

  it("flags a number no tool produced", () => {
    expect(unverifiedNumbers("Environ 612 kt.", [{ gapKt: 150 }])).toEqual(["612"]);
  });

  it("does not read 1,50 as 150 or 15,0 as 150", () => {
    expect(unverifiedNumbers("Valeur 1,50 kt.", [{ gapKt: 150 }])).toEqual(["1,50"]);
    expect(unverifiedNumbers("Valeur 15,0 kt.", [{ gapKt: 150 }])).toEqual(["15,0"]);
  });

  it("does not merge an enumeration into one number", () => {
    expect(unverifiedNumbers("Les termes 1, 2 et 3 sont connus.", [{ a: 1, b: 2, c: 3 }])).toEqual([]);
  });

  it("tolerates floating point noise in tool values", () => {
    expect(unverifiedNumbers("Soit 0,3 kt.", [{ gapKt: 0.30000000000000004 }])).toEqual([]);
  });

  it("accepts numbers repeated from the user's question", () => {
    expect(unverifiedNumbers("Vous indiquez 2000 kt.", [], [2000])).toEqual([]);
  });

  it("flags numbers written out in words and non-ASCII digits", () => {
    expect(unverifiedNumbers("Environ cent cinquante mille tonnes.", [])).toEqual(
      expect.arrayContaining(["cent", "mille"]),
    );
    expect(unverifiedNumbers("Valeur ١٢٣ kt.", []).length).toBeGreaterThan(0);
  });

  it("flags a year the tools never produced", () => {
    expect(unverifiedNumbers("En 2030, l'écart serait nul.", [{ campaign: "MY2025/26" }])).toEqual(["2030"]);
  });
});

describe("runAgent", () => {
  it("runs a tool then answers with verified numbers", async () => {
    const chat = scripted([
      { content: null, tool_calls: [call("compute_balance", BALANCE)] },
      { content: "L'écart calculé est de 150 kt.", tool_calls: [] },
    ]);

    const result = await runAgent(
      "Calcule avec utilisation 2000, production 1250, importations 600, stocks 0.",
      chat,
      deps,
    );

    expect(result.verified).toBe(true);
    expect(result.trace[0]).toMatchObject({ tool: "compute_balance" });
  });

  it("refuses a model-invented argument and never reports it as verified", async () => {
    const chat = scripted([
      {
        content: null,
        tool_calls: [call("compute_balance", { demandKt: 612, productionKt: 0, importsKt: 0, stockReleaseKt: 0 })],
      },
      { content: "Il manque 612 kt.", tool_calls: [] },
    ]);

    const result = await runAgent("Quel est l'écart du riz ?", chat, deps);

    expect(result.trace[0].result).toMatchObject({ error: expect.stringContaining("absente") });
    expect(result.unverifiedNumbers).toContain("612");
    expect(result.verified).toBe(false);
  });

  it("trusts values that came out of a verified extraction", async () => {
    const extract = async () => ({ inputs: BALANCE, rejected: [] });
    const chat = scripted([
      { content: null, tool_calls: [call("extract_terms", { source: "texte" }, "a")] },
      { content: null, tool_calls: [call("compute_balance", BALANCE, "b")] },
      { content: "L'écart est de 150 kt.", tool_calls: [] },
    ]);

    const result = await runAgent("Extrais et calcule.", chat, { extract, forecast: deps.forecast });

    expect(result.trace[1].result).toMatchObject({ state: "scenario", gapKt: 150 });
    expect(result.verified).toBe(true);
  });

  it("marks the answer unverified when the model invents a number", async () => {
    const chat = scripted([
      { content: null, tool_calls: [call("list_products", {})] },
      { content: "Il manquerait environ 612 kt.", tool_calls: [] },
    ]);

    const result = await runAgent("Combien manque-t-il ?", chat, deps);

    expect(result.verified).toBe(false);
    expect(result.unverifiedNumbers).toContain("612");
  });

  it("never reports an empty answer as verified", async () => {
    const result = await runAgent("Question ?", scripted([{ content: "", tool_calls: [] }]), deps);
    expect(result.verified).toBe(false);
    const result2 = await runAgent("Question ?", scripted([{ content: null, tool_calls: [] }]), deps);
    expect(result2.verified).toBe(false);
  });

  it("survives tool calls with a missing or duplicated id", async () => {
    const chat = scripted([
      {
        content: null,
        tool_calls: [call("list_products", {}, undefined), call("list_products", {}, "dup"), call("list_products", {}, "dup")],
      },
      { content: "Produits listés.", tool_calls: [] },
    ]);

    const result = await runAgent("Liste ?", chat, deps);

    expect(result.answer).toBe("Produits listés.");
    expect(result.trace).toHaveLength(3);
  });

  it("caps tool calls per round and in total", async () => {
    const many = Array.from({ length: 10 }, (_, i) => call("list_products", {}, `c${i}`));
    const result = await runAgent("boucle", async () => ({ content: null, tool_calls: many }), deps);

    expect(result.trace.length).toBeLessThanOrEqual(6);
    expect(result.verified).toBe(false);
  });

  it("stops after the maximum number of rounds", async () => {
    const result = await runAgent("boucle", async () => ({ content: null, tool_calls: [call("list_products", {})] }), deps);
    expect(result.verified).toBe(false);
  });
});

describe("department rice tools", () => {
  it("returns the valid history and an estimate with a band for a known department", async () => {
    const r = (await executeTool("get_department_rice", JSON.stringify({ department: "kolda" }), deps)) as {
      department: string;
      estimate: { meanYieldKgHa: number; bandLowKgHa: number; bandHighKgHa: number };
      history: Array<{ year: number }>;
    };
    expect(r.department).toBe("Kolda");
    expect(r.history.some((h) => h.year === 2021)).toBe(false);
    expect(r.estimate.bandLowKgHa).toBeLessThan(r.estimate.meanYieldKgHa);
  });

  it("refuses with a reason (no estimate) when data are insufficient", async () => {
    const r = (await executeTool("get_department_rice", JSON.stringify({ department: "Dakar" }), deps)) as {
      status: { state: string; reason: string };
      estimate: unknown;
    };
    expect(r.status.state).toBe("insufficient_data");
    expect(r.estimate).toBeNull();
  });

  it("reports an unknown department without inventing one", async () => {
    expect(await executeTool("get_department_rice", JSON.stringify({ department: "Atlantide" }), deps)).toEqual({ error: "département inconnu" });
    expect(await executeTool("get_department_rice", "{}", deps)).toEqual({ error: "département inconnu" });
  });

  it("lists a ranking whose numbers all count as tool-sourced for answer verification", async () => {
    const r = (await executeTool("list_department_rice", "{}", deps)) as { ranking: Array<{ department: string; meanYieldKgHa: number }> };
    expect(r.ranking.length).toBe(21);
    const answer = `${r.ranking[0].department} a le rendement moyen le plus élevé : ${r.ranking[0].meanYieldKgHa} kg/ha.`;
    expect(unverifiedNumbers(answer, [r])).toEqual([]);
    expect(unverifiedNumbers(`${r.ranking[0].department} : 9999 kg/ha.`, [r])).toEqual(["9999"]);
  });
});
