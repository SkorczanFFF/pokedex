import type { DamageRelations, TypeResource } from "@/types/damage";
import { GEN_SLUGS, genOrder, genSlugOf, type GenSlug } from "./dex";
import { typesUpTo, type PokemonType } from "./pokemonTypes";

/** What an attack of one type does to a Pokémon of another. */
export type Multiplier = 0 | 0.5 | 1 | 2;

/**
 * The relations a type had in a generation.
 *
 * PokéAPI keeps today's relations on the type and each earlier set under
 * `past_damage_relations`, dated by the last generation it was in force. So
 * the set for a generation is the earliest past set still in force then, and
 * today's when none is.
 */
export const relationsIn = (
  type: TypeResource,
  gen: GenSlug,
): DamageRelations => {
  const past = type.past_damage_relations
    .map((entry) => ({
      through: genSlugOf(entry.generation.name),
      relations: entry.damage_relations,
    }))
    .filter(
      (entry): entry is { through: GenSlug; relations: DamageRelations } =>
        entry.through !== null && genOrder(entry.through) >= genOrder(gen),
    )
    .sort((a, b) => genOrder(a.through) - genOrder(b.through));
  return past[0]?.relations ?? type.damage_relations;
};

/** The damage an attack of `relations`' type does to a `defender`. */
const multiplierTo = (
  relations: DamageRelations,
  defender: string,
): Multiplier => {
  if (relations.no_damage_to.some((t) => t.name === defender)) return 0;
  if (relations.half_damage_to.some((t) => t.name === defender)) return 0.5;
  if (relations.double_damage_to.some((t) => t.name === defender)) return 2;
  return 1;
};

export interface TypeChart {
  /** The types that existed, in dex order: rows and columns both. */
  types: readonly PokemonType[];
  /** What an attack of one type does to a Pokémon of another. */
  multiplier: (attacker: PokemonType, defender: PokemonType) => Multiplier;
}

/**
 * The chart as of a generation: only the types that existed by then, each
 * with the relations it had then.
 */
export const typeChart = (types: TypeResource[], gen: GenSlug): TypeChart => {
  const byName = new Map(types.map((type) => [type.name, type]));
  const existing = typesUpTo(gen).filter((name) => byName.has(name));
  const rows = new Map(
    existing.map((name) => [name, relationsIn(byName.get(name)!, gen)]),
  );
  return {
    types: existing,
    multiplier: (attacker, defender) => {
      const relations = rows.get(attacker);
      return relations ? multiplierTo(relations, defender) : 1;
    },
  };
};

/** One cell that read differently in an earlier generation. */
export interface ChartChange {
  attacker: PokemonType;
  defender: PokemonType;
  /** The last generation the old value was in force. */
  through: GenSlug;
  from: Multiplier;
  to: Multiplier;
}

/**
 * Every cell that changed on the way to `gen`, oldest first: what it was,
 * through which generation, and what it became the generation after.
 *
 * Read from the dated sets rather than listed, so the four Gen I quirks —
 * Ice did nothing special to Fire, Bug and Poison hit each other hard, and
 * Psychic took nothing from Ghost, a bug in the game — and the Gen VI change
 * that stopped Steel resisting Ghost and Dark all come out of the same walk.
 * A type that did not exist yet has no cell to have changed.
 */
export const chartChanges = (
  types: TypeResource[],
  gen: GenSlug,
): ChartChange[] => {
  const changes: ChartChange[] = [];
  for (const type of types) {
    const attacker = type.name as PokemonType;
    for (const entry of type.past_damage_relations) {
      const through = genSlugOf(entry.generation.name);
      if (!through || genOrder(through) >= genOrder(gen)) continue;
      const next = GEN_SLUGS[genOrder(through) + 1];
      const after = relationsIn(type, next);
      for (const defender of typesUpTo(through)) {
        const from = multiplierTo(entry.damage_relations, defender);
        const to = multiplierTo(after, defender);
        if (from !== to) changes.push({ attacker, defender, through, from, to });
      }
    }
  }
  const order = (name: PokemonType) => typesUpTo(gen).indexOf(name);
  return changes.sort(
    (a, b) =>
      genOrder(a.through) - genOrder(b.through) ||
      order(a.attacker) - order(b.attacker) ||
      order(a.defender) - order(b.defender),
  );
};
