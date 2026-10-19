import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { DANGER, INPUT } from "@/components/buttons";

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
        compact
          ? "flex-1 min-w-0"
          : isSearchMode
            ? "flex-wrap justify-center"
            : ""
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
        className={`${INPUT} ${compact ? "flex-1 min-w-0" : "w-40"}`}
      />
      <div className="flex items-center gap-2 justify-center">
        <button
          onClick={handleSearch}
          disabled={!searchTerm.trim()}
          aria-label={t("filters.searchAction")}
          className="h-9 px-3 bg-dex-yellow disabled:hover:text-black text-black hover:text-white text-sm hover:bg-dex-red disabled:opacity-50 disabled:bg-dex-yellow disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
        >
          {">"}
        </button>
        {isSearchMode && (
          <button
            onClick={handleClearSearch}
            aria-label={t("filters.clearSearch")}
            className={DANGER}
          >
            X
          </button>
        )}
      </div>
    </div>
  );
};
