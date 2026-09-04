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
 * error view instead, which is what an outage should look like.
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

export const getPokemonSpecies = (id: number): Promise<PokemonSpecies> =>
  get<PokemonSpecies>(`pokemon-species/${id}`, `Failed to fetch species ${id}`);
