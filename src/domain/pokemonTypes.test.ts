import { describe, expect, it } from "vitest";
import { RETRO } from "./era";
import { MAX_TYPES, isPokemonType, typesAvailableIn, typesUpTo } from "./pokemonTypes";

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

  it("caps a typing at two", () => {
    expect(MAX_TYPES).toBe(2);
  });
});
