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
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getPokemonByGeneration, getPokemonByType } from "@/api/catalog";
import {
  getAllPokemonNames,
  getPokemonDetails,
  getPokemonList,
} from "@/api/pokemon";
import { PokemonCard } from "../components/PokemonCard";
import { FilterControls } from "../components/FilterControls";
import { Pagination } from "../components/Pagination";
import { SkeletonGrid } from "../components/Skeleton";
import { TypeFilter } from "../components/TypeFilter";
import { SearchBox } from "../components/SearchBox";
import { FiltersPanel } from "../components/FiltersPanel";
import ErrorView from "../components/ErrorView";
import { MAX_TYPES, parseTypes, serializeTypes } from "@/domain/types";
import { intersectByName } from "@/domain/intersect";
import { genApiName, genRoman, isGenSlug } from "@/domain/dex";
import { DEFAULT_PER_PAGE, isPerPage } from "@/domain/pagination";
import { useTypeLabel } from "../i18n/domain";
import type { Pokemon } from "../types/pokemon";

const SEARCH_LIMIT = 60;

export const PokemonList = () => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  const currentPage = Math.max(1, Number(params.get("page")) || 1);
  const perRaw = Number(params.get("per"));
  const itemsPerPage = isPerPage(perRaw) ? perRaw : DEFAULT_PER_PAGE;
  const searchTerm = params.get("q") ?? "";
  const isSearchMode = searchTerm.length > 0;

  const genParam = params.get("gen");
  const activeGen = isGenSlug(genParam) ? genParam : null;

  const typeParam = params.get("type");
  const activeTypes = useMemo(() => parseTypes(typeParam), [typeParam]);
  // Stable scalar for query keys — activeTypes is a fresh array on every parse.
  const typeKey = activeTypes.join(",");

  const isTypeMode = !isSearchMode && activeTypes.length > 0;
  const isGenMode = !isSearchMode && activeGen !== null;
  const isFilterMode = isTypeMode || isGenMode;

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setIsFiltersOpen(false), []);

  // A filtering session in the mobile panel should leave one history entry, not
  // one per tap — so updates made while it is open replace instead of pushing.
  const update = (patch: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v === null || v === "") next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: isFiltersOpen }
    );
  };

  const handlePageChange = (n: number) => {
    update({ page: String(n) });
    window.scrollTo(0, 0);
  };
  const handleItemsPerPageChange = (n: number) => {
    update({ per: String(n), page: "1" });
    window.scrollTo(0, 0);
  };
  const handleSearch = (q: string) =>
    update({ q, type: null, gen: null, page: null });
  const handleClearSearch = () => update({ q: null, page: "1" });

  // Types combine with AND and cap at MAX_TYPES; gen combines on top of them,
  // and clearing one never touches the other.
  const handleTypeToggle = (type: string) => {
    const next = (activeTypes as readonly string[]).includes(type)
      ? activeTypes.filter((active) => active !== type)
      : [...activeTypes, type];
    if (next.length > MAX_TYPES) return;
    update({ type: serializeTypes(next), q: null, page: "1" });
    window.scrollTo(0, 0);
  };

  const handleTypesClear = () => {
    if (activeTypes.length === 0) return;
    update({ type: null, page: "1" });
    window.scrollTo(0, 0);
  };
  const handleGenerationChange = (g: string | null) => {
    if (g === null) {
      if (activeGen === null) return;
      update({ gen: null, page: "1" });
    } else {
      update({ gen: g, q: null, page: "1" });
    }
    window.scrollTo(0, 0);
  };

  const handleClearAll = () => {
    if (activeTypes.length === 0 && activeGen === null) return;
    update({ type: null, gen: null, page: "1" });
    window.scrollTo(0, 0);
  };

  // ── Default paged list ──────────────────────────────────────
  const {
    data: pokemonList,
    isLoading: isListLoading,
    error: listError,
  } = useQuery({
    queryKey: ["pokemonList", currentPage, itemsPerPage],
    queryFn: () =>
      getPokemonList(itemsPerPage, (currentPage - 1) * itemsPerPage),
    enabled: !isSearchMode && !isFilterMode,
  });

  const {
    data: pokemonDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["pokemonDetails", currentPage, itemsPerPage],
    queryFn: async () => {
      if (!pokemonList?.results) return [];
      return Promise.all(
        pokemonList.results.map((p) => getPokemonDetails(p.name))
      );
    },
    enabled: !!pokemonList?.results && !isSearchMode && !isFilterMode,
  });

  // ── Type lists ──────────────────────────────────────────────
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
        activeTypes.map((type) =>
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

  // ── Generation list ─────────────────────────────────────────
  const {
    data: genData,
    isLoading: isGenListLoading,
    error: genError,
  } = useQuery({
    queryKey: ["genList", activeGen],
    queryFn: () => getPokemonByGeneration(genApiName(activeGen!)),
    enabled: isGenMode,
    staleTime: Infinity,
  });

  // ── Filtered name list — every active type ANDed with the generation ──
  const filteredNames = useMemo<{ name: string }[]>(() => {
    if (isTypeMode && !typeLists) return [];
    if (isGenMode && !genData) return [];

    const lists: { name: string }[][] = [];
    if (isTypeMode && typeLists) {
      for (const list of typeLists) {
        lists.push(list.pokemon.map((entry) => entry.pokemon));
      }
    }
    if (isGenMode && genData) lists.push(genData.pokemon_species);

    return intersectByName(lists);
  }, [isTypeMode, isGenMode, typeLists, genData]);

  const filteredPageNames = filteredNames.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const {
    data: filteredDetails,
    isLoading: isFilteredDetailsLoading,
    error: filteredDetailsError,
  } = useQuery({
    queryKey: [
      "filteredDetails",
      typeKey,
      activeGen,
      currentPage,
      itemsPerPage,
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
    enabled: isFilterMode && filteredPageNames.length > 0 && !isFiltersOpen,
  });

  // ── Search ──────────────────────────────────────────────────
  const { data: allNames = [], isLoading: isAllNamesLoading } = useQuery({
    queryKey: ["allPokemonNames"],
    queryFn: getAllPokemonNames,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async (): Promise<Pokemon[]> => {
      const term = searchTerm.trim().toLowerCase();
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
    enabled: isSearchMode && allNames.length > 0,
  });

  // ── Aggregate ───────────────────────────────────────────────
  const totalPages = isSearchMode
    ? 0
    : isFilterMode
    ? Math.ceil(filteredNames.length / itemsPerPage)
    : pokemonList
    ? Math.ceil(pokemonList.count / itemsPerPage)
    : 0;

  // Clamp out-of-range page once we know the total
  useEffect(() => {
    if (isSearchMode) return;
    if (totalPages > 0 && currentPage > totalPages) {
      update({ page: String(totalPages) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages, currentPage, isSearchMode]);

  const isSearching = isSearchMode && (isAllNamesLoading || isSearchLoading);
  const isLoadingDefault =
    !isSearchMode && !isFilterMode && (isListLoading || isDetailsLoading);
  const isLoadingFilterNames =
    (isTypeMode && isTypeListLoading) || (isGenMode && isGenListLoading);
  const isLoadingFilter =
    isFilterMode && (isLoadingFilterNames || isFilteredDetailsLoading);
  const isLoadingList = isLoadingDefault || isLoadingFilter;

  const pokemonToDisplay: Pokemon[] = isSearchMode
    ? searchResults
    : isFilterMode
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
    isSearchMode && !isSearching && pokemonToDisplay.length === 0;
  const hasNoFilterMatches =
    isFilterMode && !isLoadingFilter && filteredNames.length === 0;

  const showListError =
    (!isSearchMode && !isFilterMode && (listError || detailsError)) ||
    (isFilterMode && (typeError || genError || filteredDetailsError));

  // Pagination prefetch — delegates to the right slice per mode
  const handlePrefetchPage = (page: number) => {
    if (isFilterMode) {
      const slice = filteredNames.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
      );
      slice.forEach((p) =>
        queryClient.prefetchQuery({
          queryKey: ["pokemon", p.name],
          queryFn: () => getPokemonDetails(p.name),
        })
      );
    } else if (!isSearchMode) {
      queryClient.prefetchQuery({
        queryKey: ["pokemonList", page, itemsPerPage],
        queryFn: () => getPokemonList(itemsPerPage, (page - 1) * itemsPerPage),
      });
    }
  };

  // Composed from parts instead of one message per combination — each part is a
  // whole phrase and " · " is punctuation, so this stays translation-safe.
  const filterLabel = [
    isTypeMode
      ? t("list.filterType", {
          types: activeTypes.map(typeLabel).join(", "),
          count: activeTypes.length,
        })
      : "",
    isGenMode ? t("list.filterGen", { gen: genRoman(activeGen!) }) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const activeFilterCount = activeTypes.length + (activeGen ? 1 : 0);
  const resultCount = isFilterMode
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
            initialQuery={searchTerm}
            itemsPerPage={itemsPerPage}
            activeGen={activeGen}
            onItemsPerPageChange={handleItemsPerPageChange}
            onGenerationChange={handleGenerationChange}
            onSearch={handleSearch}
            isSearchMode={isSearchMode}
            onClearSearch={handleClearSearch}
          />
        </div>
      </div>

      {/* Mobile: search stays reachable, everything else sits behind one
          button. Sticks directly under the fixed h-12 navbar. */}
      <div className="md:hidden sticky top-12 z-40 -mx-4 mb-6 flex items-center gap-2 bg-[#eaebf2] px-4 py-2">
        <SearchBox
          compact
          initialQuery={searchTerm}
          isSearchMode={isSearchMode}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
        />
        <button
          onClick={() => setIsFiltersOpen(true)}
          aria-expanded={isFiltersOpen}
          className="h-9 shrink-0 px-3 bg-[#356DB2] text-white text-sm cursor-pointer hover:bg-[#E12025]"
        >
          {activeFilterCount > 0
            ? t("filters.openWithCount", { count: activeFilterCount })
            : t("filters.open")}
        </button>
      </div>

      {!isSearchMode && (
        <div className="hidden md:block mb-8">
          <TypeFilter
            active={activeTypes}
            onToggle={handleTypeToggle}
            onClear={handleTypesClear}
          />
        </div>
      )}

      {isFilterMode && filteredNames.length > 0 && !isLoadingFilter && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          {t("list.filterHeading", {
            label: filterLabel,
            count: filteredNames.length,
          })}
        </h2>
      )}

      {isSearchMode && !isSearching && pokemonToDisplay.length > 0 && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          {t(
            pokemonToDisplay.length === SEARCH_LIMIT
              ? "list.searchResultsCapped"
              : "list.searchResults",
            { query: searchTerm, count: pokemonToDisplay.length }
          )}
        </h2>
      )}

      {hasNoSearchMatches && (
        <div className="text-center text-red-600 py-8">
          <p>{t("list.noSearchMatches", { query: searchTerm })}</p>
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
        <SkeletonGrid count={itemsPerPage} />
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

      {!isSearchMode && totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onPrefetch={handlePrefetchPage}
        />
      )}

      {isFiltersOpen && (
        <FiltersPanel
          activeTypes={activeTypes}
          activeGen={activeGen}
          itemsPerPage={itemsPerPage}
          resultCount={resultCount}
          hasActiveFilters={activeFilterCount > 0}
          onTypeToggle={handleTypeToggle}
          onTypesClear={handleTypesClear}
          onGenerationChange={handleGenerationChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onClearAll={handleClearAll}
          onClose={closeFilters}
        />
      )}
    </div>
  );
};
