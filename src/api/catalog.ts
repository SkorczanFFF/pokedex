import type {
  PokemonGenerationResponse,
  PokemonTypeResponse,
} from "@/types/pokemon";
import { API_URL } from "./client";

/** The two endpoints that answer "which Pokémon belong to X" with a name list. */
export const getPokemonByType = async (
  typeName: string
): Promise<PokemonTypeResponse> => {
  const response = await fetch(`${API_URL}/type/${typeName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch type ${typeName}`);
  }
  return response.json();
};

export const getPokemonByGeneration = async (
  generationName: string
): Promise<PokemonGenerationResponse> => {
  const response = await fetch(`${API_URL}/generation/${generationName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch generation ${generationName}`);
  }
  return response.json();
};
