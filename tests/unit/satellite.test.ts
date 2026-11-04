import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SCL_CLOUD_OR_SHADOW, SCL_WATER, parseNpy, zoneGeometry } from "../../scripts/lib/npy.mjs";

// Fabrique un fichier .npy 1.0 minimal.
function makeNpy(descr: string, shape: number[], values: number[], opts: { fortran?: boolean; drop?: number } = {}) {
  const header = `{'descr': '${descr}', 'fortran_order': ${opts.fortran ? "True" : "False"}, 'shape': (${shape.join(", ")}${shape.length === 1 ? "," : ""}), }`;
  const padded = header.padEnd(Math.ceil((header.length + 11) / 64) * 64 - 11, " ") + "\n";
  const head = Buffer.alloc(10 + padded.length);
  head.write("\x93NUMPY", 0, "latin1");
  head[6] = 1;
  head[7] = 0;
  head.writeUInt16LE(padded.length, 8);
  head.write(padded, 10, "latin1");
  const size = { "<f8": 8, "|u1": 1 }[descr as "<f8" | "|u1"];
  const body = Buffer.alloc(values.length * size);
  values.forEach((v, i) => (descr === "<f8" ? body.writeDoubleLE(v, i * 8) : (body[i] = v)));
  const all = Buffer.concat([head, body]);
  return opts.drop ? all.subarray(0, all.length - opts.drop) : all;
}

describe("parseNpy", () => {
  it("reads float64 values and the shape", () => {
    const npy = parseNpy(makeNpy("<f8", [2, 2, 2], [0.5, -0.25, 1, 2, 255, 0, 255, 255]));
    expect(npy.shape).toEqual([2, 2, 2]);
    expect(npy.get(0)).toBe(0.5);
    expect(npy.get(1)).toBe(-0.25);
    expect(npy.get(4)).toBe(255); // première valeur de la couche 2 (masque)
  });

  it("reads uint8 classes", () => {
    const npy = parseNpy(makeNpy("|u1", [1, 2, 2], [6, 8, 4, 10]));
    expect([0, 1, 2, 3].map((i) => npy.get(i))).toEqual([6, 8, 4, 10]);
  });

  it("refuses non-NPY, Fortran order, unknown types and truncated data", () => {
    expect(() => parseNpy(Buffer.from("pas un npy du tout, vraiment pas"))).toThrow(/NPY/);
    expect(() => parseNpy(makeNpy("<f8", [2], [1, 2], { fortran: true }))).toThrow(/Fortran/);
    expect(() => parseNpy(makeNpy("<f8", [2], [1, 2], { drop: 4 }))).toThrow(/tronquées/);
  });
});

describe("zone geometry", () => {
  const bbox = [-16.28, 16.4, -16.14, 16.54];
  const g = zoneGeometry(bbox, 747, 774);

  it("matches the hand-checked zone of about 231.4 km² and 20 m pixels", () => {
    expect(g.widthKm).toBeCloseTo(14.945, 2);
    expect(g.heightKm).toBeCloseTo(15.48, 2);
    expect(g.zoneKm2).toBeCloseTo(231.4, 1);
    expect(g.pixelKm2).toBeCloseTo(0.0004001, 6); // environ 20 m x 20 m
    expect(Math.sqrt(g.pixelKm2) * 1000).toBeCloseTo(20, 0);
  });

  it("covers the zone with width x height pixels", () => {
    expect(g.pixelKm2 * 747 * 774).toBeCloseTo(g.zoneKm2, 6);
  });
});

describe("SCL classes", () => {
  it("counts cloud, medium and high cloud, and cloud shadow as non-water", () => {
    expect([...SCL_CLOUD_OR_SHADOW].sort((a, b) => a - b)).toEqual([3, 8, 9, 10]);
    expect(SCL_WATER).toBe(6);
  });
});

describe("valley water extent data: claims made by the panel", () => {
  const extent = JSON.parse(readFileSync("data/satellite/valley-water-extent.json", "utf8"));
  const usable = extent.rows.filter((r: { usable: boolean }) => r.usable);
  const monthly = (months: string[], key: "ndwiWaterKm2" | "sclWaterKm2") => {
    const v = usable.filter((r: { date: string }) => months.includes(r.date.slice(5, 7))).map((r: Record<string, number>) => r[key]);
    return v.reduce((a: number, b: number) => a + b, 0) / v.length;
  };

  it("has 39 dates, 32 usable, each usable one with at most 5% cloud", () => {
    expect(extent.rows).toHaveLength(39);
    expect(usable).toHaveLength(32);
    for (const r of usable) expect(r.cloudShare).toBeLessThanOrEqual(0.05);
  });

  it("states a zone of 231.4 km² and 2026 dates only", () => {
    expect(extent.zoneAreaKm2).toBeCloseTo(231.4, 1);
    for (const r of extent.rows) expect(r.date.startsWith("2026-")).toBe(true);
  });

  it("January to March is high with BOTH methods (more than twice May to July)", () => {
    for (const key of ["ndwiWaterKm2", "sclWaterKm2"] as const) {
      expect(monthly(["01", "02", "03"], key)).toBeGreaterThan(2 * monthly(["05", "06", "07"], key));
    }
  });

  it("the August rise appears with the NDWI only", () => {
    expect(monthly(["08"], "ndwiWaterKm2")).toBeGreaterThan(2 * monthly(["08"], "sclWaterKm2"));
    expect(monthly(["08"], "sclWaterKm2")).toBeLessThan(monthly(["01", "02"], "sclWaterKm2"));
  });

  it("keeps the correlation of the two methods between 0.7 and 0.9", () => {
    const x = usable.map((r: { ndwiWaterKm2: number }) => r.ndwiWaterKm2);
    const y = usable.map((r: { sclWaterKm2: number }) => r.sclWaterKm2);
    const m = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
    const [mx, my] = [m(x), m(y)];
    let n = 0, dx = 0, dy = 0;
    x.forEach((v: number, i: number) => {
      n += (v - mx) * (y[i] - my);
      dx += (v - mx) ** 2;
      dy += (y[i] - my) ** 2;
    });
    const r = n / Math.sqrt(dx * dy);
    expect(r).toBeGreaterThan(0.7);
    expect(r).toBeLessThan(0.9);
  });
});

