import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Pokemon } from "@/types/pokemon";

/** Into the compare page with this Pokémon already on the trainer's side. */
export const CompareLink = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();

  return (
    <Link
      to={`/compare?a=${pokemon.name}`}
      className="text-xs px-2 py-1 bg-[#FECB09] hover:bg-[#E12025] hover:text-white cursor-pointer"
    >
      {t("compare.link")}
    </Link>
  );
};
