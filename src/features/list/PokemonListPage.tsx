import { useCallback, useState } from "react";
import { FiltersPanel } from "./FiltersPanel";
import { ListResults } from "./ListResults";
import { ListStatus } from "./ListStatus";
import { ListToolbar } from "./ListToolbar";
import { Pagination } from "./Pagination";
import { useListData } from "./useListData";
import {
  activeFilterCount,
  useClampPage,
  useListParams,
} from "./useListParams";
import { useScrollRestore } from "./useScrollRestore";

export const PokemonListPage = () => {
  // The sheet's own state, but three things outside it care: the history mode
  // while it is open, the hydration it defers, and the panel itself.
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const openFilters = useCallback(() => setIsFiltersOpen(true), []);
  const closeFilters = useCallback(() => setIsFiltersOpen(false), []);

  const { params, actions, clampPage } = useListParams({
    replaceHistory: isFiltersOpen,
  });
  const data = useListData(params, { deferDetails: isFiltersOpen });

  useClampPage({ params, totalPages: data.totalPages, clampPage });
  useScrollRestore(data.pokemon.length > 0);

  return (
    <div className="mx-auto px-4 py-8 xl:max-w-7xl">
      <ListToolbar
        params={params}
        actions={actions}
        isFiltersOpen={isFiltersOpen}
        onOpenFilters={openFilters}
      />

      <ListStatus params={params} data={data} />
      <ListResults params={params} data={data} />

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
          hasActiveFilters={activeFilterCount(params) > 0}
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
