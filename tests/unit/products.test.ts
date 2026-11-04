import { describe, expect, it } from "vitest";
import { PRODUCTS, displayFor, getProduct } from "../../src/lib/products";

describe("product registry", () => {
  it("refuses every product at level 0", () => {
    expect(displayFor(0)).toBe("refusal");
    for (const product of PRODUCTS.filter((p) => p.level === 0)) {
      expect(displayFor(product.level)).toBe("refusal");
    }
  });

  it("only shows an interval from level 3", () => {
    expect(displayFor(1)).toBe("observed_balance");
    expect(displayFor(2)).toBe("labelled_estimate");
    expect(displayFor(3)).toBe("estimate_with_interval");
  });

  it("keeps rice as the only product above level 0 for the MVP", () => {
    expect(PRODUCTS.filter((p) => p.level > 0).map((p) => p.id)).toEqual(["rice"]);
  });

  it("looks a product up by id", () => {
    expect(getProduct("rice")?.label).toBe("Riz");
    expect(getProduct("unknown")).toBeUndefined();
  });
});
