import type { PokemonGenerationResponse } from "@/types/pokemon";
import { get } from "./client";

/**
 * Which species a generation introduced, as a name list. The other membership
 * list — a type's Pokémon — rides on `/type/{name}` with the damage relations,
 * so `getType` answers for both.
 */
export const getPokemonByGeneration = (
  generationName: string
): Promise<PokemonGenerationResponse> =>
  get<PokemonGenerationResponse>(
    `generation/${generationName}`,
    `Failed to fetch generation ${generationName}`
  );
