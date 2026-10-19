import { useQueryClient } from "@tanstack/react-query";
import { useEra } from "@/app/era/context";
import { pokemonListQuery, pokemonQuery } from "@/api/queries";
import { pageCount, pageSlice } from "@/domain/pagination";
import type { Pokemon } from "@/types/pokemon";
import { useDefaultPage } from "./useDefaultPage";
import { useFilteredPage } from "./useFilteredPage";
import type { ListParams } from "./useListParams";
import { useSearchResults } from "./useSearchResults";

export interface ListData {
  pokemon: Pokemon[];
  totalPages: number;
  /** Matches for the current view, or null while that is still unknown. */
  resultCount: number | null;
  /** Matches for the active filters — what the heading counts. */
  filteredCount: number;
  isSearchCapped: boolean;
  isLoading: boolean;
  noSearchMatches: boolean;
  noFilterMatches: boolean;
  hasError: boolean;
  prefetchPage: (page: number) => void;
}

/**
 * The list has three sources — the plain dex, the filters, the search box — and
 * exactly one of them is live at a time. Each owns its own queries and its own
 * loading and error state; this picks the live one and reduces the three into
 * the single shape the view renders.
 */
export const useListData = (
  params: ListParams,
  { deferDetails }: { deferDetails: boolean }
): ListData => {
  const queryClient = useQueryClient();
  // One read of the era for the whole list; the three sources take it as an
  // argument, so each one declares in its own signature what it narrows.
  const { era } = useEra();
  const defaultPage = useDefaultPage(params, era);
  const filtered = useFilteredPage(params, era, { deferDetails });
  const search = useSearchResults(params, era);

  const pokemon = params.isSearchMode
    ? search.pokemon
    : params.isFilterMode
    ? filtered.pokemon
    : defaultPage.pokemon;

  const totalPages = params.isSearchMode
    ? 0
    : params.isFilterMode
    ? pageCount(filtered.names.length, params.perPage)
    : defaultPage.count
    ? pageCount(defaultPage.count, params.perPage)
    : 0;

  // Only the live source can be loading — the other two are gated off — so one
  // flag is enough for the view. The same holds for failing.
  const isLoading =
    defaultPage.isLoading || filtered.isLoading || search.isLoading;

  const hasError = Boolean(
    defaultPage.error || filtered.error || search.error
  );

  /** Warms whichever slice the next page will actually come from. */
  const prefetchPage = (page: number) => {
    if (params.isFilterMode) {
      pageSlice(filtered.names, page, params.perPage).forEach((entry) =>
        queryClient.prefetchQuery(pokemonQuery(entry.name))
      );
    } else if (!params.isSearchMode) {
      queryClient.prefetchQuery(pokemonListQuery(page, params.perPage));
    }
  };

  return {
    pokemon,
    totalPages,
    resultCount: params.isFilterMode
      ? filtered.isLoadingNames
        ? null
        : filtered.names.length
      : defaultPage.count,
    filteredCount: filtered.names.length,
    isSearchCapped: search.isCapped,
    isLoading,
    // Nothing came back is a different answer from nothing could be fetched,
    // and both used to leave these true: a dropped connection said "No Pokémon
    // found matching …" over the top of the error view.
    noSearchMatches:
      params.isSearchMode && !isLoading && !hasError && pokemon.length === 0,
    noFilterMatches:
      params.isFilterMode &&
      !isLoading &&
      !hasError &&
      filtered.names.length === 0,
    hasError,
    prefetchPage,
  };
};
