import { useTranslation } from "react-i18next";
import { cryFor } from "@/domain/pokemonView";
import { useEra } from "@/era/context";
import type { Pokemon } from "@/types/pokemon";

/**
 * Plays the Pokémon's cry — the era's recording, so retro gets the Game Boy's
 * buzz rather than the remastered one. Renders nothing when there is no
 * recording at all.
 */
export const CryButton = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const cry = cryFor(pokemon, era);

  if (!cry) return null;

  const play = () => {
    const audio = new Audio(cry);
    audio.volume = 0.3;
    audio.play().catch(() => {
      /* user-gesture missing or autoplay blocked */
    });
  };

  return (
    <button
      onClick={play}
      aria-label={t("details.playCry", { name: pokemon.name })}
      className="text-xs px-2 py-1 bg-[#FECB09] hover:bg-[#E12025] hover:text-white cursor-pointer"
    >
      {" > "}
      {t("details.cry")}
    </button>
  );
};
