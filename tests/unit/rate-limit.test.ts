import { describe, expect, it } from "vitest";
import { createLimiter } from "../../src/lib/rate-limit";

describe("createLimiter", () => {
  it("blocks a key after its per-window quota and frees it later", () => {
    const allow = createLimiter(2, 1000, 100);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("a", 1500)).toBe(true);
  });

  it("does not let one key block another", () => {
    const allow = createLimiter(1, 1000, 100);
    expect(allow("a", 0)).toBe(true);
    expect(allow("b", 0)).toBe(true);
  });

  it("enforces the global daily cap", () => {
    const allow = createLimiter(10, 1000, 2);
    expect(allow("a", 1)).toBe(true);
    expect(allow("b", 2)).toBe(true);
    expect(allow("c", 3)).toBe(false);
  });
});
