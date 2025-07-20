import { useState } from "react";

const ITEMS_PER_PAGE_OPTIONS = [20, 40, 60];

interface FilterControlsProps {
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onSearch: (searchTerm: string) => void;
  isSearchMode: boolean;
  onClearSearch: () => void;
}

export const FilterControls = ({
  itemsPerPage,
  onItemsPerPageChange,
  onSearch,
  isSearchMode,
  onClearSearch,
}: FilterControlsProps) => {
  const [searchTerm, setSearchTerm] = useState("");

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
            className="px-3 py-[6px] bg-[#FECB09] disabled:hover:text-black text-black hover:text-white text-sm hover:bg-[#E12025] disabled:opacity-50 disabled:bg-[#FECB09] disabled:cursor-not-allowed cursor-pointer"
          >
            Search
          </button>
          {isSearchMode && (
            <button
              onClick={handleClearSearch}
              className="px-3 py-[6px] bg-[#E12025] text-white text-sm hover:bg-red-700 cursor-pointer"
            >
              X
            </button>
          )}
        </div>
      </div>

      {!isSearchMode && (
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
      )}
    </div>
  );
};
