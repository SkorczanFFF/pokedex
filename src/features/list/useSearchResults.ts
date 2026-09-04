import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllPokemonNames, getPokemonDetails } from "@/api/pokemon";
import type { Pokemon } from "@/types/pokemon";
import type { ListParams } from "./useListParams";

/**
 * Substring search runs client-side over the whole name index, so the number of
 * cards it may hydrate is capped rather than paged.
 */
const SEARCH_LIMIT = 60;

export const useSearchResults = ({ query, isSearchMode }: ListParams) => {
  const queryClient = useQueryClient();

  // Fetched once and kept for the session: it is the only thing standing
  // between a keystroke and a result.
  const { data: allNames = [], isLoading: isAllNamesLoading } = useQuery({
    queryKey: ["allPokemonNames"],
    queryFn: getAllPokemonNames,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: pokemon = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async (): Promise<Pokemon[]> => {
      const term = query.trim().toLowerCase();
      if (!term) return [];

      const matches = allNames
        .filter((entry) => entry.name.includes(term))
        .slice(0, SEARCH_LIMIT);

      return Promise.all(
        matches.map((entry) =>
          queryClient.fetchQuery({
            queryKey: ["pokemon", entry.name],
            queryFn: () => getPokemonDetails(entry.name),
            staleTime: 1000 * 60 * 5,
          })
        )
      );
    },
    enabled: isSearchMode && allNames.length > 0,
  });

  return {
    pokemon,
    isLoading: isSearchMode && (isAllNamesLoading || isSearchLoading),
    /** Results hit the cap, so the heading reads "60+" rather than "60". */
    isCapped: pokemon.length === SEARCH_LIMIT,
  };
};
