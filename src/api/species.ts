import type { PokemonSpecies } from "@/types/pokemon";
import { get, request } from "./client";

/**
 * Name of the default form behind a species slug, or null if there is no such
 * species.
 *
 * Only a 404 counts as "no such species". Everything else is thrown, because
 * the one caller turns a null into a NotFoundError and that renders the 404
 * page — so swallowing a 500 here told the reader their Pokémon does not
 * exist when the truth was that the API was down. A thrown error reaches the
 * error view instead, and React Query retries it twice — which is what a
 * transient failure deserves and what a genuine 404 must not get.
 */
export const getDefaultVariety = async (
  species: string
): Promise<string | null> => {
  const response = await request(`pokemon-species/${species}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch species ${species}`);
  }
  const data: PokemonSpecies = await response.json();
  return data.varieties.find((v) => v.is_default)?.pokemon.name ?? null;
};

/**
 * Asked for by species name rather than by a Pokémon's id, because those are
 * two different numbers above 1025: a form like `slowpoke-galar` is id 10164
 * and `/pokemon-species/10164` does not exist. Every /pokemon payload carries
 * the name of the species it belongs to, and that always resolves.
 */
export const getPokemonSpecies = (species: string): Promise<PokemonSpecies> =>
  get<PokemonSpecies>(
    `pokemon-species/${species}`,
    `Failed to fetch species ${species}`
  );
