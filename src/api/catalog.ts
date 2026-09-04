import type {
  PokemonGenerationResponse,
  PokemonTypeResponse,
} from "@/types/pokemon";
import { get } from "./client";

/** The two endpoints that answer "which Pokémon belong to X" with a name list. */
export const getPokemonByType = (
  typeName: string
): Promise<PokemonTypeResponse> =>
  get<PokemonTypeResponse>(`type/${typeName}`, `Failed to fetch type ${typeName}`);

export const getPokemonByGeneration = (
  generationName: string
): Promise<PokemonGenerationResponse> =>
  get<PokemonGenerationResponse>(
    `generation/${generationName}`,
    `Failed to fetch generation ${generationName}`
  );
