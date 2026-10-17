import type { Pokemon, PokemonTypeSlot } from "@/types/pokemon";
import { genOrder, genSlugOf } from "./dex";
import type { DexEra } from "./era";
import { setGame, type SpriteSetId } from "./sprites";

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
export const typesInEra = (
  pokemon: Pokemon,
  era: DexEra
): PokemonTypeSlot[] => {
  const eraOrder = genOrder(era.maxGen);
  let earliest: { order: number; types: PokemonTypeSlot[] } | null = null;

  for (const past of pokemon.past_types ?? []) {
    const slug = genSlugOf(past.generation.name);
    if (slug === null) continue;

    const order = genOrder(slug);
    if (order >= eraOrder && (earliest === null || order < earliest.order)) {
      earliest = { order, types: past.types };
    }
  }

  return earliest?.types ?? pokemon.types;
};

/** A stat as an era had it. The name is a slug, and at era I it can be `special`. */
export interface StatInEra {
  name: string;
  value: number;
}

/** Gen I kept one Special. The split into two arrived with Gen II. */
const SPECIAL = "special";

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
  const applied = new Map<string, { order: number; value: number }>();

  for (const past of pokemon.past_stats ?? []) {
    const slug = genSlugOf(past.generation.name);
    if (slug === null) continue;

    const order = genOrder(slug);
    if (order < eraOrder) continue;

    for (const entry of past.stats) {
      const seen = applied.get(entry.stat.name);
      if (seen === undefined || order < seen.order) {
        applied.set(entry.stat.name, { order, value: entry.base_stat });
      }
    }
  }

  const special = applied.get(SPECIAL);
  const stats: StatInEra[] = [];

  for (const stat of pokemon.stats) {
    const name = stat.stat.name;

    if (special !== undefined) {
      if (name === "special-attack") {
        stats.push({ name: SPECIAL, value: special.value });
        continue;
      }
      if (name === "special-defense") continue;
    }

    stats.push({ name, value: applied.get(name)?.value ?? stat.base_stat });
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
