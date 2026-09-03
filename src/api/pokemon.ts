import type { Pokemon, PokemonListResponse } from "@/types/pokemon";
import { API_URL, NotFoundError } from "./client";
import { getDefaultVariety } from "./species";

export const getPokemonList = async (
  limit = 20,
  offset = 0
): Promise<PokemonListResponse> => {
  const response = await fetch(
    `${API_URL}/pokemon?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch Pokemon list");
  }
  return response.json();
};

export const getPokemonDetails = async (name: string): Promise<Pokemon> => {
  const response = await fetch(`${API_URL}/pokemon/${name}`);
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

  const retry = await fetch(`${API_URL}/pokemon/${fallback}`);
  if (!retry.ok) {
    throw new Error(`Failed to fetch Pokemon ${name}`);
  }
  return retry.json();
};

export const getAllPokemonNames = async (): Promise<
  { name: string; url: string }[]
> => {
  const response = await fetch(`${API_URL}/pokemon?limit=2000`);
  if (!response.ok) {
    throw new Error("Failed to fetch all Pokemon names");
  }

  const data: PokemonListResponse = await response.json();
  return data.results;
};
