import { useTranslation } from "react-i18next";
import { cryForSet } from "@/domain/pokemonView";
import type { SpriteSetId } from "@/domain/sprites";
import { playCry } from "./cry";
import type { Pokemon } from "@/types/pokemon";

/**
 * Plays the Pokémon's cry — the recording that goes with the picture showing,
 * so a Game Boy sprite gets the Game Boy's buzz and the artwork the remastered
 * one. Renders nothing when there is no recording at all.
 */
export const CryButton = ({
  pokemon,
  set,
}: {
  pokemon: Pokemon;
  set: SpriteSetId;
}) => {
  const { t } = useTranslation();
  const cry = cryForSet(pokemon, set);

  if (!cry) return null;

  return (
    <button
      onClick={() => playCry(cry)}
      aria-label={t("details.playCry", { name: pokemon.name })}
      className="text-xs px-2 py-1 bg-[#FECB09] hover:bg-[#E12025] hover:text-white cursor-pointer"
    >
      {" > "}
      {t("details.cry")}
    </button>
  );
};
