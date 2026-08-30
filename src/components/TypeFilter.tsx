import { useTranslation } from "react-i18next";
import { TYPE_NAMES, typeClass } from "../utils/types";
import { useTypeLabel } from "../i18n/domain";

interface TypeFilterProps {
  active: string | null;
  onChange: (type: string | null) => void;
}

export const TypeFilter = ({ active, onChange }: TypeFilterProps) => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();

  return (
    <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
      <button
        onClick={() => onChange(null)}
        aria-pressed={active === null}
        className={`px-3 py-1 text-xs cursor-pointer ${
          active === null
            ? "bg-black text-white"
            : "bg-gray-200 text-black hover:bg-gray-300"
        }`}
      >
        {t("filters.all")}
      </button>
      {TYPE_NAMES.map((type) => {
        const isActive = active === type;
        const isFaded = active !== null && !isActive;
        return (
          <button
            key={type}
            onClick={() => onChange(isActive ? null : type)}
            aria-pressed={isActive}
            className={`px-3 py-1 text-xs cursor-pointer ${typeClass(type)} ${
              isActive ? "ring-2 ring-black ring-offset-1" : ""
            } ${isFaded ? "opacity-50 hover:opacity-100" : ""}`}
          >
            {typeLabel(type)}
          </button>
        );
      })}
    </div>
  );
};
