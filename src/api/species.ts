import type { PokemonSpecies } from "@/types/pokemon";
import { get, request } from "./client";

/**
 * Name of the default form behind a species slug, or null if there is no such
 * species. Any failure reads as "no such species" here, because the one caller
 * is already on its fallback path and has a NotFoundError ready either way.
 */
export const getDefaultVariety = async (
  species: string
): Promise<string | null> => {
  const response = await request(`pokemon-species/${species}`);
  if (!response.ok) return null;
  const data: PokemonSpecies = await response.json();
  return data.varieties.find((v) => v.is_default)?.pokemon.name ?? null;
};

export const getPokemonSpecies = (id: number): Promise<PokemonSpecies> =>
  get<PokemonSpecies>(`pokemon-species/${id}`, `Failed to fetch species ${id}`);
