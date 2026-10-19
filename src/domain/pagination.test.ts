import { describe, expect, it } from "vitest";
import {
  DEFAULT_PER_PAGE,
  PER_PAGE_OPTIONS,
  isPerPage,
  pageCount,
  pageOffset,
  pageSlice,
} from "./pagination";

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

describe("paging a list", () => {
  const items = Array.from({ length: 45 }, (_, i) => i + 1);

  it("counts pages from one and offsets from zero", () => {
    expect(pageOffset(1, 20)).toBe(0);
    expect(pageOffset(3, 20)).toBe(40);
    expect(pageCount(45, 20)).toBe(3);
    expect(pageCount(40, 20)).toBe(2);
    expect(pageCount(0, 20)).toBe(0);
  });

  it("slices one page, short at the end", () => {
    expect(pageSlice(items, 1, 20)).toEqual(items.slice(0, 20));
    expect(pageSlice(items, 3, 20)).toEqual([41, 42, 43, 44, 45]);
    expect(pageSlice(items, 4, 20)).toEqual([]);
  });
});
