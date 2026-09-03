import { useTranslation } from "react-i18next";
import { MAX_TYPES, TYPE_NAMES, typeClass } from "@/domain/types";
import { useTypeLabel } from "../i18n/domain";

interface TypeFilterProps {
  active: readonly string[];
  onToggle: (type: string) => void;
  onClear: () => void;
}

export const TypeFilter = ({ active, onToggle, onClear }: TypeFilterProps) => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();
  const atLimit = active.length >= MAX_TYPES;

  return (
    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
      <button
        onClick={onClear}
        aria-pressed={active.length === 0}
        className={`px-3 py-1 text-xs cursor-pointer ${
          active.length === 0
            ? "bg-black text-white"
            : "bg-gray-200 text-black hover:bg-gray-300"
        }`}
      >
        {t("filters.all")}
      </button>
      {TYPE_NAMES.map((type) => {
        const isActive = active.includes(type);
        // Types combine with AND, and no Pokémon has three types — so once two
        // are picked the rest are dead ends and get disabled rather than
        // silently producing an empty list.
        const isDisabled = !isActive && atLimit;
        const isFaded = !isActive && active.length > 0;
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            disabled={isDisabled}
            aria-pressed={isActive}
            title={isDisabled ? t("filters.maxTypes", { max: MAX_TYPES }) : undefined}
            className={`px-3 py-1 text-xs ${typeClass(type)} ${
              isActive ? "ring-2 ring-black ring-offset-1" : ""
            } ${
              isDisabled
                ? "opacity-30 cursor-not-allowed"
                : `cursor-pointer ${isFaded ? "opacity-50 hover:opacity-100" : ""}`
            }`}
          >
            {typeLabel(type)}
          </button>
        );
      })}
    </div>
  );
};