describe("vegetation data: claims made by the panel", () => {
  const veg = JSON.parse(readFileSync("data/satellite/valley-vegetation.json", "utf8"));
  const water = JSON.parse(readFileSync("data/satellite/valley-water-extent.json", "utf8"));

  it("uses exactly the dates that the water script kept, on the same zone", () => {
    const usable = water.rows.filter((r: { usable: boolean }) => r.usable).map((r: { date: string }) => r.date);
    expect(veg.rows.map((r: { date: string }) => r.date)).toEqual(usable);
    expect(veg.bbox).toEqual(water.bbox);
    expect(veg.zoneAreaKm2).toBe(water.zoneAreaKm2);
  });

  it("accounts for every pixel of the zone in the land cover classes", () => {
    const total = Object.values(veg.landCover.classPixelCounts as Record<string, number>).reduce((a, b) => a + b, 0);
    expect(total).toBe(747 * 774);
  });

  it("states cropland area consistent with its class count and pixel area", () => {
    const px = zoneGeometry(veg.bbox, 747, 774).pixelKm2;
    expect(veg.landCover.croplandKm2).toBeCloseTo(veg.landCover.classPixelCounts["40"] * px, 1);
    expect(veg.landCover.croplandShareOfZone).toBeCloseTo(veg.landCover.classPixelCounts["40"] / (747 * 774), 3);
  });

  it("keeps NDVI values in range and percentiles ordered", () => {
    for (const r of veg.rows) {
      expect(r.croplandNdviMean).toBeGreaterThan(-1);
      expect(r.croplandNdviMean).toBeLessThan(1);
      expect(r.croplandNdviP10).toBeLessThanOrEqual(r.croplandNdviP90);
      expect(r.croplandValidShare).toBeGreaterThan(0.9);
    }
  });

  it("keeps the 10th percentile below the mean and the mean below the 90th", () => {
    for (const r of veg.rows) {
      expect(r.croplandNdviP10).toBeLessThanOrEqual(r.croplandNdviMean);
      expect(r.croplandNdviMean).toBeLessThanOrEqual(r.croplandNdviP90);
    }
  });

  it("matches the figures quoted in the README and the panel (0.18 to 0.47, 31% cropland, 46% wetland)", () => {
    const means = veg.rows.map((r: { croplandNdviMean: number }) => r.croplandNdviMean);
    expect(Math.min(...means)).toBeCloseTo(0.18, 2);
    expect(Math.max(...means)).toBeCloseTo(0.47, 2);
    const total = 747 * 774;
    expect(Math.round((veg.landCover.classPixelCounts["40"] / total) * 100)).toBe(31);
    expect(Math.round((veg.landCover.classPixelCounts["90"] / total) * 100)).toBe(46);
    expect(veg.landCover.croplandKm2).toBeCloseTo(70.6, 1);
  });

  it("has a gap between the 6 April and 3 May dates, as the panel says", () => {
    const dates = veg.rows.map((r: { date: string }) => r.date);
    expect(dates).toContain("2026-04-06");
    expect(dates).toContain("2026-05-03");
    expect(dates.filter((d: string) => d > "2026-04-06" && d < "2026-05-03")).toEqual([]);
  });

  it("peaks in autumn with a clear high, and its minimum is below 0.25", () => {
    const means = veg.rows.map((r: { croplandNdviMean: number; date: string }) => [r.croplandNdviMean, r.date]);
    const max = means.reduce((a: [number, string], b: [number, string]) => (b[0] > a[0] ? b : a));
    const min = means.reduce((a: [number, string], b: [number, string]) => (b[0] < a[0] ? b : a));
    expect(max[1] >= "2026-09-01").toBe(true);
    expect(max[0]).toBeGreaterThan(0.4);
    expect(min[0]).toBeLessThan(0.25);
  });

  it("flags the offset compensation and the 2021 land cover in its methods", () => {
    expect(veg.method.ndvi).toMatch(/- 2000/);
    expect(veg.landCover.source).toMatch(/2021/);
    expect(veg.note).toMatch(/ni la production|pas validé/);
  });
});
