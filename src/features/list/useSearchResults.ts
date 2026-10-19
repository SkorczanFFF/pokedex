import { useQuery } from "@tanstack/react-query";
import { allPokemonNamesQuery, searchQuery } from "@/api/queries";
import type { DexEra } from "@/domain/era";
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
    ...searchQuery(query, era, allNames, SEARCH_LIMIT),
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
