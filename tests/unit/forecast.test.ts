import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  GATE,
  MODELS,
  backtest,
  coverageOf,
  forecastNext,
  logError,
  meanAbs,
  predict,
  quantileHalfWidth,
  type Point,
} from "../../src/lib/forecast";
import { parseFaostatCsv, parseHistoricCsv, spliceNetImports } from "../../src/lib/forecast/faostat";
import { forecastSummary, loadForecast } from "../../src/lib/forecast/load";

const NEW_CSV = "data/sources/faostat-fbs-senegal-rice.csv";
const OLD_CSV = "data/sources/faostat-fbs-senegal-rice-historic.csv";
const series = (values: number[], start = 1950): Point[] => values.map((value, i) => ({ year: start + i, value }));
const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

describe("predict", () => {
  const train = series([10, 20, 30, 40]);
  it("naive repeats the last value", () => expect(predict("naive", train, 1954)).toBe(40));
  it("drift extends the average slope", () => expect(predict("drift", train, 1954)).toBe(50));
  it("linear fits the trend by least squares", () => expect(predict("linear", train, 1954)).toBeCloseTo(50, 9));
  it("win10 only looks at the last 10 years", () => {
    const flatThenRising = series([...Array(15).fill(100), 110, 120, 130, 140, 150, 160, 170, 180, 190, 200]);
    // les 10 derniers points forment une droite parfaite de pente 10 : la prévision suit cette droite
    expect(predict("win10", flatThenRising, 1950 + 25)).toBeCloseTo(210, 6);
    // alors que la droite sur tout l'historique est tirée vers le bas par la partie plate
    expect(predict("linear", flatThenRising, 1950 + 25)).toBeLessThan(210);
  });
  it("loglinear is exact on an exponential series", () => {
    const expo = series(Array.from({ length: 12 }, (_, i) => 100 * 1.1 ** i));
    expect(predict("loglinear", expo, 1950 + 12)).toBeCloseTo(100 * 1.1 ** 12, 6);
  });
});

describe("quantileHalfWidth", () => {
  it("takes the rank ceil((m+1) x level), capped at the maximum", () => {
    expect(quantileHalfWidth([1, 2, 3, 4, 5, 6, 7, 8, 9], 0.8)).toBe(8); // rang ceil(10 x 0.8) = 8
    expect(quantileHalfWidth([1, 2, 3], 0.8)).toBe(3); // rang 4 plafonné à 3
  });
});

describe("backtest", () => {
  it("measures the error in relative (log) terms", () => {
    expect(logError(200, 100)).toBeCloseTo(Math.log(2), 12);
    expect(logError(100, 200)).toBeCloseTo(-Math.log(2), 12);
    expect(logError(150, 150)).toBe(0);
  });

  it("never uses the tested year to predict it", () => {
    const s = series([...Array(10).fill(5), 1000, 5, 5]);
    const report = backtest(s, "naive", 10);
    expect(report.steps[0]).toMatchObject({ year: 1960, predicted: 5, actual: 1000 });
  });

  it("builds each range only from earlier errors, and only once enough exist", () => {
    const report = backtest(series(Array.from({ length: 40 }, (_, i) => 100 + i * 3 + (i % 3) * 5)), "naive", 10);
    expect(report.steps.slice(0, GATE.minIntervalErrors).every((s) => s.halfWidthLog === null)).toBe(true);
    report.steps.slice(GATE.minIntervalErrors).forEach((step, k) => {
      const past = report.steps.slice(0, GATE.minIntervalErrors + k).map((s) => Math.abs(s.logError));
      expect(step.halfWidthLog).toBe(quantileHalfWidth(past, GATE.intervalLevel));
      expect(step.covered).toBe(Math.abs(step.logError) <= (step.halfWidthLog as number));
    });
  });

  it("computes the mean relative error and coverage by hand on a tiny case", () => {
    // persistance, minTrain 3 : prévisions 3, 4, 6 pour des réels 4, 6, 5
    const report = backtest(series([1, 2, 3, 4, 6, 5]), "naive", 3);
    const expected = (Math.log(4 / 3) + Math.log(6 / 4) + Math.abs(Math.log(5 / 6))) / 3;
    expect(meanAbs(report.steps)).toBeCloseTo(expected, 12);
    expect(coverageOf(report.steps)).toEqual({ evaluated: 0, covered: 0, share: null });
  });
});

