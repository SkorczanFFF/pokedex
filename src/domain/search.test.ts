import { describe, expect, it } from "vitest";
import { MODERN, RETRO } from "./era";
import { matchNames } from "./search";

const index = (...entries: [string, number][]) =>
  entries.map(([name, id]) => ({ name, url: `https://pokeapi.co/api/v2/pokemon/${id}/` }));

const names = index(
  ["bulbasaur", 1],
  ["mr-mime", 122],
  ["mew", 151],
  ["mewtwo", 150],
  ["mr-rime", 866],
  ["pikachu-gmax", 10199],
);

describe("matchNames", () => {
  it("finds names containing the term, in the index's order, inside the era", () => {
    expect(matchNames(names, "mew", MODERN).map((e) => e.name)).toEqual(["mew", "mewtwo"]);
    expect(matchNames(names, "mr-", MODERN).map((e) => e.name)).toEqual(["mr-mime", "mr-rime"]);
    expect(matchNames(names, "mr-", RETRO).map((e) => e.name)).toEqual(["mr-mime"]);
  });

  it("keeps forms for the modern dex only", () => {
    expect(matchNames(names, "gmax", MODERN)).toHaveLength(1);
    expect(matchNames(names, "gmax", RETRO)).toHaveLength(0);
  });

  it("matches everything in the era on an empty term", () => {
    expect(matchNames(names, "", RETRO)).toHaveLength(4);
    expect(matchNames(names, "", MODERN)).toHaveLength(6);
  });
});
