import type { EvolutionChainResponse } from "@/types/pokemon";
import { apiPath, get } from "./client";

export const getEvolutionChain = (
  id: number
): Promise<EvolutionChainResponse> =>
  get<EvolutionChainResponse>(
    apiPath`evolution-chain/${id}`,
    `Failed to fetch evolution chain ${id}`
  );