describe("FAOSTAT parsers", () => {
  const oldCsv = readFileSync(OLD_CSV, "utf8");
  const newCsv = readFileSync(NEW_CSV, "utf8");
  const oldLines = oldCsv.split("\n");

  it("reads 53 consecutive historic years (1961-2013) with net imports", () => {
    const h = parseHistoricCsv(oldCsv);
    expect(h.netImports).toHaveLength(53);
    expect(h.netImports[0]).toEqual({ year: 1961, value: 109 - 0 });
    expect(h.netImports.find((p) => p.year === 2013)?.value).toBe(1120 - 88);
    expect(h.license).toBe("CC-BY-4.0");
  });

  it("refuses a missing year, a duplicate, a wrong unit or a wrong product in the historic file", () => {
    expect(() => parseHistoricCsv(oldLines.filter((l) => !l.includes(",Export quantity,1990,")).join("\n"))).toThrow(/incohérentes/);
    expect(() => parseHistoricCsv(oldCsv + oldLines.find((l) => l.includes(",Production,1990,")) + "\n")).toThrow(/double/);
    expect(() => parseHistoricCsv(oldCsv.replace(",1000 t,", ",tonnes,"))).toThrow(/unité/);
    expect(() => parseHistoricCsv(oldCsv.replaceAll("Milled Equivalent", "Paddy"))).toThrow(/produit/);
  });

  it("refuses a historic file whose columns are shifted by an unquoted comma", () => {
    const shifted = oldCsv.replace("(to 2013 - old methodology)", "(to 2013, old methodology)");
    expect(() => parseHistoricCsv(shifted)).toThrow();
  });

  it("splices the two series with a stable factor of about 1.499 measured on 2010-2013", () => {
    const sp = spliceNetImports(parseHistoricCsv(oldCsv).netImports, parseFaostatCsv(newCsv).netImports);
    expect(sp.factor).toBeCloseTo(1.4988, 3);
    expect(sp.overlap.map((o) => o.year)).toEqual([2010, 2011, 2012, 2013]);
    for (const o of sp.overlap) expect(o.ratio).toBeGreaterThan(1.498);
    for (const o of sp.overlap) expect(o.ratio).toBeLessThan(1.5);
    expect(sp.series).toHaveLength(63);
    expect(sp.series[0].year).toBe(1961);
    expect(sp.series[62].year).toBe(2023);
    // avant 2010 : ancienne valeur x facteur ; à partir de 2010 : valeur récente telle quelle
    expect(sp.series[0].value).toBeCloseTo(109 * sp.factor, 6);
    expect(sp.series.find((p) => p.year === 2023)?.value).toBe(2338 - 120);
  });

  it("refuses to splice when the unit factor is not stable, or the overlap is too short", () => {
    const hist = series([100, 100, 100, 100], 2010);
    expect(() => spliceNetImports(hist, series([150, 150, 190, 150], 2010))).toThrow(/instable/);
    expect(() => spliceNetImports(series([100, 100], 2010), series([150, 150], 2010))).toThrow(/recouvrement/);
  });
});

