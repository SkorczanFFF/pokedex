import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { filteredDetailsQuery, genListQuery, typeListsQuery } from "@/api/queries";
import { isInEra, type DexEra } from "@/domain/era";
import { intersectByName } from "@/domain/intersect";
import { pageSlice } from "@/domain/pagination";
import { typesAvailableIn } from "@/domain/pokemonTypes";
import { resourceIdFromUrl } from "@/domain/resource";
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
  const {
    data: typeLists,
    isLoading: isTypeListLoading,
    error: typeError,
  } = useQuery({ ...typeListsQuery(types), enabled: isTypeMode });

  const {
    data: genData,
    isLoading: isGenListLoading,
    error: genError,
  } = useQuery({ ...genListQuery(gen), enabled: isGenMode });

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

    return intersectByName(lists).filter((entry) =>
      isInEra(resourceIdFromUrl(entry.url), era)
    );
  }, [isTypeMode, isGenMode, typeLists, genData, types, era]);

  const pageNames = pageSlice(names, page, perPage);

  const {
    data: pokemon,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    ...filteredDetailsQuery({ typeKey, gen, page, perPage }, era, pageNames),
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
