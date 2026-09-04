import { useQuery } from "@tanstack/react-query";
import { getPokemonDetails, getPokemonList } from "@/api/pokemon";
import type { Pokemon } from "@/types/pokemon";
import type { ListParams } from "./useListParams";

/**
 * The unfiltered dex, one page at a time. The index call answers with names
 * only, and a card needs a whole record, so the page is hydrated in a second
 * pass once the names are in.
 */
export const useDefaultPage = ({
  page,
  perPage,
  isSearchMode,
  isFilterMode,
}: ListParams) => {
  const enabled = !isSearchMode && !isFilterMode;

  const {
    data: list,
    isLoading: isListLoading,
    error: listError,
  } = useQuery({
    queryKey: ["pokemonList", page, perPage],
    queryFn: () => getPokemonList(perPage, (page - 1) * perPage),
    enabled,
  });

  const {
    data: pokemon,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["pokemonDetails", page, perPage],
    queryFn: async (): Promise<Pokemon[]> => {
      if (!list?.results) return [];
      return Promise.all(
        list.results.map((entry) => getPokemonDetails(entry.name))
      );
    },
    enabled: !!list?.results && enabled,
  });

  return {
    pokemon: pokemon ?? [],
    /** Size of the whole dex, which is what the pagination is measured against. */
    count: list?.count ?? null,
    isLoading: enabled && (isListLoading || isDetailsLoading),
    error: enabled ? listError ?? detailsError : null,
  };
};