describe("the gate, on synthetic series", () => {
  it("refuses a series that is too short, or has a gap", () => {
    const short = forecastNext(series(Array.from({ length: 30 }, (_, i) => 100 + i)));
    expect(short.state).toBe("insufficient_data");
    const gap = series(Array.from({ length: 60 }, (_, i) => 100 + i)).filter((p) => p.year !== 1980);
    const g = forecastNext(gap);
    expect(g.state).toBe("insufficient_data");
    if (g.state === "insufficient_data") expect(g.reasons[0]).toMatch(/consécutives/);
  });

  it("publishes a model forecast when one clearly and steadily beats persistence", () => {
    const rand = lcg(7);
    // croissance exponentielle régulière avec un peu de bruit : la tendance bat nettement la persistance
    const values = Array.from({ length: 63 }, (_, i) => 100 * 1.05 ** i * (1 + (rand() - 0.5) * 0.04));
    const result = forecastNext(series(values));
    expect(result.state).toBe("forecast");
    if (result.state === "forecast") {
      expect(result.evaluation.ratio).toBeLessThanOrEqual(GATE.maxRelativeError);
      expect(result.evaluation.wins).toBeGreaterThan(GATE.minWinShare * result.evaluation.evaluationSteps);
      expect(result.model).not.toBe("naive");
      expect(result.lowerKt).toBeLessThan(result.pointKt);
      expect(result.upperKt).toBeGreaterThan(result.pointKt);
    }
  });

  it("falls back to a reference band, claiming no model, when nothing beats persistence", () => {
    let found = 0;
    for (const seed of [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]) {
      const r = lcg(seed);
      let x = 100;
      const result = forecastNext(series(Array.from({ length: 63 }, () => (x *= 1 + (r() - 0.5) * 0.3))));
      if (result.state === "reference_band") {
        found++;
        expect(result.reasons.length).toBeGreaterThan(0);
        expect(result.band.lowerKt).toBeLessThan(result.band.baselineKt);
        expect(result.band.upperKt).toBeGreaterThan(result.band.baselineKt);
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it("never publishes a model unless every condition holds, and only a calibrated band otherwise (random series)", () => {
    const rand = lcg(2024);
    const seen = { forecast: 0, band: 0, insufficient: 0 };
    for (let trial = 0; trial < 150; trial++) {
      let v = 100;
      const drift = (rand() - 0.3) * 0.08;
      const result = forecastNext(series(Array.from({ length: 55 + Math.floor(rand() * 15) }, () => (v *= 1 + drift + (rand() - 0.5) * 0.25))));
      if (result.state === "forecast") {
        seen.forecast++;
        expect(result.evaluation.ratio).toBeLessThanOrEqual(GATE.maxRelativeError);
        expect(result.evaluation.wins).toBeGreaterThan(GATE.minWinShare * result.evaluation.evaluationSteps);
      } else if (result.state === "reference_band") {
        seen.band++;
        const c = result.band.coverage;
        expect(c.evaluated).toBeGreaterThanOrEqual(GATE.minIntervalSteps);
        expect(Math.abs((c.share as number) - GATE.intervalLevel)).toBeLessThanOrEqual(GATE.coverageTolerance + 1e-12);
        expect(result.reasons.length).toBeGreaterThan(0);
      } else {
        seen.insufficient++;
        expect(result.reasons.length).toBeGreaterThan(0);
      }
    }
    // le test n'a de sens que s'il exerce plusieurs issues
    expect(seen.forecast + seen.band + seen.insufficient).toBe(150);
    expect(Object.values(seen).filter((n) => n > 0).length).toBeGreaterThanOrEqual(2);
  });
});

describe("the real result (values cross-checked by an independent Python prototype)", () => {
  const loaded = loadForecast();
  const { result, splice } = loaded;

  it("tests 53 one-year-ahead forecasts, 1971 to 2023", () => {
    const naive = result.reports.find((r) => r.model === "naive")!;
    expect(naive.steps).toHaveLength(53);
    expect(naive.steps[0].year).toBe(1971);
    expect(naive.steps[52].year).toBe(2023);
  });

  it("selects the 10-year window on the first half, and it does NOT beat persistence on the second", () => {
    expect(result.state).toBe("reference_band");
    if (result.state !== "reference_band") return;
    expect(result.selected.model).toBe("win10");
    expect(result.selected.ratio).toBeGreaterThan(0.93);
    expect(result.selected.ratio).toBeLessThan(0.95); // 0,94 : au-dessus du seuil de 0,90
    expect(result.selected.wins).toBe(12);
    expect(result.selected.evaluationSteps).toBe(27);
    expect(result.reasons.join(" ")).toMatch(/majorité requise/);
  });

  it("reports the other models as the prototype did", () => {
    const by = Object.fromEntries(result.evaluations.map((e) => [e.model, e]));
    expect(by.drift.ratio).toBeCloseTo(0.98, 1);
    expect(by.linear.ratio).toBeCloseTo(1.1, 1);
    expect(by.loglinear.ratio).toBeCloseTo(0.82, 1);
    expect(by.loglinear.selectionError).toBeGreaterThan(by.win10.selectionError); // non retenu par la règle : son erreur de sélection est plus élevée
  });

  it("gives a reference band around persistence, calibrated: 25 of 33 covered", () => {
    if (result.state !== "reference_band") throw new Error("état inattendu");
    const b = result.band;
    expect(b.year).toBe(2024);
    expect(b.baselineKt).toBe(2218);
    expect(b.coverage).toMatchObject({ evaluated: 33, covered: 25 });
    expect(Math.round(b.lowerKt)).toBeCloseTo(1596, -1);
    expect(Math.round(b.upperKt)).toBeCloseTo(3083, -1);
    // la fourchette est symétrique en échelle relative autour de la persistance
    expect(b.lowerKt * b.upperKt).toBeCloseTo(b.baselineKt ** 2, 3);
  });

  it("shows the instability across eras: ahead of persistence before 2006, behind after", () => {
    if (result.state !== "reference_band") throw new Error("état inattendu");
    const latest = result.eras[result.eras.length - 1];
    expect(latest.label).toMatch(/2006/);
    expect(latest.model).toBeGreaterThan(latest.naive);
    expect(result.eras[0].model).toBeLessThan(result.eras[0].naive);
  });

  it("splices the long series (63 years) with the checked factor", () => {
    expect(splice.series).toHaveLength(63);
    expect(splice.factor).toBeCloseTo(1.4988, 3);
  });
});

describe("the summary given to the agent does not claim a forecast it does not have", () => {
  const loaded = loadForecast();
  const summary = forecastSummary(loaded) as Record<string, unknown>;

  it("says no model is claimed and carries the band, the protocol and the unit caveat", () => {
    expect(summary.state).toBe("reference_band");
    expect(summary.noModelClaimed).toBe(true);
    expect(summary).not.toHaveProperty("forecastKt");
    expect(summary.persistenceKt).toBe(2218);
    expect(summary.referenceYear).toBe(2024);
    expect(summary.intervalCoveredForecasts).toBe(25);
    expect(summary.intervalEvaluatedOn).toBe(33);
    expect(String(summary.protocol)).toMatch(/première moitié/);
    expect(String(summary.caveat)).toMatch(/paddy/);
    expect(summary.unitFactorApplied).toBeCloseTo(1.499, 2);
  });

  it("rounds its figures exactly as the screen does", () => {
    if (loaded.result.state !== "reference_band") throw new Error("état inattendu");
    expect(summary.referenceLowerKt).toBe(Math.round(loaded.result.band.lowerKt));
    expect(summary.referenceUpperKt).toBe(Math.round(loaded.result.band.upperKt));
  });
});

describe("sensitivity of the conclusion to the selection rule", () => {
  const { result, splice } = loadForecast();

  it("rolling selection on past performance also shows no gain (ratio close to 1, about 17 of 41 steps)", () => {
    if (result.state !== "reference_band") throw new Error("état inattendu");
    const r = result.sensitivity.rolling!;
    expect(r.steps).toBe(41);
    expect(r.ratio).toBeGreaterThan(0.97);
    expect(r.ratio).toBeLessThan(1.01);
    expect(r.wins).toBe(17);
  });

  it("the claim 'another model does better but is not retained' is true: exponential growth, 0.82 and 16 of 27", () => {
    if (result.state !== "reference_band") throw new Error("état inattendu");
    const better = result.sensitivity.notSelectedButBetter;
    expect(better.map((e) => e.model)).toEqual(["loglinear"]);
    expect(better[0].ratio).toBeCloseTo(0.82, 1);
    expect(better[0].wins).toBe(16);
    expect(better[0].model).not.toBe(result.selected.model);
    // et c'est bien la sélection fondée sur le passé qui l'écarte
    expect(better[0].selectionError).toBeGreaterThan(result.selected.selectionError);
  });

  it("persistence under-predicts: about 64% positive errors, mean bias about +5%", () => {
    if (result.state !== "reference_band") throw new Error("état inattendu");
    const b = result.sensitivity.persistenceBias;
    expect(b.n).toBe(53);
    expect(b.positiveShare).toBeCloseTo(34 / 53, 6);
    expect(b.meanLog).toBeGreaterThan(0.04);
    expect(b.meanLog).toBeLessThan(0.06);
  });

  it("states the 95% interval of the coverage: 25 of 33 is compatible with 80%, no more", () => {
    if (result.state !== "reference_band") throw new Error("état inattendu");
    const [lo, hi] = result.sensitivity.coverageWilson95!;
    expect(lo).toBeCloseTo(0.59, 1);
    expect(hi).toBeCloseTo(0.87, 1);
    expect(lo).toBeLessThan(GATE.intervalLevel);
    expect(hi).toBeGreaterThan(GATE.intervalLevel);
  });

  it("gives, for information, the value each model would give for 2024 (never published as a forecast)", () => {
    const by = Object.fromEntries(result.evaluations.map((e) => [e.model, e.nextKt]));
    expect(Object.keys(by).sort()).toEqual(["drift", "linear", "loglinear", "win10"]);
    for (const v of Object.values(by)) expect(v).toBeGreaterThan(0);
    expect(result.state).toBe("reference_band");
    expect(splice.series[splice.series.length - 1].year).toBe(2023);
  });
});

describe("the model choice does not leak the second half", () => {
  const { splice } = loadForecast();

  it("changing every value from 1997 on does not change the model chosen on the first half", () => {
    const original = forecastNext(splice.series);
    const rand = lcg(99);
    const perturbed = splice.series.map((p) => (p.year >= 1997 ? { ...p, value: p.value * (0.5 + rand()) } : p));
    const changed = forecastNext(perturbed);
    if (original.state === "insufficient_data" || changed.state === "insufficient_data") throw new Error("état inattendu");
    const pick = (r: typeof original) => (r.state === "reference_band" ? r.selected : r.evaluation);
    expect(pick(changed).model).toBe(pick(original).model);
    expect(pick(changed).selectionError).toBe(pick(original).selectionError);
    // alors que l'évaluation, elle, change : la seconde moitié est bien celle qui a bougé
    expect(pick(changed).evaluationError).not.toBe(pick(original).evaluationError);
  });

  it("adding a future year never changes the earlier steps, ranges or coverage", () => {
    const full = forecastNext(splice.series);
    const truncated = forecastNext(splice.series.slice(0, -1));
    for (const model of MODELS) {
      const a = full.reports.find((r) => r.model === model)!.steps;
      const b = truncated.reports.find((r) => r.model === model)!.steps;
      expect(a.slice(0, b.length)).toEqual(b);
    }
  });
});

describe("guards on unusable input", () => {
  it("refuses a series containing a zero, a negative or a missing value", () => {
    const good = Array.from({ length: 63 }, (_, i) => 100 + i * 5);
    for (const bad of [0, -5, NaN]) {
      const values = [...good];
      values[30] = bad;
      const r = forecastNext(series(values));
      expect(r.state).toBe("insufficient_data");
      if (r.state === "insufficient_data") expect(r.reasons[0]).toMatch(/nulle, négative ou illisible/);
    }
  });
});
