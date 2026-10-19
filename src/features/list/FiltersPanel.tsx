import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ACTION_LG, GHOST } from "@/components/buttons";
import { useEscape } from "@/features/shared/useEscape";
import { ListOptions } from "./ListOptions";
import { TypeFilter } from "./TypeFilter";

interface FiltersPanelProps {
  activeTypes: readonly string[];
  activeGen: string | null;
  itemsPerPage: number;
  /** Live match count, or null while it is still unknown. */
  resultCount: number | null;
  hasActiveFilters: boolean;
  onTypeToggle: (type: string) => void;
  onTypesClear: () => void;
  onGenerationChange: (gen: string | null) => void;
  onItemsPerPageChange: (value: number) => void;
  onClearAll: () => void;
  onClose: () => void;
}

/**
 * Mobile filter sheet. Drops under the navbar and is only as tall as its
 * content, scrolling internally once it would run past the viewport.
 *
 * Changes apply to the URL immediately, the same way the desktop controls do —
 * the list page just holds back the expensive detail fetch until this closes.
 */
export const FiltersPanel = ({
  activeTypes,
  activeGen,
  itemsPerPage,
  resultCount,
  hasActiveFilters,
  onTypeToggle,
  onTypesClear,
  onGenerationChange,
  onItemsPerPageChange,
  onClearAll,
  onClose,
}: FiltersPanelProps) => {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEscape(onClose);

  // Focus moves into the sheet and back out; the page behind it stops scrolling.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Footer-coloured scrim. Clicking it closes, same as Esc and the X —
          it is a redundant affordance, so it stays out of the a11y tree. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-gray-800/60"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("filters.title")}
        className="absolute inset-x-0 top-nav flex max-h-[calc(100dvh_-_var(--spacing-nav))] flex-col bg-dex-bg"
      >
        <div className="flex items-center justify-between h-nav px-4 bg-dex-red text-white shrink-0">
          <span className="text-xl font-bold">{t("filters.title")}</span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={t("filters.close")}
            className="px-3 py-1 text-sm cursor-pointer hover:bg-dex-red-dark focus-ring"
          >
            X
          </button>
        </div>

        {/* min-h-0 so this is what shrinks when the sheet hits its max height. */}
        <div className="min-h-0 overflow-y-auto px-4 py-6 space-y-6">
          <ListOptions
            stacked
            activeGen={activeGen}
            itemsPerPage={itemsPerPage}
            onGenerationChange={onGenerationChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />

          <div>
            <h2 className="text-sm mb-3">{t("filters.typeHeading")}</h2>
            <TypeFilter
              active={activeTypes}
              onToggle={onTypeToggle}
              onClear={onTypesClear}
            />
          </div>
        </div>

        <div className="flex gap-2 p-4 bg-white shrink-0">
          <button onClick={onClearAll} disabled={!hasActiveFilters} className={GHOST}>
            {t("filters.clearAll")}
          </button>
          <button onClick={onClose} className={`flex-1 text-sm ${ACTION_LG}`}>
            {resultCount === null
              ? t("filters.showResults")
              : t("filters.showResultsCount", { count: resultCount })}
          </button>
        </div>
      </div>
    </div>
  );
};
