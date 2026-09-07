import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllPokemonNames, getPokemonDetails } from "@/api/pokemon";
import type { DexEra } from "@/domain/era";
import { resourceIdFromUrl } from "@/domain/resource";
import type { Pokemon } from "@/types/pokemon";
import type { ListParams } from "./useListParams";

/**
 * Substring search runs client-side over the whole name index, so the number of
 * cards it may hydrate is capped rather than paged.
 */
const SEARCH_LIMIT = 60;

export const useSearchResults = (
  { query, isSearchMode }: ListParams,
  era: DexEra
) => {
  const queryClient = useQueryClient();

  // Fetched once and kept for the session: it is the only thing standing
  // between a keystroke and a result.
  const {
    data: allNames = [],
    isLoading: isAllNamesLoading,
    error: allNamesError,
  } = useQuery({
    queryKey: ["allPokemonNames"],
    queryFn: getAllPokemonNames,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: pokemon = [],
    isLoading: isSearchLoading,
    error: searchError,
  } = useQuery({
    queryKey: ["search", query, era.maxDexId],
    queryFn: async (): Promise<Pokemon[]> => {
      const term = query.trim().toLowerCase();
      if (!term) return [];

      const matches = allNames
        .filter(
          (entry) =>
            entry.name.includes(term) &&
            resourceIdFromUrl(entry.url) <= era.maxDexId
        )
        .slice(0, SEARCH_LIMIT);

      return Promise.all(
        matches.map((entry) =>
          queryClient.fetchQuery({
            queryKey: ["pokemon", entry.name],
            queryFn: () => getPokemonDetails(entry.name),
            staleTime: 1000 * 60 * 5,
            // One retry policy per thing the reader is waiting on. Promise.all
            // hands any rejection to this query, which retries on its own, so
            // retrying underneath as well multiplies the wait: three attempts
            // each, three times over, turned a dead connection into the better
            // part of a minute of skeletons before the error appeared.
            retry: false,
          })
        )
      );
    },
    enabled: isSearchMode && allNames.length > 0,
  });

  return {
    pokemon,
    isLoading: isSearchMode && (isAllNamesLoading || isSearchLoading),
    // The name index is fetched whether or not anyone is searching, so its
    // failure is only this source's problem once it actually has a reader.
    error: isSearchMode ? allNamesError ?? searchError : null,
    /** Results hit the cap, so the heading reads "60+" rather than "60". */
    isCapped: pokemon.length === SEARCH_LIMIT,
  };
};
