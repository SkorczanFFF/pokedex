import type { Pokemon, PokemonTypeSlot } from "@/types/pokemon";
import { GEN_SLUGS, genApiName, genOrder, genSlugOf, type GenSlug } from "./dex";
import type { DexEra, SpriteSetId } from "./era";

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

/**
 * The recording to play. PokéAPI carries two per Pokémon and the legacy one is
 * the Game Boy original, so retro reaches for that. Either falls back to the
 * other: an era with no cry at all is worse than the wrong cry.
 */
export const cryFor = (pokemon: Pokemon, era: DexEra): string | null => {
  const cries = pokemon.cries;
  if (!cries) return null;
  return era.cry === "legacy"
    ? cries.legacy ?? cries.latest
    : cries.latest ?? cries.legacy;
};

/**
 * Which game stands in for each generation. Every generation ships two or three
 * and they are near-identical within one, so this picks the one that reads best:
 * the originals for Gen I, and the last and most refined set for the rest.
 */
const GEN_SPRITE_GAME: Record<GenSlug, string> = {
  i: "red-blue",
  ii: "crystal",
  iii: "emerald",
  iv: "platinum",
  v: "black-white",
  vi: "x-y",
  vii: "ultra-sun-ultra-moon",
  viii: "brilliant-diamond-shining-pearl",
  ix: "scarlet-violet",
};

/** URL for one sprite set, or null when this Pokémon has none there. */
export const spriteUrl = (
  pokemon: Pokemon,
  set: SpriteSetId,
): string | null => {
  if (set === "artwork") {
    return (
      pokemon.sprites.other["official-artwork"].front_default ||
      pokemon.sprites.front_default ||
      null
    );
  }
  const game = GEN_SPRITE_GAME[set];
  return (
    pokemon.sprites.versions?.[genApiName(set)]?.[game]?.front_default ?? null
  );
};

/**
 * The sets this Pokémon actually has, artwork first and then in dex order.
 *
 * Costs nothing: the sprite tree rides along in the /pokemon response we already
 * fetched, so a Pokémon's whole visual history is one render away rather than
 * one request per generation.
 */
export const spriteSets = (pokemon: Pokemon): SpriteSetId[] =>
  (["artwork", ...GEN_SLUGS] as SpriteSetId[]).filter(
    (set) => spriteUrl(pokemon, set) !== null,
  );
