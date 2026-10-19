import { describe, expect, it } from "vitest";
import { ERAS, MODERN, RETRO, isEraName } from "./era";

describe("eras", () => {
  it("names the two eras and nothing else", () => {
    expect(isEraName("modern")).toBe(true);
    expect(isEraName("retro")).toBe(true);
    expect(isEraName("gen-iii")).toBe(false);
    expect(isEraName(null)).toBe(false);
    expect(ERAS.modern).toBe(MODERN);
    expect(ERAS.retro).toBe(RETRO);
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
  });
});
