import { useEffect, useState } from "react";
import { GEN_SLUGS } from "../utils/generations";

const ITEMS_PER_PAGE_OPTIONS = [20, 40, 60];

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

export const FilterControls = ({
  initialQuery,
  itemsPerPage,
  activeGen,
  onItemsPerPageChange,
  onGenerationChange,
  onSearch,
  isSearchMode,
  onClearSearch,
}: FilterControlsProps) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  // Keep the box in sync with the URL (e.g. on back/forward, on direct link).
  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim().toLowerCase());
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    onClearSearch();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex items-center gap-4 flex-col md:flex-row">
      {/* Search Controls */}
      <div
        className={`flex items-center gap-2 ${
          isSearchMode ? "flex-wrap justify-center" : ""
        }`}
      >
        <label className="text-sm">Search:</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="eg. Meowth"
          className="border-2 px-2 py-1 text-sm bg-white w-40"
        />
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={handleSearch}
            disabled={!searchTerm.trim()}
            aria-label="Search"
            className="px-3 py-2 bg-[#FECB09] disabled:hover:text-black text-black hover:text-white text-sm hover:bg-[#E12025] disabled:opacity-50 disabled:bg-[#FECB09] disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          {isSearchMode && (
            <button
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="px-3 py-[6px] bg-[#E12025] text-white text-sm hover:bg-red-700 cursor-pointer"
            >
              X
            </button>
          )}
        </div>
      </div>

      {!isSearchMode && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">Gen:</label>
            <select
              value={activeGen ?? ""}
              onChange={(e) =>
                onGenerationChange(e.target.value === "" ? null : e.target.value)
              }
              className="border-2 px-2 py-[6px] text-sm bg-white"
            >
              <option value="">any</option>
              {GEN_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {slug.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm flex md:hidden">Per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border-2 px-2 py-[6px] text-sm bg-white"
            >
              {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
