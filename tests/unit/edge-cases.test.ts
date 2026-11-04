import { describe, expect, it } from "vitest";
import { collectNumbers, executeTool, runAgent, unverifiedNumbers } from "../../src/lib/meta/agent";
import { forecastNext, type Point } from "../../src/lib/forecast";
import { validateExtraction } from "../../src/lib/meta/extract-terms";
import {
  RICE,
  departmentStatus,
  estimateYield,
  findDepartment,
  rankDepartments,
  riceSummary,
  validRecords,
  type Department,
} from "../../src/lib/rice-yield";

const noDeps = { extract: async () => ({}), forecast: async () => ({}), isTrusted: () => true };
describe("unverifiedNumbers: edge cases", () => {
  // BUG connu (src/lib/meta/agent.ts:77 NUMBER_TOKEN / :143-147) : le signe est ignoré. it.fails documente le défaut ; retirer ".fails" après correction.
  it("flags a sign flip: a tool value of 50 must not verify an answer saying -50", () => {
    expect(unverifiedNumbers("L'écart est de -50 kt.", [{ gapKt: 50 }])).not.toEqual([]);
  });
  it("accepts text with no numbers at all", () => {
    expect(unverifiedNumbers("Aucune donnée.", [])).toEqual([]);
  });
  it("flags spelled numbers case-insensitively", () => {
    expect(unverifiedNumbers("Environ MILLE tonnes", [])).toContain("MILLE");
  });
  it("flags 18 when tools only have 17.4", () => {
    expect(unverifiedNumbers("erreur de 18 %", [{ e: 17.4 }])).toEqual(["18"]);
  });
  it("accepts a narrow no-break space as thousands separator", () => {
    expect(unverifiedNumbers("2 218 kt", [{ v: 2218 }])).toEqual([]);
  });
  it("collectNumbers ignores NaN, Infinity, null and undefined", () => {
    expect(collectNumbers({ a: NaN, b: Infinity, c: null, d: undefined, e: [1] })).toEqual([1]);
  });
});

describe("executeTool: edge cases", () => {
  it("rejects a JSON array or primitive as arguments", async () => {
    expect(await executeTool("list_products", "[]", noDeps)).toEqual({ error: "arguments illisibles" });
    expect(await executeTool("list_products", "5", noDeps)).toEqual({ error: "arguments illisibles" });
  });
  it("refuses an empty or non-string extract source", async () => {
    expect(await executeTool("extract_terms", JSON.stringify({ source: "  " }), noDeps)).toEqual({ error: "source manquante" });
    expect(await executeTool("extract_terms", JSON.stringify({ source: 4 }), noDeps)).toEqual({ error: "source manquante" });
  });
  it("answers 'département inconnu' for a non-string or empty department", async () => {
    expect(await executeTool("get_department_rice", JSON.stringify({ department: 3 }), noDeps)).toEqual({ error: "département inconnu" });
    expect(await executeTool("get_department_rice", JSON.stringify({ department: "" }), noDeps)).toEqual({ error: "département inconnu" });
  });
  it("treats zero as a legitimate value, not as missing", async () => {
    const r = (await executeTool("compute_balance", JSON.stringify({ demandKt: 0, productionKt: 0, importsKt: 0, stockReleaseKt: 0 }), noDeps)) as { state: string };
    expect(r.state).toBe("scenario");
  });
});

describe("runAgent: edge cases", () => {
  const chat = (replies: Array<{ content: string | null; tool_calls: unknown[] }>) => {
    let i = 0;
    return (async () => replies[Math.min(i++, replies.length - 1)]) as never;
  };
  const balanceCall = (demandKt: number) => [
    { id: "1", type: "function", function: { name: "compute_balance", arguments: JSON.stringify({ demandKt, productionKt: 1, importsKt: 1, stockReleaseKt: 1 }) } },
  ];

  it("a null content with no tool call is unverified and empty", async () => {
    const r = await runAgent("q", chat([{ content: null, tool_calls: [] }]), noDeps);
    expect(r.verified).toBe(false);
    expect(r.answer).toBe("");
  });
  it("ignores tool calls without a function name", async () => {
    const r = await runAgent("q", chat([{ content: "fin", tool_calls: [{ id: "a", type: "function", function: {} }] }]), noDeps);
    expect(r.trace).toEqual([]);
    expect(r.answer).toBe("fin");
  });
  it("refuses a balance value the user never wrote", async () => {
    const r = await runAgent("calcule avec 1", chat([{ content: null, tool_calls: balanceCall(999) }, { content: "ok", tool_calls: [] }]), noDeps);
    expect(r.trace[0].result).toMatchObject({ error: expect.any(String) });
  });
  it("a refused value does not become 'known' for the answer check", async () => {
    const r = await runAgent("avec 1", chat([{ content: null, tool_calls: balanceCall(777) }, { content: "La demande est 777 kt", tool_calls: [] }]), noDeps);
    expect(r.verified).toBe(false);
    expect(r.unverifiedNumbers).toContain("777");
  });
});

