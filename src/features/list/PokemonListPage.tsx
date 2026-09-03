import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { getPokemonByGeneration, getPokemonByType } from "@/api/catalog";
import {
  getAllPokemonNames,
  getPokemonDetails,
  getPokemonList,
} from "@/api/pokemon";
import { PokemonCard } from "./PokemonCard";
import { FilterControls } from "./FilterControls";
import { Pagination } from "./Pagination";
import { TypeFilter } from "./TypeFilter";
import { SearchBox } from "./SearchBox";
import { FiltersPanel } from "./FiltersPanel";
import { SkeletonGrid } from "@/components/Skeleton";
import ErrorView from "@/components/ErrorView";
import { intersectByName } from "@/domain/intersect";
import { genApiName, genRoman } from "@/domain/dex";
import { useTypeLabel } from "@/i18n/domain";
import type { Pokemon } from "@/types/pokemon";
import { activeFilterCount, useListParams } from "./useListParams";

const SEARCH_LIMIT = 60;

export const PokemonListPage = () => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setIsFiltersOpen(false), []);

  const { params, actions, clampPage } = useListParams({
    replaceHistory: isFiltersOpen,
  });

  // ── Default paged list ──────────────────────────────────────
  const {
    data: pokemonList,
    isLoading: isListLoading,
    error: listError,
  } = useQuery({
    queryKey: ["pokemonList", params.page, params.perPage],
    queryFn: () =>
      getPokemonList(params.perPage, (params.page - 1) * params.perPage),
    enabled: !params.isSearchMode && !params.isFilterMode,
  });

  const {
    data: pokemonDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["pokemonDetails", params.page, params.perPage],
    queryFn: async () => {
      if (!pokemonList?.results) return [];
      return Promise.all(
        pokemonList.results.map((p) => getPokemonDetails(p.name))
      );
    },
    enabled: !!pokemonList?.results && !params.isSearchMode && !params.isFilterMode,
  });

  // ── Type lists ──────────────────────────────────────────────
  // One request per selected type, each cached under its own ["typeList", type]
  // key so toggling one type reuses whatever the other selection already got.
  const {
    data: typeLists,
    isLoading: isTypeListLoading,
    error: typeError,
  } = useQuery({
    queryKey: ["typeLists", params.typeKey],
    queryFn: () =>
      Promise.all(
        params.types.map((type) =>
          queryClient.fetchQuery({
            queryKey: ["typeList", type],
            queryFn: () => getPokemonByType(type),
            staleTime: Infinity,
          })
        )
      ),
    enabled: params.isTypeMode,
    staleTime: Infinity,
  });

  // ── Generation list ─────────────────────────────────────────
  const {
    data: genData,
    isLoading: isGenListLoading,
    error: genError,
  } = useQuery({
    queryKey: ["genList", params.gen],
    queryFn: () => getPokemonByGeneration(genApiName(params.gen!)),
    enabled: params.isGenMode,
    staleTime: Infinity,
  });

  // ── Filtered name list — every active type ANDed with the generation ──
  const filteredNames = useMemo<{ name: string }[]>(() => {
    if (params.isTypeMode && !typeLists) return [];
    if (params.isGenMode && !genData) return [];

    const lists: { name: string }[][] = [];
    if (params.isTypeMode && typeLists) {
      for (const list of typeLists) {
        lists.push(list.pokemon.map((entry) => entry.pokemon));
      }
    }
    if (params.isGenMode && genData) lists.push(genData.pokemon_species);

    return intersectByName(lists);
  }, [params.isTypeMode, params.isGenMode, typeLists, genData]);

  const filteredPageNames = filteredNames.slice(
    (params.page - 1) * params.perPage,
    params.page * params.perPage
  );

  const {
    data: filteredDetails,
    isLoading: isFilteredDetailsLoading,
    error: filteredDetailsError,
  } = useQuery({
    queryKey: [
      "filteredDetails",
      params.typeKey,
      params.gen,
      params.page,
      params.perPage,
    ],
    queryFn: async (): Promise<Pokemon[]> => {
      // Promise.allSettled because a few species names 404 on /pokemon/{name}
      // (form-only mons like deoxys, wormadam). Failed entries silently drop.
      const settled = await Promise.allSettled(
        filteredPageNames.map((p) =>
          queryClient.fetchQuery({
            queryKey: ["pokemon", p.name],
            queryFn: () => getPokemonDetails(p.name),
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
    enabled: params.isFilterMode && filteredPageNames.length > 0 && !isFiltersOpen,
  });

  // ── Search ──────────────────────────────────────────────────
  const { data: allNames = [], isLoading: isAllNamesLoading } = useQuery({
    queryKey: ["allPokemonNames"],
    queryFn: getAllPokemonNames,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ["search", params.query],
    queryFn: async (): Promise<Pokemon[]> => {
      const term = params.query.trim().toLowerCase();
      if (!term) return [];

      const matches = allNames
        .filter((p) => p.name.includes(term))
        .slice(0, SEARCH_LIMIT);

      return Promise.all(
        matches.map((p) =>
          queryClient.fetchQuery({
            queryKey: ["pokemon", p.name],
            queryFn: () => getPokemonDetails(p.name),
            staleTime: 1000 * 60 * 5,
          })
        )
      );
    },
    enabled: params.isSearchMode && allNames.length > 0,
  });

  // ── Aggregate ───────────────────────────────────────────────
  const totalPages = params.isSearchMode
    ? 0
    : params.isFilterMode
    ? Math.ceil(filteredNames.length / params.perPage)
    : pokemonList
    ? Math.ceil(pokemonList.count / params.perPage)
    : 0;

  // Clamp out-of-range page once we know the total
  useEffect(() => {
    if (params.isSearchMode) return;
    if (totalPages > 0 && params.page > totalPages) {
      clampPage(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, params.page, params.isSearchMode]);

  const isSearching = params.isSearchMode && (isAllNamesLoading || isSearchLoading);
  const isLoadingDefault =
    !params.isSearchMode && !params.isFilterMode && (isListLoading || isDetailsLoading);
  const isLoadingFilterNames =
    (params.isTypeMode && isTypeListLoading) || (params.isGenMode && isGenListLoading);
  const isLoadingFilter =
    params.isFilterMode && (isLoadingFilterNames || isFilteredDetailsLoading);
  const isLoadingList = isLoadingDefault || isLoadingFilter;

  const pokemonToDisplay: Pokemon[] = params.isSearchMode
    ? searchResults
    : params.isFilterMode
    ? filteredDetails ?? []
    : pokemonDetails ?? [];

  const hasData = pokemonToDisplay.length > 0;

  // Restore scroll position when returning from a detail page.
  useLayoutEffect(() => {
    if (restoredRef.current || !hasData) return;
    const y = (location.state as { restoreScroll?: number } | null)
      ?.restoreScroll;
    if (typeof y !== "number") return;

    window.scrollTo(0, y);
    restoredRef.current = true;
    navigate(`${location.pathname}${location.search}`, { replace: true });
  }, [hasData, location, navigate]);

  const hasNoSearchMatches =
    params.isSearchMode && !isSearching && pokemonToDisplay.length === 0;
  const hasNoFilterMatches =
    params.isFilterMode && !isLoadingFilter && filteredNames.length === 0;

  const showListError =
    (!params.isSearchMode && !params.isFilterMode && (listError || detailsError)) ||
    (params.isFilterMode && (typeError || genError || filteredDetailsError));

  // Pagination prefetch — delegates to the right slice per mode
  const handlePrefetchPage = (page: number) => {
    if (params.isFilterMode) {
      const slice = filteredNames.slice(
        (page - 1) * params.perPage,
        page * params.perPage
      );
      slice.forEach((p) =>
        queryClient.prefetchQuery({
          queryKey: ["pokemon", p.name],
          queryFn: () => getPokemonDetails(p.name),
        })
      );
    } else if (!params.isSearchMode) {
      queryClient.prefetchQuery({
        queryKey: ["pokemonList", page, params.perPage],
        queryFn: () => getPokemonList(params.perPage, (page - 1) * params.perPage),
      });
    }
  };

  // Composed from parts instead of one message per combination — each part is a
  // whole phrase and " · " is punctuation, so this stays translation-safe.
  const filterLabel = [
    params.isTypeMode
      ? t("list.filterType", {
          types: params.types.map(typeLabel).join(", "),
          count: params.types.length,
        })
      : "",
    params.isGenMode ? t("list.filterGen", { gen: genRoman(params.gen!) }) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const filterCount = activeFilterCount(params);
  const resultCount = params.isFilterMode
    ? isLoadingFilterNames
      ? null
      : filteredNames.length
    : pokemonList?.count ?? null;

  return (
    <div className="mx-auto px-4 py-8 xl:max-w-7xl">
      <div className="flex justify-between items-center mb-4 md:mb-8 flex-col md:flex-row gap-4 md:gap-0">
        <h1 className="text-2xl">{t("list.title")}</h1>
        <div className="hidden md:block">
          <FilterControls
            initialQuery={params.query}
            itemsPerPage={params.perPage}
            activeGen={params.gen}
            onItemsPerPageChange={actions.setPerPage}
            onGenerationChange={actions.setGen}
            onSearch={actions.search}
            isSearchMode={params.isSearchMode}
            onClearSearch={actions.clearSearch}
          />
        </div>
      </div>

      {/* Mobile: search stays reachable, everything else sits behind one
          button. Sticks directly under the fixed h-12 navbar. */}
      <div className="md:hidden sticky top-12 z-40 -mx-4 mb-6 flex items-center gap-2 bg-[#eaebf2] px-4 py-2">
        <SearchBox
          compact
          initialQuery={params.query}
          isSearchMode={params.isSearchMode}
          onSearch={actions.search}
          onClearSearch={actions.clearSearch}
        />
        <button
          onClick={() => setIsFiltersOpen(true)}
          aria-expanded={isFiltersOpen}
          className="h-9 shrink-0 px-3 bg-[#356DB2] text-white text-sm cursor-pointer hover:bg-[#E12025]"
        >
          {filterCount > 0
            ? t("filters.openWithCount", { count: filterCount })
            : t("filters.open")}
        </button>
      </div>

      {!params.isSearchMode && (
        <div className="hidden md:block mb-8">
          <TypeFilter
            active={params.types}
            onToggle={actions.toggleType}
            onClear={actions.clearTypes}
          />
        </div>
      )}

      {params.isFilterMode && filteredNames.length > 0 && !isLoadingFilter && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          {t("list.filterHeading", {
            label: filterLabel,
            count: filteredNames.length,
          })}
        </h2>
      )}

      {params.isSearchMode && !isSearching && pokemonToDisplay.length > 0 && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          {t(
            pokemonToDisplay.length === SEARCH_LIMIT
              ? "list.searchResultsCapped"
              : "list.searchResults",
            { query: params.query, count: pokemonToDisplay.length }
          )}
        </h2>
      )}

      {hasNoSearchMatches && (
        <div className="text-center text-red-600 py-8">
          <p>{t("list.noSearchMatches", { query: params.query })}</p>
        </div>
      )}

      {hasNoFilterMatches && (
        <div className="text-center text-red-600 py-8">
          {filterLabel && <p className="mb-2">{filterLabel}</p>}
          <p>{t("list.noFilterMatches")}</p>
        </div>
      )}

      {showListError ? (
        <ErrorView errorType="list" />
      ) : isLoadingList || isSearching ? (
        <SkeletonGrid count={params.perPage} />
      ) : (
        !hasNoSearchMatches &&
        !hasNoFilterMatches && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {pokemonToDisplay.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>
        )
      )}

      {!params.isSearchMode && totalPages > 0 && (
        <Pagination
          currentPage={params.page}
          totalPages={totalPages}
          onPageChange={actions.setPage}
          onPrefetch={handlePrefetchPage}
        />
      )}

      {isFiltersOpen && (
        <FiltersPanel
          activeTypes={params.types}
          activeGen={params.gen}
          itemsPerPage={params.perPage}
          resultCount={resultCount}
          hasActiveFilters={filterCount > 0}
          onTypeToggle={actions.toggleType}
          onTypesClear={actions.clearTypes}
          onGenerationChange={actions.setGen}
          onItemsPerPageChange={actions.setPerPage}
          onClearAll={actions.clearAll}
          onClose={closeFilters}
        />
      )}
    </div>
  );
};
