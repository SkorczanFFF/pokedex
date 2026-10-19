import { describe, expect, it } from "vitest";
import { makePokemon, stat, stats } from "./__fixtures__/pokemon";
import { MODERN, RETRO } from "./era";
import { cryForSet, statsInEra, typesInEra } from "./pokemonView";

const GEN_I = { ...RETRO, maxGen: "i" as const };

describe("typesInEra", () => {
  it("reads the earliest past typing that still covers the era", () => {
    const clefairy = makePokemon({
      types: [{ slot: 1, type: { name: "fairy" } }],
      past_types: [{ generation: { name: "generation-v" }, types: [{ slot: 1, type: { name: "normal" } }] }],
    });
    expect(typesInEra(clefairy, MODERN).map((slot) => slot.type.name)).toEqual(["fairy"]);
    expect(typesInEra(clefairy, RETRO).map((slot) => slot.type.name)).toEqual(["normal"]);
  });

  it("keeps today's typing once the past no longer reaches the era", () => {
    const magnemite = makePokemon({
      types: [
        { slot: 1, type: { name: "electric" } },
        { slot: 2, type: { name: "steel" } },
      ],
      past_types: [{ generation: { name: "generation-i" }, types: [{ slot: 1, type: { name: "electric" } }] }],
    });
    expect(typesInEra(magnemite, RETRO).map((slot) => slot.type.name)).toEqual(["electric", "steel"]);
    expect(typesInEra(magnemite, GEN_I).map((slot) => slot.type.name)).toEqual(["electric"]);
  });
});

describe("statsInEra", () => {
  const pikachu = makePokemon({
    stats: stats(35, 55, 40, 50, 50, 90),
    past_stats: [
      { generation: { name: "generation-v" }, stats: [stat("defense", 30)] },
      { generation: { name: "generation-i" }, stats: [stat("special", 50)] },
    ],
  });

  it("gives today's numbers to the modern dex", () => {
    expect(statsInEra(pikachu, MODERN)).toEqual([
      { name: "hp", value: 35 },
      { name: "attack", value: 55 },
      { name: "defense", value: 40 },
      { name: "special-attack", value: 50 },
      { name: "special-defense", value: 50 },
      { name: "speed", value: 90 },
    ]);
  });

  it("lets each stat find its own earliest covering entry", () => {
    const retro = statsInEra(pikachu, RETRO);
    expect(retro.find((entry) => entry.name === "defense")?.value).toBe(30);
    expect(retro.map((entry) => entry.name)).toContain("special-attack");
  });

  it("folds the split pair into one Special where the era had one", () => {
    expect(statsInEra(pikachu, GEN_I).map((entry) => entry.name)).toEqual([
      "hp",
      "attack",
      "defense",
      "special",
      "speed",
    ]);
    expect(statsInEra(pikachu, GEN_I).find((entry) => entry.name === "special")?.value).toBe(50);
  });
});

describe("cryForSet", () => {
  it("plays the legacy recording under a Gen I–V sprite and the current one otherwise", () => {
    const pikachu = makePokemon();
    expect(cryForSet(pikachu, "ii/crystal")).toBe(pikachu.cries.legacy);
    expect(cryForSet(pikachu, "v/black-white")).toBe(pikachu.cries.legacy);
    expect(cryForSet(pikachu, "vi/x-y")).toBe(pikachu.cries.latest);
    expect(cryForSet(pikachu, "artwork")).toBe(pikachu.cries.latest);
  });

  it("falls back to whichever recording there is", () => {
    const noLegacy = makePokemon({ cries: { latest: "latest.ogg", legacy: null } });
    expect(cryForSet(noLegacy, "ii/crystal")).toBe("latest.ogg");
    const silent = makePokemon({ cries: { latest: null, legacy: null } });
    expect(cryForSet(silent, "artwork")).toBeNull();
  });
});
