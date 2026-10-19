import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hydratePokemon } from "@/api/hydrate";
import { pokemonListQuery } from "@/api/queries";
import { isInEra, type DexEra } from "@/domain/era";
import { resourceIdFromUrl } from "@/domain/resource";
import type { ListParams } from "./useListParams";

/**
 * The unfiltered dex, one page at a time. The index call answers with names
 * only, and a card needs a whole record, so the page is hydrated in a second
 * pass once the names are in.
 *
 * The era narrows what is on the page rather than what is fetched: the index is
 * the same request either way, so both eras share one cache entry for it and
 * switching modes costs nothing.
 */
export const useDefaultPage = (
  { page, perPage, isSearchMode, isFilterMode }: ListParams,
  era: DexEra
) => {
  const queryClient = useQueryClient();
  const enabled = !isSearchMode && !isFilterMode;

  const {
    data: list,
    isLoading: isListLoading,
    error: listError,
  } = useQuery({ ...pokemonListQuery(page, perPage), enabled });

  const names = (list?.results ?? []).filter((entry) =>
    isInEra(resourceIdFromUrl(entry.url), era)
  );

  const {
    data: pokemon,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["pokemonDetails", page, perPage, era.maxDexId],
    queryFn: () => hydratePokemon(queryClient, names),
    enabled: !!list?.results && enabled,
  });

  return {
    pokemon: pokemon ?? [],
    /** Size of the dex in this era, which is what the pagination is measured against. */
    count: list ? Math.min(list.count, era.maxDexId) : null,
    isLoading: enabled && (isListLoading || isDetailsLoading),
    error: enabled ? listError ?? detailsError : null,
  };
};
