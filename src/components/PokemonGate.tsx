import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Pokemon } from "@/types/pokemon";
import type { PokemonStatus } from "@/features/shared/usePokemonStatus";
import ErrorView from "./ErrorView";
import Loader from "./Loader";
import { NotFound } from "./NotFound";
import { NotInEra } from "./NotInEra";

/**
 * A page's answer to a Pokémon that is not here: the loader while it comes, the
 * 404 screen for a name that is nobody's, the error view when it failed, the
 * not-in-era screen when the era will not show it. `children` gets the one
 * that is here.
 */
export const PokemonGate = ({
  result,
  children,
}: {
  result: PokemonStatus;
  children: (pokemon: Pokemon) => ReactNode;
}) => {
  const { t } = useTranslation();

  switch (result.status) {
    case "empty":
    case "loading":
      return <Loader />;
    case "notFound":
      return <NotFound />;
    case "error":
      return <ErrorView message={t("error.details")} />;
    case "outOfEra":
      return <NotInEra pokemon={result.pokemon} />;
    case "ready":
      return <>{children(result.pokemon)}</>;
  }
};
