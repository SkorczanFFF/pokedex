import { useTranslation } from "react-i18next";
import { useEra } from "@/era/context";
import { humanize } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

/**
 * Stands in for the whole card when the Pokémon postdates the era.
 *
 * The dex scope only covers the list, the search and the filters — a link, a
 * bookmark, or switching to retro while already on a later Pokémon all still
 * land here. Showing the card anyway would have retro presenting a Pokémon it
 * elsewhere insists does not exist, so the card is replaced rather than
 * annotated, and the way out is offered instead of merely described.
 */
export const NotInEra = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const { era, setEra } = useEra();

  return (
    <div className="border-4 border-black bg-white p-4 md:p-6">
      <h1 className="text-sm leading-relaxed md:text-base">
        {t("era.notHere")}
      </h1>
      <p className="mt-3 text-xs leading-relaxed md:text-sm">
        {t("era.notHereBody", {
          name: humanize(pokemon.name),
          id: pokemon.id,
          max: era.maxDexId,
        })}
      </p>
      {/* Two eras, so "leave retro" is unambiguous. A third would have to name
          the one it drops back to. */}
      <button
        onClick={() => setEra("modern")}
        className="mt-6 px-4 py-2 text-sm text-black bg-[#FECB09] hover:bg-[#E12025] hover:text-white cursor-pointer"
      >
        {t("era.turnOff")}
      </button>
    </div>
  );
};
