import type { PokemonSpecies } from "@/types/pokemon";
import { API_URL } from "./client";

/** Name of the default form behind a species slug, or null if there is no such species. */
export const getDefaultVariety = async (species: string): Promise<string | null> => {
  const response = await fetch(`${API_URL}/pokemon-species/${species}`);
  if (!response.ok) return null;
  const data: PokemonSpecies = await response.json();
  return data.varieties.find((v) => v.is_default)?.pokemon.name ?? null;
};

export const getPokemonSpecies = async (
  id: number
): Promise<PokemonSpecies> => {
  const response = await fetch(`${API_URL}/pokemon-species/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch species ${id}`);
  }
  return response.json();
};
