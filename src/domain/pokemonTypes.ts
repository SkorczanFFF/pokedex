import { genOrder, type GenSlug } from "./dex";
import type { DexEra } from "./era";

const TYPE_NAMES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonType = (typeof TYPE_NAMES)[number];

export const isPokemonType = (s: string | null): s is PokemonType =>
  s !== null && (TYPE_NAMES as readonly string[]).includes(s);

/** A Pokémon has at most two types, so an AND filter beyond two is always empty. */
export const MAX_TYPES = 2;

/**
 * Types that did not exist in Gen I. Anything missing from this table has been
 * around since the beginning, so an era only ever has to hide these three.
 */
const TYPE_DEBUT: Partial<Record<PokemonType, GenSlug>> = {
  dark: "ii",
  steel: "ii",
  fairy: "vi",
};

/** The types that existed by a generation, in dex order. */
export const typesUpTo = (gen: GenSlug): readonly PokemonType[] =>
  TYPE_NAMES.filter((type) => {
    const debut = TYPE_DEBUT[type];
    return debut === undefined || genOrder(debut) <= genOrder(gen);
  });

/** The types that exist at all in an era — all the filter is allowed to offer. */
export const typesAvailableIn = (era: DexEra): readonly PokemonType[] =>
  typesUpTo(era.maxGen);
