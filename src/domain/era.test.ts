import { describe, expect, it } from "vitest";
import {
  DEFAULT_ERA,
  ERAS,
  MODERN,
  RETRO,
  genInEra,
  inForceAt,
  isEraName,
  isInEra,
  newestInEra,
} from "./era";

describe("eras", () => {
  it("names the two eras and nothing else", () => {
    expect(isEraName("modern")).toBe(true);
    expect(isEraName("retro")).toBe(true);
    expect(isEraName("gen-iii")).toBe(false);
    expect(isEraName(null)).toBe(false);
    expect(ERAS.modern).toBe(MODERN);
    expect(ERAS.retro).toBe(RETRO);
    expect(ERAS[DEFAULT_ERA]).toBe(MODERN);
  });

  it("caps retro at Celebi and leaves modern open", () => {
    expect(RETRO.maxGen).toBe("ii");
    expect(RETRO.maxDexId).toBe(251);
    expect(MODERN.maxDexId).toBe(Infinity);
  });

  it("keeps every era rule as a field", () => {
    expect(RETRO.hasAbilities).toBe(false);
    expect(MODERN.hasAbilities).toBe(true);
    expect(RETRO.statFormula).toBe("dv");
    expect(MODERN.statFormula).toBe("iv");
    expect(RETRO.damageClassByType).toBe(true);
    expect(MODERN.damageClassByType).toBe(false);
    expect(RETRO.sprites).toBe("ii/crystal");
    expect(MODERN.sprites).toBe("artwork");
    expect(RETRO.pixelArt).toBe(true);
    expect(MODERN.pixelArt).toBe(false);
  });
});

describe("isInEra and genInEra", () => {
  it("answers for a dex id, forms included", () => {
    expect(isInEra(251, RETRO)).toBe(true);
    expect(isInEra(252, RETRO)).toBe(false);
    expect(isInEra(10001, RETRO)).toBe(false);
    expect(isInEra(10001, MODERN)).toBe(true);
  });

  it("answers for a generation", () => {
    expect(genInEra("i", RETRO)).toBe(true);
    expect(genInEra("ii", RETRO)).toBe(true);
    expect(genInEra("iii", RETRO)).toBe(false);
    expect(genInEra("ix", MODERN)).toBe(true);
  });
});

describe("newestInEra", () => {
  const entries = [
    { game: "red", gen: "i" as const },
    { game: "gold", gen: "ii" as const },
    { game: "silver", gen: "ii" as const },
    { game: "sword", gen: "viii" as const },
    { game: "unknown", gen: null },
  ];

  it("takes the newest entry inside the era, the later one on a tie", () => {
    expect(newestInEra(entries, (e) => e.gen, MODERN)?.game).toBe("sword");
    expect(newestInEra(entries, (e) => e.gen, RETRO)?.game).toBe("silver");
  });

  it("skips what it cannot date and answers undefined when nothing fits", () => {
    expect(newestInEra([entries[4]], (e) => e.gen, MODERN)).toBeUndefined();
    expect(newestInEra([entries[3]], (e) => e.gen, RETRO)).toBeUndefined();
    expect(newestInEra([], (e: { gen: null }) => e.gen, MODERN)).toBeUndefined();
  });
});

describe("inForceAt", () => {
  const dated = [
    { through: 5, value: "through v" },
    { through: 1, value: "through ii" },
    { through: null, value: "undated" },
  ];

  it("takes the earliest entry still reaching the target", () => {
    expect(inForceAt(dated, (e) => e.through, 0)?.value).toBe("through ii");
    expect(inForceAt(dated, (e) => e.through, 1)?.value).toBe("through ii");
    expect(inForceAt(dated, (e) => e.through, 2)?.value).toBe("through v");
    expect(inForceAt(dated, (e) => e.through, 5)?.value).toBe("through v");
  });

  it("answers undefined past the last dated entry, so today's value stands", () => {
    expect(inForceAt(dated, (e) => e.through, 6)).toBeUndefined();
    expect(inForceAt([], (e: { through: number }) => e.through, 0)).toBeUndefined();
  });
});
