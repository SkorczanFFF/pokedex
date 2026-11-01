import { describe, expect, it } from "vitest";
import { encountersPath, listPath, paths, pokemonPath, stadiumPath, versusPath } from "./routes";

describe("routes", () => {
  it("builds a Pokémon's addresses from the route patterns", () => {
    expect(pokemonPath("pikachu")).toBe("/pokemon/pikachu");
    expect(encountersPath("mr-mime")).toBe("/pokemon/mr-mime/encounters");
    expect(pokemonPath("x")).toMatch(new RegExp(`^${paths.pokemon.replace(":name", "x")}$`));
  });

  it("writes the list's filters into the query string, or none", () => {
    expect(listPath()).toBe("/");
    expect(listPath({ type: "grass" })).toBe("/?type=grass");
    expect(listPath({ type: null, gen: "ii" })).toBe("/?gen=ii");
  });

  it("writes Versus' sides into the query string, or none", () => {
    expect(versusPath()).toBe("/versus");
    expect(versusPath({ a: "pikachu" })).toBe("/versus?a=pikachu");
    expect(versusPath({ a: "meowth", b: "jigglypuff" })).toBe("/versus?a=meowth&b=jigglypuff");
    expect(versusPath({ a: null, b: "gyarados" })).toBe("/versus?b=gyarados");
  });

  it("puts the Stadium game in the path", () => {
    expect(stadiumPath("1")).toBe("/stadium/1");
    expect(stadiumPath("2")).toBe("/stadium/2");
  });
});
