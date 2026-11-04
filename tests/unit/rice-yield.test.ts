import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RICE,
  departmentStatus,
  estimateYield,
  findDepartment,
  rankDepartments,
  riceSummary,
  validRecords,
} from "../../src/lib/rice-yield";

const dep = (name: string) => {
  const d = findDepartment(name);
  if (!d) throw new Error(`département introuvable : ${name}`);
  return d;
};

describe("rice yield by department", () => {
  it("has the 45 departments, each with a drawable path", () => {
    expect(RICE.departments).toHaveLength(45);
    for (const d of RICE.departments) expect(d.d.startsWith("M")).toBe(true);
  });

  it("matches names regardless of accents, case and hyphens", () => {
    expect(findDepartment("saint louis")?.key).toBe("Saint Louis");
    expect(findDepartment("Médina Yoroufoula")?.key).toBe("Medina Yoroufoula");
    expect(findDepartment("KOLDA")?.key).toBe("Kolda");
    expect(findDepartment("Atlantide")).toBeNull();
  });

  it("keeps the 21 departments with enough valid years and rice area, and refuses the others", () => {
    const kept = RICE.departments.filter((d) => departmentStatus(d).state === "available");
    expect(kept).toHaveLength(21);
    const dakar = departmentStatus(dep("Dakar"));
    expect(dakar.state).toBe("insufficient_data");
    const diourbel = departmentStatus(dep("Diourbel"));
    expect(diourbel.state).toBe("insufficient_data");
  });

  it("never uses the excluded year 2021 in estimates", () => {
    const dagana = dep("Dagana");
    expect(dagana.records.some((r) => r.year === 2021)).toBe(true);
    expect(validRecords(dagana).some((r) => r.year === 2021)).toBe(false);
    const summary = riceSummary(dagana);
    expect(summary.history.some((h) => h.year === 2021)).toBe(false);
    expect(JSON.stringify(summary)).not.toContain("2021");
  });

  it("exposes no history for a department it refuses to estimate", () => {
    const summary = riceSummary(dep("Bakel"));
    expect(summary.status.state).toBe("insufficient_data");
    expect(summary.history).toEqual([]);
    expect(summary.estimate).toBeNull();
  });

  it("estimates with a band around the department's geometric mean", () => {
    const e = estimateYield(dep("Kolda"));
    expect(e).not.toBeNull();
    expect(e!.bandLowKgHa).toBeLessThan(e!.meanYieldKgHa);
    expect(e!.bandHighKgHa).toBeGreaterThan(e!.meanYieldKgHa);
    expect(e!.bandLevelPct).toBe(80);
    expect(e!.group).toBe("sud pluvial");
    expect(estimateYield(dep("Dakar"))).toBeNull();
  });

  it("reproduces the Python out-of-sample error of the department mean (17.4 %)", () => {
    const py = JSON.parse(readFileSync("data/results/yield-backtest.json", "utf8"));
    // Erreur relative moyenne tous groupes confondus : moyenne pondérée par le nombre d'erreurs de chaque groupe.
    const north = estimateYield(dep("Dagana"))!;
    const south = estimateYield(dep("Kolda"))!;
    const total = north.bandErrorsCount + south.bandErrorsCount;
    const logMean = (e: typeof north) => Math.log(1 + e.meanRelativeErrorPct / 100);
    const all = Math.exp((logMean(north) * north.bandErrorsCount + logMean(south) * south.bandErrorsCount) / total) - 1;
    expect(total).toBe(py.n_cellules);
    expect(Math.abs(all * 100 - py.modeles.A.mae_relative_pct)).toBeLessThan(0.3);
  });

  it("ranks only available departments, best yield first", () => {
    const ranking = rankDepartments();
    expect(ranking).toHaveLength(21);
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].meanYieldKgHa).toBeGreaterThanOrEqual(ranking[i].meanYieldKgHa);
    }
    expect(ranking[0].group).toBe("nord irrigué");
  });
});
