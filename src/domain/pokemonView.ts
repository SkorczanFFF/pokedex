import type { Pokemon, PokemonTypeSlot } from "@/types/pokemon";
import { genOrder, genSlugOf } from "./dex";
import type { DexEra } from "./era";

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