describe("forecast publish-or-refuse guard: edge cases", () => {
  const mk = (f: (i: number) => number, n: number): Point[] => Array.from({ length: n }, (_, i) => ({ year: 1960 + i, value: f(i) }));

  it("refuses an empty series and a single point without throwing", () => {
    expect(forecastNext([]).state).toBe("insufficient_data");
    expect(forecastNext(mk(() => 5, 1)).state).toBe("insufficient_data");
  });
  it("refuses NaN and Infinity values", () => {
    const s = mk((i) => 100 + i, 60);
    s[30].value = NaN;
    expect(forecastNext(s).state).toBe("insufficient_data");
    s[30].value = Infinity;
    expect(forecastNext(s).state).toBe("insufficient_data");
  });
  it("refuses duplicate years", () => {
    const s = mk((i) => 100 + i, 60);
    s[10].year = s[11].year;
    expect(forecastNext(s).state).toBe("insufficient_data");
  });
  it("sorts an unordered series instead of mixing years", () => {
    expect(forecastNext(mk((i) => 100 + i * 2, 60).reverse()).state).not.toBe("insufficient_data");
  });
  it("a constant series never yields a non-finite published number", () => {
    const r = forecastNext(mk(() => 100, 60));
    if (r.state === "forecast") expect(Number.isFinite(r.pointKt) && Number.isFinite(r.lowerKt)).toBe(true);
    if (r.state === "reference_band") expect(Number.isFinite(r.band.lowerKt) && Number.isFinite(r.band.upperKt)).toBe(true);
  });
  it("refuses just below the minimum number of tested forecasts", () => {
    expect(forecastNext(mk((i) => 100 + i, 39)).state).toBe("insufficient_data");
  });
});

describe("validateExtraction: edge cases", () => {
  const quote = "Rice production in 2024 was 1,250 thousand tonnes";
  const src = `${quote} in Senegal.`;
  const q = (value: unknown, text = quote) => validateExtraction({ productionKt: { value, quote: text } }, src);

  it("matches a quote across newlines and extra whitespace in the source", () => {
    const r = validateExtraction({ productionKt: { value: 1250, quote } }, "Rice production in 2024\n   was 1,250 thousand tonnes in Senegal.");
    expect(r.inputs.productionKt).toBe(1250);
  });
  it("rejects a string or NaN value", () => {
    expect(q("1250").rejected[0].reason).toBe("valeur non numérique");
    expect(q(NaN).rejected[0].reason).toBe("valeur non numérique");
  });
  it("rejects when the model value differs from the code reading", () => {
    const r = q(125);
    expect(r.inputs.productionKt).toBeNull();
    expect(r.rejected[0].reason).toBe("valeur annoncée différente de l'extrait");
  });
  it("tolerates null, array, string and number as raw input", () => {
    for (const raw of [null, undefined, [], "x", 3]) expect(validateExtraction(raw, src).inputs.productionKt).toBeNull();
  });
  it("lists each campaign once", () => {
    expect(validateExtraction({}, "2023/24 puis 2023/24 et 2024/25").campaigns).toEqual(["2023/24", "2024/25"]);
  });
});

describe("rice-yield: edge cases", () => {
  const rec = (year: number, y: number, area = 5000) => ({ year, areaHa: area, productionT: (y * area) / 1000, yieldKgHa: y, rainMm: null });
  const dep = (records: ReturnType<typeof rec>[]): Department => ({ id: "x", key: "X", name: "X", d: "", records });
  const years = [2017, 2018, 2019, 2020, 2022, 2023, 2024];

  it("a zero-yield year never produces a NaN estimate", () => {
    const d = dep(years.map((y, i) => rec(y, i === 0 ? 0 : 3000)));
    if (departmentStatus(d).state === "available") expect(Number.isFinite(estimateYield(d)!.meanYieldKgHa)).toBe(true);
  });
  it("refuses 6 valid years and 999 ha, accepts 7 years and 1000 ha", () => {
    expect(departmentStatus(dep(years.slice(0, 6).map((y) => rec(y, 3000)))).state).toBe("insufficient_data");
    expect(departmentStatus(dep(years.map((y) => rec(y, 3000, 999)))).state).toBe("insufficient_data");
    expect(departmentStatus(dep(years.map((y) => rec(y, 3000, 1000)))).state).toBe("available");
  });
  it("does not count 2021 toward the minimum of valid years", () => {
    const d = dep([2017, 2018, 2019, 2020, 2021, 2022, 2023].map((y) => rec(y, 3000)));
    expect(validRecords(d)).toHaveLength(6);
    expect(departmentStatus(d).state).toBe("insufficient_data");
  });
  it("finds departments despite odd spacing and hyphens, null for blanks", () => {
    expect(findDepartment("  saint-louis ")?.key).toBe("Saint Louis");
    expect(findDepartment("")).toBeNull();
    expect(findDepartment("   ")).toBeNull();
  });
  it("every estimate is finite with low <= mean <= high", () => {
    for (const d of RICE.departments) {
      const e = estimateYield(d);
      if (!e) continue;
      expect(Number.isFinite(e.meanYieldKgHa)).toBe(true);
      expect(e.bandLowKgHa).toBeLessThanOrEqual(e.meanYieldKgHa);
      expect(e.meanYieldKgHa).toBeLessThanOrEqual(e.bandHighKgHa);
    }
  });
  it("ranking is sorted and a refused department carries no estimate", () => {
    const r = rankDepartments();
    for (let i = 1; i < r.length; i++) expect(r[i - 1].meanYieldKgHa).toBeGreaterThanOrEqual(r[i].meanYieldKgHa);
    const refused = RICE.departments.find((d) => departmentStatus(d).state !== "available")!;
    expect(riceSummary(refused).estimate).toBeNull();
  });
});
