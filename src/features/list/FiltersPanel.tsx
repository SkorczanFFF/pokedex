import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ACTION_LG, GHOST } from "@/components/buttons";
import { useEscape } from "@/features/shared/useEscape";
import { ListOptions } from "./ListOptions";
import { TypeFilter } from "./TypeFilter";
import {
  activeFilterCount,
  type ListActions,
  type ListParams,
} from "./useListParams";

/**
 * Mobile filter sheet. Drops under the navbar and is only as tall as its
 * content, scrolling internally once it would run past the viewport.
 *
 * Changes apply to the URL immediately, the same way the desktop controls do —
 * the list page just holds back the expensive detail fetch until this closes.
 */
export const FiltersPanel = ({
  params,
  actions,
  resultCount,
  onClose,
}: {
  params: ListParams;
  actions: ListActions;
  /** Live match count, or null while it is still unknown. */
  resultCount: number | null;
  onClose: () => void;
}) => {
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
            activeGen={params.gen}
            itemsPerPage={params.perPage}
            onGenerationChange={actions.setGen}
            onItemsPerPageChange={actions.setPerPage}
          />

          <div>
            <h2 className="text-sm mb-3">{t("filters.typeHeading")}</h2>
            <TypeFilter
              active={params.types}
              onToggle={actions.toggleType}
              onClear={actions.clearTypes}
            />
          </div>
        </div>

        <div className="flex gap-2 p-4 bg-white shrink-0">
          <button
            onClick={actions.clearAll}
            disabled={activeFilterCount(params) === 0}
            className={GHOST}
          >
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
