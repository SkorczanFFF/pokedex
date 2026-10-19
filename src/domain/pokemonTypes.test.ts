import { describe, expect, it } from "vitest";
import { RETRO } from "./era";
import {
  MAX_TYPES,
  isPokemonType,
  parseTypes,
  serializeTypes,
  typeClass,
  typesAvailableIn,
  typesUpTo,
} from "./pokemonTypes";

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

describe("the types an era has", () => {
  it("hides Dark and Steel before Gen II and Fairy before Gen VI", () => {
    expect(typesUpTo("i")).toHaveLength(15);
    expect(typesUpTo("i")).not.toContain("dark");
    expect(typesUpTo("i")).not.toContain("steel");
    expect(typesUpTo("ii")).toHaveLength(17);
    expect(typesUpTo("ii")).toContain("steel");
    expect(typesUpTo("ii")).not.toContain("fairy");
    expect(typesUpTo("vi")).toHaveLength(18);
    expect(typesAvailableIn(RETRO)).toEqual(typesUpTo("ii"));
  });

  it("keeps dex order", () => {
    expect(typesUpTo("i").slice(0, 3)).toEqual(["normal", "fire", "water"]);
  });
});

describe("type helpers", () => {
  it("narrows strings to types", () => {
    expect(isPokemonType("fire")).toBe(true);
    expect(isPokemonType("shadow")).toBe(false);
    expect(isPokemonType(null)).toBe(false);
  });

  it("colours a known type and greys an unknown one", () => {
    expect(typeClass("fire")).toMatch(/^bg-/);
    expect(typeClass("shadow")).toBe("bg-gray-200 text-black");
  });
});
