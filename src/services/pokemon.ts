import type { Pokemon, PokemonListResponse } from "../types/pokemon";

const API_URL = "https://pokeapi.co/api/v2";

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
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon ${name}`);
  }
  return response.json();
};
