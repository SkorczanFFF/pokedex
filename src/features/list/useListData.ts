import { useQueryClient } from "@tanstack/react-query";
import { useEra } from "@/era/context";
import { getPokemonDetails, getPokemonList } from "@/api/pokemon";
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
    ? Math.ceil(filtered.names.length / params.perPage)
    : defaultPage.count
    ? Math.ceil(defaultPage.count / params.perPage)
    : 0;

  // Only the live source can be loading — the other two are gated off — so one
  // flag is enough for the view.
  const isLoading =
    defaultPage.isLoading || filtered.isLoading || search.isLoading;

  /** Warms whichever slice the next page will actually come from. */
  const prefetchPage = (page: number) => {
    if (params.isFilterMode) {
      const slice = filtered.names.slice(
        (page - 1) * params.perPage,
        page * params.perPage
      );
      slice.forEach((entry) =>
        queryClient.prefetchQuery({
          queryKey: ["pokemon", entry.name],
          queryFn: () => getPokemonDetails(entry.name),
        })
      );
    } else if (!params.isSearchMode) {
      queryClient.prefetchQuery({
        queryKey: ["pokemonList", page, params.perPage],
        queryFn: () =>
          getPokemonList(params.perPage, (page - 1) * params.perPage),
      });
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
    noSearchMatches: params.isSearchMode && !isLoading && pokemon.length === 0,
    noFilterMatches:
      params.isFilterMode && !isLoading && filtered.names.length === 0,
    hasError: Boolean(defaultPage.error || filtered.error),
    prefetchPage,
  };
};
