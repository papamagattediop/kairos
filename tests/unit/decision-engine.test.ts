import { describe, expect, it } from "vitest";
import { calculateBalance } from "../../src/lib/decision-engine";

describe("calculateBalance", () => {
  it("calculates a scenario gap from all four explicit inputs", () => {
    const result = calculateBalance({
      demandKt: 2000,
      productionKt: 1250,
      importsKt: 600,
      stockReleaseKt: 0,
    });

    expect(result).toMatchObject({ state: "scenario", gapKt: 150 });
  });

  it("does not treat a missing stock value as zero", () => {
    const result = calculateBalance({
      demandKt: 2000,
      productionKt: 1250,
      importsKt: 600,
      stockReleaseKt: null,
    });

    expect(result.state).toBe("insufficient_data");
    if (result.state === "insufficient_data") {
      expect(result.missingInputs).toContain(
        "Contribution nette des stocks",
      );
    }
  });

  it("rejects negative demand, production, or imports", () => {
    const result = calculateBalance({
      demandKt: -1,
      productionKt: 100,
      importsKt: 20,
      stockReleaseKt: 0,
    });

    expect(result.state).toBe("insufficient_data");
  });

  it("allows a negative stock contribution to represent stock accumulation", () => {
    const result = calculateBalance({
      demandKt: 2000,
      productionKt: 1250,
      importsKt: 600,
      stockReleaseKt: -25,
    });

    expect(result).toMatchObject({ state: "scenario", gapKt: 175 });
  });
});
