import { SearchBox } from "./SearchBox";
import { ListOptions } from "./ListOptions";

interface FilterControlsProps {
  initialQuery: string;
  itemsPerPage: number;
  activeGen: string | null;
  onItemsPerPageChange: (value: number) => void;
  onGenerationChange: (gen: string | null) => void;
  onSearch: (searchTerm: string) => void;
  isSearchMode: boolean;
  onClearSearch: () => void;
}

/** Desktop filter row. On mobile these controls live in FiltersPanel instead. */
export const FilterControls = ({
  initialQuery,
  itemsPerPage,
  activeGen,
  onItemsPerPageChange,
  onGenerationChange,
  onSearch,
  isSearchMode,
  onClearSearch,
}: FilterControlsProps) => (
  <div className="flex items-center gap-4 flex-col md:flex-row">
    <SearchBox
      initialQuery={initialQuery}
      isSearchMode={isSearchMode}
      onSearch={onSearch}
      onClearSearch={onClearSearch}
    />
    {!isSearchMode && (
      <ListOptions
        activeGen={activeGen}
        itemsPerPage={itemsPerPage}
        onGenerationChange={onGenerationChange}
        onItemsPerPageChange={onItemsPerPageChange}
      />
    )}
  </div>
);
