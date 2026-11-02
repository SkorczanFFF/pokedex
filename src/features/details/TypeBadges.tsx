import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { listPath } from "@/app/routes";
import { typeBadgeClass } from "@/components/typeBadge";
import { typesInEra } from "@/domain/pokemonView";
import { useEra } from "@/app/era/context";
import { useTypeLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";
import { TypesAgainst } from "./TypesAgainst";

/** The typing as of the current era, each type a link into the filtered list, then what every type does to it. */
export const TypeBadges = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();
  const { era } = useEra();

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {typesInEra(pokemon, era).map((type) => (
        <Link
          key={type.type.name}
          to={listPath({ type: type.type.name })}
          aria-label={t("details.showType", {
            type: typeLabel(type.type.name),
          })}
          className={`${typeBadgeClass(type.type.name, "md")} cursor-pointer hover:opacity-80`}
        >
          {typeLabel(type.type.name)}
        </Link>
      ))}
      <TypesAgainst pokemon={pokemon} />
    </div>
  );
};
