import { describe, expect, it } from "vitest";
import { calculateBalance } from "../../src/lib/decision-engine";
import {
  parseJsonObject,
  validateExtraction,
} from "../../src/lib/meta/extract-terms";

const SOURCE =
  "Rice, Senegal MY2025/26: domestic consumption 2,000 (1000 MT); " +
  "production 1,250 (1000 MT); imports 600 (1000 MT); stock change -25 (1000 MT).";

const term = (value: number, quote: string) => ({ value, quote });
const DEMAND = "domestic consumption 2,000 (1000 MT)";
const PROD = "production 1,250 (1000 MT)";
const IMPORTS = "imports 600 (1000 MT)";

const only = (field: string, t: unknown, source = SOURCE) =>
  validateExtraction({ [field]: t }, source);

describe("validateExtraction: happy path", () => {
  it("reads number and unit from the quote and keeps missing terms null", () => {
    const { inputs, rejected, campaigns } = validateExtraction(
      {
        demandKt: term(2000, DEMAND),
        productionKt: term(1250, PROD),
        importsKt: term(600, IMPORTS),
        stockReleaseKt: { value: null, quote: null },
      },
      SOURCE,
    );

    expect(inputs).toEqual({
      demandKt: 2000,
      productionKt: 1250,
      importsKt: 600,
      stockReleaseKt: null,
    });
    expect(rejected).toEqual([]);
    expect(campaigns).toEqual(["MY2025/26"]);
  });

  it("accepts a negative stock change", () => {
    const { inputs } = only("stockReleaseKt", term(-25, "stock change -25 (1000 MT)"));
    expect(inputs.stockReleaseKt).toBe(-25);
  });

  it("converts tonnes to kt", () => {
    const src = "Imports of rice reached 600000 tonnes in the period";
    const { inputs } = only("importsKt", term(600000, "Imports of rice reached 600000 tonnes"), src);
    expect(inputs.importsKt).toBe(600);
  });

  it("accepts KT in capitals", () => {
    const src = "Total rice imports: 600 KT for the campaign";
    expect(only("importsKt", term(600, "Total rice imports: 600 KT"), src).inputs.importsKt).toBe(600);
  });
});

