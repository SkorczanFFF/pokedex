import { describe, expect, it } from "vitest";
import { MAX_TYPES } from "@/domain/pokemonTypes";
import { parseTypes, serializeTypes } from "./typeParam";

describe("the type filter's query parameter", () => {
  it("reads known slugs, drops unknown ones and duplicates", () => {
    expect(parseTypes("grass,poison")).toEqual(["grass", "poison"]);
    expect(parseTypes("steel,unicorn")).toEqual(["steel"]);
    expect(parseTypes("grass,grass,water")).toEqual(["grass", "water"]);
    expect(parseTypes(" grass , poison ")).toEqual(["grass", "poison"]);
    expect(parseTypes(null)).toEqual([]);
    expect(parseTypes("")).toEqual([]);
  });

  it("caps at the two types a Pokémon can have", () => {
    expect(MAX_TYPES).toBe(2);
    expect(parseTypes("grass,poison,fire")).toEqual(["grass", "poison"]);
  });

  it("writes back the same shape", () => {
    expect(serializeTypes(["grass", "poison"])).toBe("grass,poison");
    expect(serializeTypes([])).toBeNull();
  });
});
