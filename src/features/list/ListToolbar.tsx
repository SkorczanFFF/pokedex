import { useTranslation } from "react-i18next";
import { FilterControls } from "./FilterControls";
import { SearchBox } from "./SearchBox";
import { TypeFilter } from "./TypeFilter";
import {
  activeFilterCount,
  type ListActions,
  type ListParams,
} from "./useListParams";

interface ListToolbarProps {
  params: ListParams;
  actions: ListActions;
  isFiltersOpen: boolean;
  onOpenFilters: () => void;
}

/**
 * Everything above the grid. The two layouts render different trees rather than
 * one reflowed by breakpoints: desktop lays the controls out under the title,
 * while mobile keeps only the search box in reach and folds the rest behind a
 * single button.
 */
export const ListToolbar = ({
  params,
  actions,
  isFiltersOpen,
  onOpenFilters,
}: ListToolbarProps) => {
  const { t } = useTranslation();
  const filterCount = activeFilterCount(params);

  return (
    <>
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
          button. Sticks directly under the fixed navbar, whose height is `--spacing-nav`. */}
      <div className="md:hidden sticky top-nav z-40 -mx-4 mb-6 flex items-center gap-2 bg-dex-bg px-4 py-2">
        <SearchBox
          compact
          initialQuery={params.query}
          isSearchMode={params.isSearchMode}
          onSearch={actions.search}
          onClearSearch={actions.clearSearch}
        />
        <button
          onClick={onOpenFilters}
          aria-expanded={isFiltersOpen}
          className="h-9 shrink-0 px-3 bg-dex-blue text-white text-sm cursor-pointer hover:bg-dex-red"
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
    </>
  );
};