describe("validateExtraction: model cannot bypass the checks", () => {
  it("rejects a quote that is not in the source", () => {
    const { inputs, rejected } = only("importsKt", term(612, "total imports 612 (1000 MT)"));
    expect(inputs.importsKt).toBeNull();
    expect(rejected[0]).toMatchObject({ field: "importsKt", reason: "extrait absent de la source" });
  });

  it("rejects a value taken from the unit (1000) or the year (2025)", () => {
    expect(only("importsKt", term(1000, IMPORTS)).inputs.importsKt).toBeNull();
    const src = "Imports 600000 tonnes en 2025 pour le pays";
    expect(only("importsKt", term(2025, "Imports 600000 tonnes en 2025"), src).inputs.importsKt).toBeNull();
  });

  it("rejects a quote reduced to a number fragment", () => {
    expect(only("productionKt", term(250, "250")).inputs.productionKt).toBeNull();
    expect(only("demandKt", term(0, "0")).inputs.demandKt).toBeNull();
  });

  it("rejects a quote that cuts a number of the source", () => {
    const { inputs, rejected } = only("productionKt", term(1.25, "production 1,25"));
    expect(inputs.productionKt).toBeNull();
    expect(rejected[0].reason).toMatch(/absent de la source/);
  });

  it("derives the unit from the quote, not from the model", () => {
    // L'extrait est en tonnes : 1250 tonnes = 1,25 kt, quoi que le modèle pense de l'unité.
    const src = "production 1250 tonnes selon le rapport";
    expect(only("productionKt", term(1250, "production 1250 tonnes"), src).inputs.productionKt).toBe(1.25);
    // Le modèle ne peut pas imposer 1,25 kt quand l'extrait dit 1250 (1000 MT).
    expect(only("productionKt", term(1.25, PROD)).inputs.productionKt).toBeNull();
  });

  it("rejects a bare MT instead of guessing", () => {
    const src = "Rice imports 600 MT in the campaign";
    const { rejected } = only("importsKt", term(600, "Rice imports 600 MT"), src);
    expect(rejected[0].reason).toMatch(/ambiguë/);
  });

  it("rejects a quote with no unit", () => {
    const src = "Rice imports 600 in the campaign";
    expect(only("importsKt", term(600, "Rice imports 600"), src).inputs.importsKt).toBeNull();
  });

  it("rejects the same quote reused for another term", () => {
    const { inputs, rejected } = validateExtraction(
      { importsKt: term(600, IMPORTS), productionKt: term(600, IMPORTS) },
      SOURCE,
    );
    expect(inputs.importsKt).toBe(600);
    expect(inputs.productionKt).toBeNull();
    expect(rejected.some((r) => r.field === "productionKt")).toBe(true);
  });

  it("rejects a quote with no label of the term", () => {
    const { inputs } = only("productionKt", term(600, IMPORTS));
    expect(inputs.productionKt).toBeNull();
  });

  it("rejects a quote holding several numbers", () => {
    const src = "production 1250 and 600 (1000 MT) respectively";
    expect(only("productionKt", term(1250, "production 1250 and 600 (1000 MT)"), src).inputs.productionKt).toBeNull();
  });

  it("does not merge neighbouring numbers", () => {
    const src = "imports 1250 600 (1000 MT) in two lines";
    expect(only("importsKt", term(1250600, "imports 1250 600 (1000 MT)"), src).inputs.importsKt).toBeNull();
  });

  it("reads 1,660 and 1.660 as 1660, and 1.66 as 1.66", () => {
    const a = "imports 1,660 (1000 MT) were recorded";
    const b = "imports 1.660 (1000 MT) were recorded";
    const c = "imports 1.66 (1000 MT) were recorded";
    expect(only("importsKt", term(1660, "imports 1,660 (1000 MT)"), a).inputs.importsKt).toBe(1660);
    expect(only("importsKt", term(1660, "imports 1.660 (1000 MT)"), b).inputs.importsKt).toBe(1660);
    expect(only("importsKt", term(1.66, "imports 1.66 (1000 MT)"), c).inputs.importsKt).toBe(1.66);
    // le modèle ne peut pas valider 1.66 pour "1,660"
    expect(only("importsKt", term(1.66, "imports 1,660 (1000 MT)"), a).inputs.importsKt).toBeNull();
  });

  it("does not read a campaign range as a negative number", () => {
    const src = "production 2025-26 estimate: 1,250 (1000 MT)";
    const { inputs } = only("productionKt", term(1250, "production 2025-26 estimate: 1,250 (1000 MT)"), src);
    expect(inputs.productionKt).toBe(1250);
  });

  it("keeps the sign of a Unicode minus and of accounting parentheses", () => {
    const a = "stock change −150 (1000 MT) over the year";
    const b = "stock change (150) (1000 MT) over the year";
    expect(only("stockReleaseKt", term(-150, "stock change −150 (1000 MT)"), a).inputs.stockReleaseKt).toBe(-150);
    expect(only("stockReleaseKt", term(-150, "stock change (150) (1000 MT)"), b).inputs.stockReleaseKt).toBe(-150);
    expect(only("stockReleaseKt", term(150, "stock change −150 (1000 MT)"), a).inputs.stockReleaseKt).toBeNull();
  });

  it("rejects negative demand, production and imports", () => {
    const src = "production -50 (1000 MT) reported";
    expect(only("productionKt", term(-50, "production -50 (1000 MT)"), src).inputs.productionKt).toBeNull();
  });

  it("reports malformed terms instead of ignoring them", () => {
    const { rejected } = validateExtraction({ importsKt: "600", productionKt: { value: "x", quote: "y" } }, SOURCE);
    expect(rejected.map((r) => r.field).sort()).toEqual(["importsKt", "productionKt"]);
  });

  it("ignores non-object input", () => {
    expect(validateExtraction(null, SOURCE).inputs.demandKt).toBeNull();
  });
});

describe("integration with the balance engine", () => {
  it("lets the engine refuse when a term is missing", () => {
    const { inputs } = only("demandKt", term(2000, DEMAND));
    expect(calculateBalance(inputs).state).toBe("insufficient_data");
  });

  it("computes the gap when all four terms are validated", () => {
    const { inputs } = validateExtraction(
      {
        demandKt: term(2000, DEMAND),
        productionKt: term(1250, PROD),
        importsKt: term(600, IMPORTS),
        stockReleaseKt: term(-25, "stock change -25 (1000 MT)"),
      },
      SOURCE,
    );
    expect(calculateBalance(inputs)).toMatchObject({ state: "scenario", gapKt: 175 });
  });
});

describe("parseJsonObject", () => {
  it("extracts the JSON object from surrounding text", () => {
    expect(parseJsonObject('voici: {"a":1} fin')).toEqual({ a: 1 });
  });

  it("returns null on invalid JSON", () => {
    expect(parseJsonObject("pas de json")).toBeNull();
    expect(parseJsonObject("{oups}")).toBeNull();
  });
});
