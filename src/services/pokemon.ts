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

export const searchPokemonBySubstring = async (
  searchTerm: string
): Promise<Pokemon[]> => {
  try {
    const allPokemon = await getAllPokemonNames();

    const matchingPokemon = allPokemon.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matchingPokemon.length === 0) {
      return [];
    }

    const pokemonDetails = await Promise.all(
      matchingPokemon.map((pokemon) => getPokemonDetails(pokemon.name))
    );

    return pokemonDetails;
  } catch {
    console.warn(`Search failed for term: "${searchTerm}"`);
    return [];
  }
};
