import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPokemonByGeneration, getPokemonByType } from "@/api/catalog";
import { getPokemonDetails } from "@/api/pokemon";
import { genApiName } from "@/domain/dex";
import type { DexEra } from "@/domain/era";
import { intersectByName } from "@/domain/intersect";
import { typesAvailableIn } from "@/domain/pokemonTypes";
import { resourceIdFromUrl } from "@/domain/resource";
import type { Pokemon } from "@/types/pokemon";
import type { ListParams } from "./useListParams";

/** A membership list entry, as both catalogue endpoints hand it over. */
interface NamedResource {
  name: string;
  url: string;
}

/**
 * Type and generation filters, ANDed together.
 *
 * Neither endpoint pages: both answer with the full membership list. So the
 * narrowing happens here over cached name lists, and only the slice the user is
 * actually looking at gets hydrated into cards. The era narrows the same lists,
 * which is why the two catalogue requests are era-independent and shared.
 */
export const useFilteredPage = (
  {
    page,
    perPage,
    types,
    typeKey,
    gen,
    isTypeMode,
    isGenMode,
    isFilterMode,
  }: ListParams,
  era: DexEra,
  { deferDetails }: { deferDetails: boolean }
) => {
  const queryClient = useQueryClient();

  // One request per selected type, each cached under its own ["typeList", type]
  // key so toggling one type reuses whatever the other selection already got.
  const {
    data: typeLists,
    isLoading: isTypeListLoading,
    error: typeError,
  } = useQuery({
    queryKey: ["typeLists", typeKey],
    queryFn: () =>
      Promise.all(
        types.map((type) =>
          queryClient.fetchQuery({
            queryKey: ["typeList", type],
            queryFn: () => getPokemonByType(type),
            staleTime: Infinity,
          })
        )
      ),
    enabled: isTypeMode,
    staleTime: Infinity,
  });

  const {
    data: genData,
    isLoading: isGenListLoading,
    error: genError,
  } = useQuery({
    queryKey: ["genList", gen],
    queryFn: () => getPokemonByGeneration(genApiName(gen!)),
    enabled: isGenMode,
    staleTime: Infinity,
  });

  /** Every active type ANDed with the generation, then narrowed to the era. */
  const names = useMemo<NamedResource[]>(() => {
    // A type that does not exist in this era cannot match anything in it, so
    // "Fairy in Gen II" is a question with no answer rather than no filter at
    // all. Reachable in one click: select Fairy, then switch to retro.
    const available = typesAvailableIn(era);
    if (types.some((type) => !available.includes(type))) return [];

    if (isTypeMode && !typeLists) return [];
    if (isGenMode && !genData) return [];

    const lists: NamedResource[][] = [];
    if (isTypeMode && typeLists) {
      for (const list of typeLists) {
        lists.push(list.pokemon.map((entry) => entry.pokemon));
      }
    }
    if (isGenMode && genData) lists.push(genData.pokemon_species);

    return intersectByName(lists).filter(
      (entry) => resourceIdFromUrl(entry.url) <= era.maxDexId
    );
  }, [isTypeMode, isGenMode, typeLists, genData, types, era]);

  const pageNames = names.slice((page - 1) * perPage, page * perPage);

  const {
    data: pokemon,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: [
      "filteredDetails",
      typeKey,
      gen,
      page,
      perPage,
      era.maxDexId,
    ],
    queryFn: async (): Promise<Pokemon[]> => {
      // Promise.allSettled because a few species names 404 on /pokemon/{name}
      // (form-only mons like deoxys, wormadam). Failed entries silently drop.
      const settled = await Promise.allSettled(
        pageNames.map((entry) =>
          queryClient.fetchQuery({
            queryKey: ["pokemon", entry.name],
            queryFn: () => getPokemonDetails(entry.name),
            staleTime: 1000 * 60 * 5,
          })
        )
      );
      return settled
        .filter(
          (r): r is PromiseFulfilledResult<Pokemon> => r.status === "fulfilled"
        )
        .map((r) => r.value);
    },
    // Cards hydrate for the selection the user settles on, not for every tap
    // along the way. The URL, the heading and the panel's result count all
    // update live off the cached name lists — this only holds back the per-card
    // requests (and their artwork) for combinations passed through behind the
    // sheet. Measured at ~68% of the requests in a typical two-tap session.
    enabled: isFilterMode && pageNames.length > 0 && !deferDetails,
  });

  const isLoadingNames =
    (isTypeMode && isTypeListLoading) || (isGenMode && isGenListLoading);

  return {
    pokemon: pokemon ?? [],
    names,
    /** The count is known from the name lists alone, before any card is fetched. */
    isLoadingNames,
    isLoading: isFilterMode && (isLoadingNames || isDetailsLoading),
    error: isFilterMode ? typeError ?? genError ?? detailsError : null,
  };
};
