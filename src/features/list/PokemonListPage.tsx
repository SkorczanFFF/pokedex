import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { PokemonCard } from "./PokemonCard";
import { FilterControls } from "./FilterControls";
import { Pagination } from "./Pagination";
import { TypeFilter } from "./TypeFilter";
import { SearchBox } from "./SearchBox";
import { FiltersPanel } from "./FiltersPanel";
import { SkeletonGrid } from "@/components/Skeleton";
import ErrorView from "@/components/ErrorView";
import { genRoman } from "@/domain/dex";
import { useTypeLabel } from "@/i18n/domain";
import { useListData } from "./useListData";
import { activeFilterCount, useListParams } from "./useListParams";

export const PokemonListPage = () => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();
  const location = useLocation();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setIsFiltersOpen(false), []);

  const { params, actions, clampPage } = useListParams({
    replaceHistory: isFiltersOpen,
  });
  const data = useListData(params, { deferDetails: isFiltersOpen });

  // Clamp out-of-range page once we know the total
  useEffect(() => {
    if (params.isSearchMode) return;
    if (data.totalPages > 0 && params.page > data.totalPages) {
      clampPage(data.totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.totalPages, params.page, params.isSearchMode]);

  const hasData = data.pokemon.length > 0;

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

      {params.isFilterMode && data.filteredCount > 0 && !data.isLoading && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          {t("list.filterHeading", {
            label: filterLabel,
            count: data.filteredCount,
          })}
        </h2>
      )}

      {params.isSearchMode && !data.isLoading && data.pokemon.length > 0 && (
        <h2 className="text-lg font-semibold mb-8 text-center md:text-left">
          {t(
            data.isSearchCapped
              ? "list.searchResultsCapped"
              : "list.searchResults",
            { query: params.query, count: data.pokemon.length }
          )}
        </h2>
      )}

      {data.noSearchMatches && (
        <div className="text-center text-red-600 py-8">
          <p>{t("list.noSearchMatches", { query: params.query })}</p>
        </div>
      )}

      {data.noFilterMatches && (
        <div className="text-center text-red-600 py-8">
          {filterLabel && <p className="mb-2">{filterLabel}</p>}
          <p>{t("list.noFilterMatches")}</p>
        </div>
      )}

      {data.hasError ? (
        <ErrorView errorType="list" />
      ) : data.isLoading ? (
        <SkeletonGrid count={params.perPage} />
      ) : (
        !data.noSearchMatches &&
        !data.noFilterMatches && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.pokemon.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>
        )
      )}

      {!params.isSearchMode && data.totalPages > 0 && (
        <Pagination
          currentPage={params.page}
          totalPages={data.totalPages}
          onPageChange={actions.setPage}
          onPrefetch={data.prefetchPage}
        />
      )}

      {isFiltersOpen && (
        <FiltersPanel
          activeTypes={params.types}
          activeGen={params.gen}
          itemsPerPage={params.perPage}
          resultCount={data.resultCount}
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
