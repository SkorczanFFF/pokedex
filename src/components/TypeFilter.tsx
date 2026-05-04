import { TYPE_NAMES, typeClass } from "../utils/types";

interface TypeFilterProps {
  active: string | null;
  onChange: (type: string | null) => void;
}

export const TypeFilter = ({ active, onChange }: TypeFilterProps) => (
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
      All
    </button>
    {TYPE_NAMES.map((t) => {
      const isActive = active === t;
      const isFaded = active !== null && !isActive;
      return (
        <button
          key={t}
          onClick={() => onChange(isActive ? null : t)}
          aria-pressed={isActive}
          className={`px-3 py-1 text-xs cursor-pointer capitalize ${typeClass(
            t
          )} ${isActive ? "ring-2 ring-black ring-offset-1" : ""} ${
            isFaded ? "opacity-50 hover:opacity-100" : ""
          }`}
        >
          {t}
        </button>
      );
    })}
  </div>
);
