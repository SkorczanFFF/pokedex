import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { typeClass } from "@/domain/pokemonTypes";
import { typesInEra } from "@/domain/pokemonView";
import { useEra } from "@/era/context";
import { useTypeLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

/** The typing as of the current era, each type a link into the filtered list. */
export const TypeBadges = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();
  const { era } = useEra();

  return (
    <div className="flex gap-2 mb-6">
      {typesInEra(pokemon, era).map((type) => (
        <Link
          key={type.type.name}
          to={`/?type=${type.type.name}`}
          aria-label={t("details.showType", {
            type: typeLabel(type.type.name),
          })}
          className={`px-4 py-1 text-xs cursor-pointer hover:opacity-80 ${typeClass(
            type.type.name,
          )}`}
        >
          {typeLabel(type.type.name)}
        </Link>
      ))}
    </div>
  );
};
