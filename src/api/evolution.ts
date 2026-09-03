import type { EvolutionChainResponse } from "@/types/pokemon";
import { API_URL } from "./client";

export const getEvolutionChain = async (
  id: number
): Promise<EvolutionChainResponse> => {
  const response = await fetch(`${API_URL}/evolution-chain/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch evolution chain ${id}`);
  }
  return response.json();
};
