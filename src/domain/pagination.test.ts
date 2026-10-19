import { describe, expect, it } from "vitest";
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS, isPerPage } from "./pagination";

describe("page sizes", () => {
  it("offers three sizes and opens on the smallest", () => {
    expect(PER_PAGE_OPTIONS).toEqual([20, 40, 60]);
    expect(DEFAULT_PER_PAGE).toBe(20);
  });

  it("accepts only those sizes from the URL", () => {
    expect(isPerPage(40)).toBe(true);
    expect(isPerPage(25)).toBe(false);
    expect(isPerPage(Number.NaN)).toBe(false);
  });
});
