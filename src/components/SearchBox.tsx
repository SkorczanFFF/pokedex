import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

interface SearchBoxProps {
  initialQuery: string;
  isSearchMode: boolean;
  onSearch: (searchTerm: string) => void;
  onClearSearch: () => void;
  /** Sticky-bar variant: label is screen-reader only and the input fills the row. */
  compact?: boolean;
}

export const SearchBox = ({
  initialQuery,
  isSearchMode,
  onSearch,
  onClearSearch,
  compact = false,
}: SearchBoxProps) => {
  const { t } = useTranslation();
  // useId keeps the label association valid when both the desktop and the
  // mobile instance are mounted at once.
  const inputId = useId();
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
    <div
      className={`flex items-center gap-2 ${
        compact ? "flex-1 min-w-0" : isSearchMode ? "flex-wrap justify-center" : ""
      }`}
    >
      <label htmlFor={inputId} className={compact ? "sr-only" : "text-sm"}>
        {t("filters.searchLabel")}
      </label>
      <input
        id={inputId}
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={t("filters.searchPlaceholder")}
        className={`h-9 border-2 px-2 text-sm bg-white ${
          compact ? "flex-1 min-w-0" : "w-40"
        }`}
      />
      <div className="flex items-center gap-2 justify-center">
        <button
          onClick={handleSearch}
          disabled={!searchTerm.trim()}
          aria-label={t("filters.searchAction")}
          className="h-9 px-3 bg-[#FECB09] disabled:hover:text-black text-black hover:text-white text-sm hover:bg-[#E12025] disabled:opacity-50 disabled:bg-[#FECB09] disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
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
            aria-label={t("filters.clearSearch")}
            className="h-9 px-3 bg-[#E12025] text-white text-sm hover:bg-red-700 cursor-pointer"
          >
            X
          </button>
        )}
      </div>
    </div>
  );
};
