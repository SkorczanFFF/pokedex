import { describe, expect, it } from "vitest";
import {
  battleStats,
  damageClassInEra,
  damageRange,
  defenceStat,
  firstToMove,
  hitsToKo,
  offenceStat,
  statValue,
} from "./damage";
import { MODERN, RETRO } from "./era";
import type { StatInEra } from "./pokemonView";

const base = (
  hp: number,
  attack: number,
  defense: number,
  specialAttack: number,
  specialDefense: number,
  speed: number,
): StatInEra[] => [
  { name: "hp", value: hp },
  { name: "attack", value: attack },
  { name: "defense", value: defense },
  { name: "special-attack", value: specialAttack },
  { name: "special-defense", value: specialDefense },
  { name: "speed", value: speed },
];

const pikachu = base(35, 55, 40, 50, 50, 90);
const gyarados = base(95, 125, 79, 60, 100, 81);

describe("battleStats", () => {
  it("grows a base stat with full IVs, no EVs and a neutral nature since Gen III", () => {
    expect(battleStats(pikachu, 50, MODERN)).toEqual(base(110, 75, 60, 70, 70, 110));
    expect(statValue(battleStats(gyarados, 50, MODERN), "hp")).toBe(170);
    expect(statValue(battleStats(gyarados, 50, MODERN), "special-defense")).toBe(120);
  });

  it("grows it with full DVs and no stat experience before, to the same numbers at 50", () => {
    expect(battleStats(pikachu, 50, RETRO)).toEqual(base(110, 75, 60, 70, 70, 110));
    expect(statValue(battleStats(gyarados, 50, RETRO), "hp")).toBe(170);
  });

  it("differs between the formulas away from level 50", () => {
    expect(statValue(battleStats(pikachu, 100, MODERN), "speed")).toBe(216);
    expect(statValue(battleStats(pikachu, 100, RETRO), "speed")).toBe(215);
  });

  it("keeps Shedinja at 1 HP at any level", () => {
    const shedinja = base(1, 90, 45, 30, 30, 40);
    expect(statValue(battleStats(shedinja, 100, MODERN), "hp")).toBe(1);
    expect(statValue(battleStats(shedinja, 5, RETRO), "hp")).toBe(1);
  });
});

describe("damageRange", () => {
  // The CHANGELOG's check against the Showdown calculator: Pikachu's
  // Thunderbolt into Gyarados at level 50, STAB, ×4.
  const hit = { level: 50, attack: 70, defense: 120, stab: true, effectiveness: 4 };

  it("matches the calculator for Thunderbolt at 90 power", () => {
    expect(damageRange({ ...hit, power: 90 })).toEqual({ min: 124, max: 148 });
  });

  it("matches it again for Crystal's 95 power", () => {
    expect(damageRange({ ...hit, power: 95 })).toEqual({ min: 132, max: 156 });
  });

  it("does nothing without power, against an immunity, or into no defence", () => {
    expect(damageRange({ ...hit, power: null })).toBeNull();
    expect(damageRange({ ...hit, power: 0 })).toBeNull();
    expect(damageRange({ ...hit, power: 90, effectiveness: 0 })).toBeNull();
    expect(damageRange({ ...hit, power: 90, defense: 0 })).toBeNull();
  });

  it("lands for at least 1", () => {
    expect(
      damageRange({ level: 1, power: 1, attack: 1, defense: 999, stab: false, effectiveness: 0.25 }),
    ).toEqual({ min: 1, max: 1 });
  });
});

describe("hitsToKo and firstToMove", () => {
  it("counts hits on the lowest and the highest roll", () => {
    expect(hitsToKo(170, { min: 124, max: 148 })).toEqual({ guaranteed: 2, best: 2 });
    expect(hitsToKo(100, { min: 30, max: 60 })).toEqual({ guaranteed: 4, best: 2 });
  });

  it("reads Speed alone", () => {
    expect(firstToMove(110, 81)).toBe("a");
    expect(firstToMove(81, 110)).toBe("b");
    expect(firstToMove(5, 5)).toBe("tie");
  });
});

describe("damageClassInEra", () => {
  it("reads the class off the type through Gen III", () => {
    expect(damageClassInEra({ type: "dark", damageClass: "physical" }, RETRO)).toBe("special");
    expect(damageClassInEra({ type: "flying", damageClass: "special" }, RETRO)).toBe("physical");
    expect(damageClassInEra({ type: "fire", damageClass: "physical" }, RETRO)).toBe("special");
  });

  it("reads the move's own class since", () => {
    expect(damageClassInEra({ type: "dark", damageClass: "physical" }, MODERN)).toBe("physical");
    expect(damageClassInEra({ type: "flying", damageClass: "special" }, MODERN)).toBe("special");
  });

  it("leaves a status move alone in either era", () => {
    expect(damageClassInEra({ type: "fire", damageClass: "status" }, RETRO)).toBe("status");
    expect(damageClassInEra({ type: "fire", damageClass: "status" }, MODERN)).toBe("status");
  });
});

describe("which stat a move reads", () => {
  const split = base(1, 2, 3, 4, 5, 6);
  const single: StatInEra[] = [
    { name: "hp", value: 1 },
    { name: "attack", value: 2 },
    { name: "defense", value: 3 },
    { name: "special", value: 4 },
    { name: "speed", value: 6 },
  ];

  it("names the split pair where there is one", () => {
    expect(offenceStat(split, "physical")).toBe("attack");
    expect(offenceStat(split, "special")).toBe("special-attack");
    expect(defenceStat(split, "special")).toBe("special-defense");
  });

  it("names Gen I's one Special for both sides", () => {
    expect(offenceStat(single, "special")).toBe("special");
    expect(defenceStat(single, "special")).toBe("special");
    expect(defenceStat(single, "physical")).toBe("defense");
  });

  it("reads a value, or 0 for a stat the list lacks", () => {
    expect(statValue(single, "special")).toBe(4);
    expect(statValue(single, "special-attack")).toBe(0);
  });
});
