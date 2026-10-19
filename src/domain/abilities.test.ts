import { describe, expect, it } from "vitest";
import { abilityRule, defaultAbility, hasAbility } from "./abilities";
import { makePokemon } from "./__fixtures__/pokemon";

describe("abilityRule", () => {
  it("answers for the abilities that change a matchup", () => {
    expect(abilityRule("levitate")).toEqual({ takes: [{ types: ["ground"], times: 0 }] });
    expect(abilityRule("thick-fat")).toEqual({ takes: [{ types: ["fire", "ice"], times: 0.5 }] });
    expect(abilityRule("wonder-guard")).toEqual({ onlySuperEffective: true });
    expect(abilityRule("prism-armor")).toEqual({ superEffectiveTaken: 0.75, unbreakable: true });
    expect(abilityRule("mold-breaker")).toEqual({ ignoresDefender: true });
  });

  it("leaves every other ability alone", () => {
    expect(abilityRule("static")).toBeNull();
    expect(abilityRule("huge-power")).toBeNull();
    expect(abilityRule(null)).toBeNull();
    expect(abilityRule(undefined)).toBeNull();
  });
});

describe("a Pokémon's abilities", () => {
  it("assumes the first regular one, by slot", () => {
    expect(defaultAbility(makePokemon())).toBe("static");
    const outOfOrder = makePokemon({
      abilities: [
        { ability: { name: "second" }, is_hidden: false, slot: 2 },
        { ability: { name: "first" }, is_hidden: false, slot: 1 },
      ],
    });
    expect(defaultAbility(outOfOrder)).toBe("first");
  });

  it("falls back to a hidden one when that is all there is", () => {
    const onlyHidden = makePokemon({
      abilities: [{ ability: { name: "imposter" }, is_hidden: true, slot: 3 }],
    });
    expect(defaultAbility(onlyHidden)).toBe("imposter");
    expect(defaultAbility(makePokemon({ abilities: [] }))).toBeNull();
  });

  it("checks a slug against the list", () => {
    expect(hasAbility(makePokemon(), "lightning-rod")).toBe(true);
    expect(hasAbility(makePokemon(), "levitate")).toBe(false);
  });
});
