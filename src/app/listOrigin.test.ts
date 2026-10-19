import { describe, expect, it } from "vitest";
import { readOrigin, readRestore, returnState } from "./listOrigin";

describe("list origin", () => {
  it("reads what a card wrote, and nothing else", () => {
    expect(readOrigin({ from: "/?type=grass&page=2", scrollY: 1480 })).toEqual({
      from: "/?type=grass&page=2",
      scrollY: 1480,
    });
    expect(readOrigin({ from: "/" })).toEqual({ from: "/", scrollY: 0 });
    expect(readOrigin(null)).toBeNull();
    expect(readOrigin(undefined)).toBeNull();
    expect(readOrigin({ restoreScroll: 10 })).toBeNull();
  });

  it("hands the list its offset back, and the list reads only that", () => {
    expect(returnState({ from: "/", scrollY: 300 })).toEqual({ restoreScroll: 300 });
    expect(returnState(null)).toBeNull();
    expect(readRestore({ restoreScroll: 300 })).toBe(300);
    expect(readRestore({ from: "/", scrollY: 300 })).toBeNull();
    expect(readRestore(null)).toBeNull();
  });
});
