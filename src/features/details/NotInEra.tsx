import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  BattleScreen,
  MENU_ITEM,
  MenuCursor,
} from "@/components/BattleScreen";
import { genRoman, generationFromId } from "@/domain/dex";
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
 *
 * It borrows the 404 screen's battle layout. The slot holds `???` — what a
 * Pokédex of the day printed for an entry it had no data on — while the panel
 * names the Pokémon and levels it at its own dex number, the way the 404 screen
 * levels a 404 at 404.
 */
export const NotInEra = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const { era, setEra } = useEra();
  const name = humanize(pokemon.name);
  // From the id alone, so this costs nothing: the species payload is the one
  // request the page deliberately skips for a card it will not show. Null above
  // 1025, where PokéAPI numbers the alternate forms.
  const generation = generationFromId(pokemon.id);

  return (
    <BattleScreen
      opponent="???"
      name={name.toUpperCase()}
      level={String(pokemon.id)}
    >
      <h1 className="text-sm leading-relaxed md:text-base">
        {t("era.wild", { name: name.toUpperCase() })}
      </h1>
      <p className="mt-3 text-sm leading-relaxed md:text-base">
        {t(generation ? "era.notHereBody" : "era.notHereBodyNoGen", {
          name,
          id: pokemon.id,
          gen: generation ? genRoman(generation) : "",
          max: era.maxDexId,
        })}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-12">
        {/* Two eras, so "leave retro" is unambiguous. A third would have to
            name the one it drops back to. */}
        <button
          type="button"
          onClick={() => setEra("modern")}
          className={MENU_ITEM}
        >
          <MenuCursor />
          {t("era.turnOff")}
        </button>
        <Link to="/" className={MENU_ITEM}>
          <MenuCursor />
          {t("notFound.pokedex")}
        </Link>
      </div>
    </BattleScreen>
  );
};
