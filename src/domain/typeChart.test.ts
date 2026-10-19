import { describe, expect, it } from "vitest";
import type { DamageRelations, TypeResource } from "@/types/typeResource";
import { chartChanges, relationsIn, typeChart } from "./typeChart";

const relations = (partial: Partial<DamageRelations> = {}): DamageRelations => ({
  no_damage_to: [],
  half_damage_to: [],
  double_damage_to: [],
  no_damage_from: [],
  half_damage_from: [],
  double_damage_from: [],
  ...partial,
});

const named = (...names: string[]) => names.map((name) => ({ name }));

const resource = (
  name: string,
  today: DamageRelations,
  past: { through: string; relations: DamageRelations }[] = [],
): TypeResource => ({
  name,
  pokemon: [],
  generation: { name: "generation-i" },
  damage_relations: today,
  past_damage_relations: past.map((entry) => ({
    generation: { name: `generation-${entry.through}` },
    damage_relations: entry.relations,
  })),
});

/**
 * Ghost as PokéAPI dates it: through Gen I it did nothing to Psychic (the
 * game's bug), through Gen V Steel still resisted it, and today it is ×2 on
 * Psychic and resisted only by Dark.
 */
const ghost = resource(
  "ghost",
  relations({ double_damage_to: named("psychic", "ghost"), half_damage_to: named("dark") }),
  [
    {
      through: "i",
      relations: relations({ no_damage_to: named("psychic"), double_damage_to: named("ghost") }),
    },
    {
      through: "v",
      relations: relations({
        double_damage_to: named("psychic", "ghost"),
        half_damage_to: named("steel", "dark"),
      }),
    },
  ],
);
const psychic = resource(
  "psychic",
  relations({ double_damage_to: named("fighting", "poison"), half_damage_to: named("psychic") }),
);
const normal = resource(
  "normal",
  relations({ no_damage_to: named("ghost"), half_damage_to: named("rock", "steel") }),
);
const types = [ghost, psychic, normal];

describe("relationsIn", () => {
  it("takes the earliest dated set still in force, else today's", () => {
    expect(relationsIn(ghost, "i").no_damage_to).toEqual(named("psychic"));
    expect(relationsIn(ghost, "iii").half_damage_to).toEqual(named("steel", "dark"));
    expect(relationsIn(ghost, "v").half_damage_to).toEqual(named("steel", "dark"));
    expect(relationsIn(ghost, "ix").half_damage_to).toEqual(named("dark"));
    expect(relationsIn(normal, "i")).toBe(normal.damage_relations);
  });
});

describe("typeChart", () => {
  it("lists only the types that existed and were fetched, in dex order", () => {
    expect(typeChart(types, "i").types).toEqual(["normal", "psychic", "ghost"]);
  });

  it("reads each cell as of the generation", () => {
    expect(typeChart(types, "i").multiplier("ghost", "psychic")).toBe(0);
    expect(typeChart(types, "ii").multiplier("ghost", "psychic")).toBe(2);
    expect(typeChart(types, "ix").multiplier("normal", "ghost")).toBe(0);
    expect(typeChart(types, "ix").multiplier("psychic", "psychic")).toBe(0.5);
    expect(typeChart(types, "ix").multiplier("psychic", "ghost")).toBe(1);
  });

  it("answers neutral for an attacker it never fetched", () => {
    expect(typeChart(types, "ix").multiplier("dark", "psychic")).toBe(1);
  });
});

describe("chartChanges", () => {
  it("finds every cell that read differently on the way to today", () => {
    expect(chartChanges(types, "ix")).toEqual([
      { attacker: "ghost", defender: "psychic", through: "i", from: 0, to: 2 },
      { attacker: "ghost", defender: "steel", through: "v", from: 0.5, to: 1 },
    ]);
  });

  it("stops at the generation asked for", () => {
    expect(chartChanges(types, "ii")).toEqual([
      { attacker: "ghost", defender: "psychic", through: "i", from: 0, to: 2 },
    ]);
    expect(chartChanges(types, "i")).toEqual([]);
  });
});
