import type { Pokemon, PokemonListResponse } from "@/types/pokemon";
import { get, NotFoundError, request } from "./client";
import { getDefaultVariety } from "./species";

export const getPokemonList = (
  limit = 20,
  offset = 0
): Promise<PokemonListResponse> =>
  get<PokemonListResponse>(
    `pokemon?limit=${limit}&offset=${offset}`,
    "Failed to fetch Pokemon list"
  );

export const getPokemonDetails = async (name: string): Promise<Pokemon> => {
  const response = await request(`pokemon/${name}`);
  if (response.ok) {
    return response.json();
  }
  if (response.status !== 404) {
    throw new Error(`Failed to fetch Pokemon ${name}`);
  }

  // A dozen Pokédex species only ever exist as named forms, so /pokemon/wormadam
  // 404s while /pokemon/wormadam-plant works. Anything holding a species slug —
  // an evolution chain, the generation filter — would otherwise dead-end here,
  // so resolve the species' default variety and retry once.
  const fallback = await getDefaultVariety(name);
  if (!fallback || fallback === name) {
    throw new NotFoundError(`No Pokemon named ${name}`);
  }

  return get<Pokemon>(`pokemon/${fallback}`, `Failed to fetch Pokemon ${name}`);
};

export const getAllPokemonNames = async (): Promise<
  { name: string; url: string }[]
> => {
  const data = await get<PokemonListResponse>(
    "pokemon?limit=2000",
    "Failed to fetch all Pokemon names"
  );
  return data.results;
};
