import type { EvolutionChainResponse } from "@/types/pokemon";
import { get } from "./client";

export const getEvolutionChain = (
  id: number
): Promise<EvolutionChainResponse> =>
  get<EvolutionChainResponse>(
    `evolution-chain/${id}`,
    `Failed to fetch evolution chain ${id}`
  );
