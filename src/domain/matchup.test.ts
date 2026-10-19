import { describe, expect, it } from "vitest";
import { abilityRule } from "./abilities";
import { defensiveProfile, effectiveness, matchup, typingOf } from "./matchup";
import type { PokemonType } from "./pokemonTypes";
import type { Multiplier, TypeChart } from "./typeChart";

/** The corner of the chart these tests need; anything unlisted is neutral. */
const CELLS: Record<string, Multiplier> = {
  "normal>ghost": 0,
  "normal>rock": 0.5,
  "fighting>ghost": 0,
  "fighting>normal": 2,
  "fighting>flying": 0.5,
  "fire>grass": 2,
  "fire>bug": 2,
  "fire>ice": 2,
  "fire>water": 0.5,
  "water>fire": 2,
  "water>water": 0.5,
  "grass>water": 2,
  "grass>flying": 0.5,
  "electric>water": 2,
  "electric>flying": 2,
  "electric>ground": 0,
  "ice>flying": 2,
  "ice>grass": 2,
  "ground>poison": 2,
  "ground>electric": 2,
  "ground>flying": 0,
  "rock>flying": 2,
  "rock>fire": 2,
  "bug>flying": 0.5,
};

const chart: TypeChart = {
  types: [
    "normal", "fire", "water", "electric", "grass", "ice", "fighting",
    "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon",
  ],
  multiplier: (attacker, defender) => CELLS[`${attacker}>${defender}`] ?? 1,
};

const gyarados: PokemonType[] = ["water", "flying"];
const weezing: PokemonType[] = ["poison"];
const shedinja: PokemonType[] = ["bug", "ghost"];

describe("typingOf", () => {
  it("reads slots in order and drops anything that is not a type", () => {
    expect(
      typingOf([
        { slot: 2, type: { name: "flying" } },
        { slot: 1, type: { name: "water" } },
        { slot: 3, type: { name: "???" } },
      ]),
    ).toEqual(["water", "flying"]);
  });
});

describe("effectiveness from the chart alone", () => {
  it("multiplies over the defender's types", () => {
    expect(effectiveness(chart, "electric", gyarados)).toBe(4);
    expect(effectiveness(chart, "grass", gyarados)).toBe(1);
    expect(effectiveness(chart, "ground", gyarados)).toBe(0);
    expect(effectiveness(chart, "fire", gyarados)).toBe(0.5);
  });

  it("lists each of the attacker's types", () => {
    expect(matchup(chart, ["electric"], gyarados)).toEqual([{ attack: "electric", value: 4 }]);
    expect(matchup(chart, ["water", "flying"], ["fire"])).toEqual([
      { attack: "water", value: 2 },
      { attack: "flying", value: 1 },
    ]);
  });
});

describe("effectiveness with abilities (the CHANGELOG's checks)", () => {
  const read = (slug: string) => abilityRule(slug);

  it("Levitate takes Ground to ×0, and Mold Breaker reads through it", () => {
    expect(effectiveness(chart, "ground", weezing, { defender: read("levitate") })).toBe(0);
    expect(
      effectiveness(chart, "ground", weezing, {
        attacker: read("mold-breaker"),
        defender: read("levitate"),
      }),
    ).toBe(2);
  });

  it("Prism Armor holds under Mold Breaker where Filter would not", () => {
    const under = { attacker: read("mold-breaker") };
    expect(effectiveness(chart, "ground", weezing, { ...under, defender: read("filter") })).toBe(2);
    expect(
      effectiveness(chart, "ground", weezing, { ...under, defender: read("prism-armor") }),
    ).toBe(1.5);
  });

  it("Thick Fat halves Fire and Ice and nothing else", () => {
    const snorlax: PokemonType[] = ["normal"];
    const abilities = { defender: read("thick-fat") };
    expect(effectiveness(chart, "fire", snorlax, abilities)).toBe(0.5);
    expect(effectiveness(chart, "ice", snorlax, abilities)).toBe(0.5);
    expect(effectiveness(chart, "water", snorlax, abilities)).toBe(1);
    expect(effectiveness(chart, "fighting", snorlax, abilities)).toBe(2);
  });

  it("Wonder Guard lets only a super-effective hit land", () => {
    const abilities = { defender: read("wonder-guard") };
    expect(effectiveness(chart, "normal", shedinja, abilities)).toBe(0);
    expect(effectiveness(chart, "water", shedinja, abilities)).toBe(0);
    expect(effectiveness(chart, "fire", shedinja, abilities)).toBe(2);
  });

  it("Filter trims a ×2 to 1.5 and leaves a ×½ alone", () => {
    const abilities = { defender: read("filter") };
    expect(effectiveness(chart, "fire", ["grass"], abilities)).toBe(1.5);
    expect(effectiveness(chart, "fire", ["water"], abilities)).toBe(0.5);
  });

  it("Scrappy puts Normal and Fighting through a Ghost", () => {
    expect(effectiveness(chart, "normal", ["ghost"])).toBe(0);
    const abilities = { attacker: read("scrappy") };
    expect(effectiveness(chart, "normal", ["ghost"], abilities)).toBe(1);
    expect(effectiveness(chart, "fighting", ["ghost"], abilities)).toBe(1);
    expect(effectiveness(chart, "normal", ["ghost", "rock"], abilities)).toBe(0.5);
  });

  it("Tinted Lens doubles a weak hit and leaves the rest", () => {
    const abilities = { attacker: read("tinted-lens") };
    expect(effectiveness(chart, "fire", ["water"], abilities)).toBe(1);
    expect(effectiveness(chart, "fire", ["grass"], abilities)).toBe(2);
    expect(effectiveness(chart, "normal", ["ghost"], abilities)).toBe(0);
  });

  it("Dry Skin drinks Water and burns at 1.25 under Fire", () => {
    const abilities = { defender: read("dry-skin") };
    expect(effectiveness(chart, "water", ["normal"], abilities)).toBe(0);
    expect(effectiveness(chart, "fire", ["normal"], abilities)).toBe(1.25);
  });
});

describe("defensiveProfile", () => {
  it("groups every type of the era by what it does, weaknesses first, neutral left out", () => {
    expect(defensiveProfile(chart, gyarados)).toEqual([
      { value: 4, attacks: ["electric"] },
      { value: 2, attacks: ["ice", "rock"] },
      { value: 0.5, attacks: ["fire", "water", "fighting", "bug"] },
      { value: 0, attacks: ["ground"] },
    ]);
  });

  it("makes room for the fractions an ability leaves", () => {
    const groups = defensiveProfile(chart, gyarados, { defender: abilityRule("filter") });
    expect(groups.map((group) => group.value)).toEqual([3, 1.5, 0.5, 0]);
  });
});
