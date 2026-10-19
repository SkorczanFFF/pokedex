import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "@/components/Dropdown";
import { SELECT } from "@/components/buttons";
import { gensUpTo } from "@/domain/dex";
import { useEra } from "@/app/era/context";
import { PER_PAGE_OPTIONS } from "@/domain/pagination";

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
  const { era } = useEra();
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
        <Dropdown
          id={genId}
          fit
          value={activeGen ?? ""}
          onChange={(gen) => onGenerationChange(gen === "" ? null : gen)}
          items={[
            { value: "", label: t("gen.any") },
            ...gensUpTo(era.maxGen).map((slug) => ({ value: slug, label: slug.toUpperCase() })),
          ]}
          className="text-sm"
          boxClassName={SELECT}
        />
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
        <Dropdown
          id={perPageId}
          fit
          value={String(itemsPerPage)}
          onChange={(perPage) => onItemsPerPageChange(Number(perPage))}
          items={PER_PAGE_OPTIONS.map((option) => ({ value: String(option), label: String(option) }))}
          className="text-sm"
          boxClassName={SELECT}
        />
      </div>
    </div>
  );
};
