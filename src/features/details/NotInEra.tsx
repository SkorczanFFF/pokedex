import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { paths } from "@/app/routes";
import {
  BattleActions,
  BattleScreen,
  BattleText,
  BattleTitle,
} from "@/components/BattleScreen";
import { MENU_ITEM, MenuCursor } from "@/components/menu";
import { DEFAULT_ERA } from "@/domain/era";
import { useEra } from "@/era/context";
import { useNotInEraText } from "@/features/shared/useNotInEraText";
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
  const { setEra } = useEra();
  const notInEra = useNotInEraText();
  const name = humanize(pokemon.name);

  return (
    <BattleScreen
      opponent="???"
      name={name.toUpperCase()}
      level={String(pokemon.id)}
    >
      <BattleTitle>{t("era.wild", { name: name.toUpperCase() })}</BattleTitle>
      <BattleText>{notInEra(pokemon)}</BattleText>

      <BattleActions>
        {/* Two eras, so "leave retro" is unambiguous. A third would have to
            name the one it drops back to. */}
        <button
          type="button"
          onClick={() => setEra(DEFAULT_ERA)}
          className={MENU_ITEM}
        >
          <MenuCursor />
          {t("era.turnOff")}
        </button>
        <Link to={paths.list} className={MENU_ITEM}>
          <MenuCursor />
          {t("notFound.pokedex")}
        </Link>
      </BattleActions>
    </BattleScreen>
  );
};
