import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { encountersQuery } from "@/api/queries";
import { encountersPath } from "@/app/routes";
import { ACTION } from "@/components/buttons";
import { hasPlacesInEra } from "@/domain/encounters";
import { useEra } from "@/era/context";
import type { Pokemon } from "@/types/pokemon";

/**
 * The way through to where this Pokémon is found, shown only when the era has
 * somewhere to show.
 *
 * That is why the details page pays for the request rather than the page it
 * leads to: roughly a third of the Gen I/II dex is never met in the wild — the
 * evolved halves of lines, mostly, Crobat and Ampharos and Typhlosion — and a
 * link onto an empty page is worse than no link. The page itself then costs
 * nothing, because it asks for the same query key and finds it cached.
 */
export const EncountersLink = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const location = useLocation();

  const { data } = useQuery(encountersQuery(pokemon.name));

  if (!data || !hasPlacesInEra(data, era)) return null;

  return (
    <Link
      to={encountersPath(pokemon.name)}
      // Carries the list origin forward, so the chain back to the list survives
      // the detour.
      state={location.state}
      className={ACTION}
    >
      {t("encounters.title")}
    </Link>
  );
};
