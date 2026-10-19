import { describe, expect, it } from "vitest";
import {
  dexNeighbourIds,
  genOrder,
  genRoman,
  genSlugOf,
  generationFromId,
  gensUpTo,
  isGenSlug,
  lastDexId,
} from "./dex";

describe("generation slugs", () => {
  it("reads PokéAPI's names and prints numerals", () => {
    expect(genRoman("iv")).toBe("IV");
    expect(genRoman("generation-iv")).toBe("IV");
    expect(genSlugOf("generation-ii")).toBe("ii");
    expect(genSlugOf("generation-x")).toBeNull();
    expect(isGenSlug("ix")).toBe(true);
    expect(isGenSlug("x")).toBe(false);
    expect(isGenSlug(null)).toBe(false);
  });

  it("orders them in dex order", () => {
    expect(genOrder("i")).toBe(0);
    expect(genOrder("ix")).toBe(8);
    expect(gensUpTo("iii")).toEqual(["i", "ii", "iii"]);
  });
});

describe("dex ids", () => {
  it("knows where each generation's slice ends", () => {
    expect(lastDexId("i")).toBe(151);
    expect(lastDexId("ii")).toBe(251);
    expect(lastDexId("ix")).toBe(1025);
    expect(generationFromId(1)).toBe("i");
    expect(generationFromId(151)).toBe("i");
    expect(generationFromId(152)).toBe("ii");
    expect(generationFromId(1025)).toBe("ix");
  });

  it("gives no generation for a form numbered above the dex", () => {
    expect(generationFromId(10001)).toBeNull();
  });

  it("steps either side of an id and stops at the ends", () => {
    expect(dexNeighbourIds(25, 251)).toEqual({ prev: 24, next: 26 });
    expect(dexNeighbourIds(1, 251)).toEqual({ prev: null, next: 2 });
    expect(dexNeighbourIds(251, 251)).toEqual({ prev: 250, next: null });
  });

  it("steps nowhere from a form", () => {
    expect(dexNeighbourIds(10001, 251)).toEqual({ prev: null, next: null });
    expect(dexNeighbourIds(10001, Infinity)).toEqual({ prev: 10000, next: 10002 });
  });
});
