import { useId } from "react";
import { useTranslation } from "react-i18next";
import { GEN_SLUGS } from "../utils/generations";
import { PER_PAGE_OPTIONS } from "../utils/pagination";

interface ListOptionsProps {
  activeGen: string | null;
  itemsPerPage: number;
  onGenerationChange: (gen: string | null) => void;
  onItemsPerPageChange: (value: number) => void;
  /** Panel variant: controls stack and both labels stay visible. */
  stacked?: boolean;
}

export const ListOptions = ({
  activeGen,
  itemsPerPage,
  onGenerationChange,
  onItemsPerPageChange,
  stacked = false,
}: ListOptionsProps) => {
  const { t } = useTranslation();
  const genId = useId();
  const perPageId = useId();

  return (
    <div
      className={
        stacked ? "flex flex-col gap-4" : "flex items-center gap-4"
      }
    >
      <div className="flex items-center gap-2">
        <label htmlFor={genId} className="text-sm">
          {t("filters.genLabel")}
        </label>
        <select
          id={genId}
          value={activeGen ?? ""}
          onChange={(e) =>
            onGenerationChange(e.target.value === "" ? null : e.target.value)
          }
          className="h-9 border-2 px-2 text-sm bg-white"
        >
          <option value="">{t("gen.any")}</option>
          {GEN_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {slug.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        {/* Inline variant hides the label on desktop, where the control sits
            next to the Gen select — but it stays available to screen readers. */}
        <label
          htmlFor={perPageId}
          className={stacked ? "text-sm" : "text-sm md:sr-only"}
        >
          {t("filters.perPageLabel")}
        </label>
        <select
          id={perPageId}
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="h-9 border-2 px-2 text-sm bg-white"
        >
          {PER_PAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
