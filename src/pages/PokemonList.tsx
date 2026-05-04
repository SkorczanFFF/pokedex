import { useEffect, useLayoutEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  getAllPokemonNames,
  getPokemonByGeneration,
  getPokemonByType,
  getPokemonDetails,
  getPokemonList,
} from "../services/pokemon";
import { PokemonCard } from "../components/PokemonCard";
import { FilterControls } from "../components/FilterControls";
import { Pagination } from "../components/Pagination";
import { SkeletonGrid } from "../components/Skeleton";
import { TypeFilter } from "../components/TypeFilter";
import ErrorView from "../components/ErrorView";
import { isPokemonType } from "../utils/types";
import {
  formatGen,
  genApiName,
  isGenSlug,
} from "../utils/generations";
import type { Pokemon } from "../types/pokemon";

const PER_PAGE_OPTIONS = [20, 40, 60];
const DEFAULT_PER_PAGE = 20;
const SEARCH_LIMIT = 60;

export const PokemonList = () => {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  const currentPage = Math.max(1, Number(params.get("page")) || 1);
  const perRaw = Number(params.get("per"));
  const itemsPerPage = PER_PAGE_OPTIONS.includes(perRaw)
    ? perRaw
    : DEFAULT_PER_PAGE;
  const searchTerm = params.get("q") ?? "";
  const isSearchMode = searchTerm.length > 0;

  const genParam = params.get("gen");
  const activeGen = isGenSlug(genParam) ? genParam : null;
  const isGenMode = !isSearchMode && activeGen !== null;

  const typeParam = params.get("type");
  const activeType = isPokemonType(typeParam) ? typeParam : null;
  const isTypeMode = !isSearchMode && !isGenMode && activeType !== null;

  const update = (patch: Record<string, string | null>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      return next;
    });
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

  // Selecting a value clears the other modes; clearing only nulls itself.
  const handleTypeChange = (t: string | null) => {
    if (t === null) {
      if (activeType === null) return;
      update({ type: null, page: "1" });
    } else {
      update({ type: t, q: null, gen: null, page: "1" });
    }
    window.scrollTo(0, 0);
  };
  const handleGenerationChange = (g: string | null) => {
    if (g === null) {
      if (activeGen === null) return;
      update({ gen: null, page: "1" });
    } else {
      update({ gen: g, q: null, type: null, page: "1" });
    }
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
    enabled: !isSearchMode && !isTypeMode && !isGenMode,
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
    enabled:
      !!pokemonList?.results && !isSearchMode && !isTypeMode && !isGenMode,
  });

  // ── Type filter ─────────────────────────────────────────────
  const {
    data: typeData,
    isLoading: isTypeListLoading,
    error: typeError,
  } = useQuery({
    queryKey: ["typeList", activeType],
    queryFn: () => getPokemonByType(activeType!),
    enabled: isTypeMode,
    staleTime: Infinity,
  });

  const typePageSlice =
    isTypeMode && typeData
      ? typeData.pokemon
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((entry) => entry.pokemon)
      : [];

  const {
    data: typeDetails,
    isLoading: isTypeDetailsLoading,
    error: typeDetailsError,
  } = useQuery({
    queryKey: ["typeDetails", activeType, currentPage, itemsPerPage],
    queryFn: async () =>
      Promise.all(
        typePageSlice.map((p) =>
          queryClient.fetchQuery({
            queryKey: ["pokemon", p.name],
            queryFn: () => getPokemonDetails(p.name),
            staleTime: 1000 * 60 * 5,
          })
        )
      ),
    enabled: isTypeMode && !!typeData,
  });

  // ── Generation filter ───────────────────────────────────────
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

  const genPageSlice =
    isGenMode && genData
      ? genData.pokemon_species.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        )
      : [];

  const {
    data: genDetails,
    isLoading: isGenDetailsLoading,
    error: genDetailsError,
  } = useQuery({
    queryKey: ["genDetails", activeGen, currentPage, itemsPerPage],
    queryFn: async (): Promise<Pokemon[]> => {
      // Some species names 404 on /pokemon/{name} (form-only mons like deoxys).
      // Promise.allSettled lets the page render with the rest. TODO: lazy-resolve
      // via /pokemon-species/{name}.varieties[is_default].
      const settled = await Promise.allSettled(
        genPageSlice.map((p) =>
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
    enabled: isGenMode && !!genData,
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
    : isGenMode
    ? genData
      ? Math.ceil(genData.pokemon_species.length / itemsPerPage)
      : 0
    : isTypeMode
    ? typeData
      ? Math.ceil(typeData.pokemon.length / itemsPerPage)
      : 0
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
    !isSearchMode &&
    !isTypeMode &&
    !isGenMode &&
    (isListLoading || isDetailsLoading);
  const isLoadingType =
    isTypeMode && (isTypeListLoading || isTypeDetailsLoading);
  const isLoadingGen =
    isGenMode && (isGenListLoading || isGenDetailsLoading);
  const isLoadingList = isLoadingDefault || isLoadingType || isLoadingGen;

  const pokemonToDisplay: Pokemon[] = isSearchMode
    ? searchResults
    : isGenMode
    ? genDetails ?? []
    : isTypeMode
    ? typeDetails ?? []
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

  const hasNoMatches =
    isSearchMode && !isSearching && pokemonToDisplay.length === 0;

  const showListError =
    (!isSearchMode &&
      !isTypeMode &&
      !isGenMode &&
      (listError || detailsError)) ||
    (isTypeMode && (typeError || typeDetailsError)) ||
    (isGenMode && (genError || genDetailsError));

  // Pagination prefetch — different fetcher per mode
  const handlePrefetchPage = (page: number) => {
    if (isGenMode && genData) {
      const slice = genData.pokemon_species.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
      );
      slice.forEach((p) =>
        queryClient.prefetchQuery({
          queryKey: ["pokemon", p.name],
          queryFn: () => getPokemonDetails(p.name),
        })
      );
    } else if (isTypeMode && typeData) {
      const slice = typeData.pokemon
        .slice((page - 1) * itemsPerPage, page * itemsPerPage)
        .map((e) => e.pokemon);
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

  return (
    <div className="mx-auto px-4 py-8 xl:max-w-7xl">
      <div className="flex justify-between items-center mb-8 flex-col md:flex-row gap-4 md:gap-0">
        <h1 className="text-2xl">Pokémon List</h1>
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

      {!isSearchMode && (
        <TypeFilter active={activeType} onChange={handleTypeChange} />
      )}

      {isGenMode && genData && !isLoadingList && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          {formatGen(activeGen!)} Pokémon ({genData.pokemon_species.length}{" "}
          total)
        </h2>
      )}

      {isTypeMode && typeData && !isLoadingList && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left capitalize">
          {activeType} Pokémon ({typeData.pokemon.length} total)
        </h2>
      )}

      {isSearchMode && !isSearching && pokemonToDisplay.length > 0 && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          Search Results for "{searchTerm}" ({pokemonToDisplay.length} found
          {pokemonToDisplay.length === SEARCH_LIMIT ? "+" : ""})
        </h2>
      )}

      {hasNoMatches && (
        <div className="text-center text-red-600 py-8">
          <p>
            No Pokémon found matching "{searchTerm}". Please try a different
            search term.
          </p>
        </div>
      )}

      {showListError ? (
        <ErrorView errorType="list" />
      ) : isLoadingList || isSearching ? (
        <SkeletonGrid count={itemsPerPage} />
      ) : (
        !hasNoMatches && (
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
    </div>
  );
};
