import { describe, expect, it } from "vitest";
import seg from "../../public/sam/valley-segments.json";

describe("Spark + SAM segmentation output", () => {
  it("keeps every share between 0 and 1 and every matched row consistent", () => {
    for (const r of seg.results as Array<{ areaHa: number; instances: unknown[]; shareOfScene: number; landCoverShares?: Record<string, number>; overlay?: string }>) {
      expect(r.shareOfScene).toBeGreaterThanOrEqual(0);
      expect(r.shareOfScene).toBeLessThanOrEqual(1);
      if (r.areaHa > 0) {
        expect(r.instances.length).toBeGreaterThan(0);
        expect(r.overlay).toBeTruthy();
        for (const v of Object.values(r.landCoverShares ?? {})) expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("lists every proposed concept exactly once across the rounds", () => {
    const all = seg.rounds.flatMap((r) => r.proposed);
    expect(new Set(all).size).toBe(all.length);
    expect(seg.results.length).toBe(all.length);
  });

  it("names both Meta models as the source of concepts and masks", () => {
    expect(seg.models.concepts).toContain("muse-spark");
    expect(seg.models.segmentation).toBe("sam-3.1");
  });
});
