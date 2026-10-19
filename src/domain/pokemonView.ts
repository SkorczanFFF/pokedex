import type { Pokemon, PokemonTypeSlot } from "@/types/pokemon";
import { genOrder, genOrderOf } from "./dex";
import { inForceAt, type DexEra } from "./era";
import { typingOf } from "./matchup";
import type { PokemonType } from "./pokemonTypes";
import { setGame, type SpriteSetId } from "./sprites";
import { STAT, type StatInEra } from "./stats";

/**
 * The typing a Pokémon had in an era.
 *
 * PokéAPI's `past_types` entries read "these were the types through this
 * generation", so the era's typing is the earliest entry that still covers it.
 * Clefairy's only entry runs through Gen V, so at Gen II it is Normal again;
 * Magnemite's runs through Gen I, so by Gen II it has already gained Steel and
 * keeps it. No entry covering the era means nothing has changed since, and
 * today's types stand.
 *
 * Written without assuming `past_types` arrives in order — the API happens to
 * sort it, but nothing documents that.
 */
export const typesInEra = (pokemon: Pokemon, era: DexEra): PokemonTypeSlot[] =>
  inForceAt(
    pokemon.past_types ?? [],
    (past) => genOrderOf(past.generation.name),
    genOrder(era.maxGen),
  )?.types ?? pokemon.types;

/** The era's typing as type names, in slot order — what the chart is asked about. */
export const typingInEra = (pokemon: Pokemon, era: DexEra): PokemonType[] =>
  typingOf(typesInEra(pokemon, era));

/**
 * The base stats an era actually played with.
 *
 * `past_stats` reads the way `past_types` does — each entry holds what stood
 * *through* the generation it names — with one difference that decides the
 * shape of this function: an entry lists only the stats that changed, so
 * several can cover one era at once and every stat has to find its own earliest
 * covering entry. Pikachu at era I takes its Special from the Gen I entry and
 * its Defence from the Gen V one, because 30 Defence stood from the beginning
 * until Gen VI took it to 40.
 *
 * Where the era has a single Special it replaces the split pair in place, which
 * is also where Gen I printed it: after Defence, before Speed.
 */
export const statsInEra = (pokemon: Pokemon, era: DexEra): StatInEra[] => {
  const eraOrder = genOrder(era.maxGen);
  const past = pokemon.past_stats ?? [];

  /** The value a stat had in the era, or undefined when today's stands. */
  const valueIn = (name: string): number | undefined =>
    inForceAt(
      past.flatMap((entry) =>
        entry.stats
          .filter((stat) => stat.stat.name === name)
          .map((stat) => ({ order: genOrderOf(entry.generation.name), value: stat.base_stat })),
      ),
      (entry) => entry.order,
      eraOrder,
    )?.value;

  const special = valueIn(STAT.special);
  const stats: StatInEra[] = [];

  for (const stat of pokemon.stats) {
    const name = stat.stat.name;

    if (special !== undefined) {
      if (name === STAT.specialAttack) {
        stats.push({ name: STAT.special, value: special });
        continue;
      }
      if (name === STAT.specialDefense) continue;
    }

    stats.push({ name, value: valueIn(name) ?? stat.base_stat });
  }

  return stats;
};

/**
 * The recording to play under a picture.
 *
 * PokéAPI carries two per Pokémon: the one the games have used since X and Y
 * re-recorded them all, and the legacy one from before — the cry a Game Boy
 * or a DS played. So a sprite from Gen I through V comes with the legacy
 * recording, and the artwork or a later sheet with the current one; the Cry
 * button follows whichever picture is up. Either falls back to the other: no
 * cry at all is worse than the wrong cry.
 */
export const cryForSet = (pokemon: Pokemon, set: SpriteSetId): string | null => {
  const cries = pokemon.cries;
  if (!cries) return null;
  const gen = setGame(set)?.gen ?? null;
  const legacy = gen !== null && genOrder(gen) <= genOrder("v");
  return legacy
    ? (cries.legacy ?? cries.latest)
    : (cries.latest ?? cries.legacy);
};
