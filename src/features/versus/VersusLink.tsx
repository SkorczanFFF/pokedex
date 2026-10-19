import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { versusPath } from "@/app/routes";
import { ACTION } from "@/components/buttons";
import type { Pokemon } from "@/types/pokemon";

/** Into the Versus page with this Pokémon already on the trainer's side. */
export const VersusLink = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();

  return (
    <Link to={versusPath({ a: pokemon.name })} className={ACTION}>
      {t("versus.link")}
    </Link>
  );
};
