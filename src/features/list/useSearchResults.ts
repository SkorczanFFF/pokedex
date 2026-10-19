import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hydratePokemon } from "@/api/hydrate";
import { allPokemonNamesQuery } from "@/api/queries";
import type { DexEra } from "@/domain/era";
import { matchNames } from "@/domain/search";
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
  } = useQuery(allPokemonNamesQuery);

  const {
    data: pokemon = [],
    isLoading: isSearchLoading,
    error: searchError,
  } = useQuery({
    queryKey: ["search", query, era.maxDexId],
    queryFn: () => {
      const term = query.trim().toLowerCase();
      if (!term) return [];
      const matches = matchNames(allNames, term, era).slice(0, SEARCH_LIMIT);
      // This query retries as a whole, so the records underneath must not.
      return hydratePokemon(queryClient, matches, { retry: false });
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
