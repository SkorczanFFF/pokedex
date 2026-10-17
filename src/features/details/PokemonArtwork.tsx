import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GEN_SLUGS, genRoman, type GenSlug } from "@/domain/dex";
import { cryForSet } from "@/domain/pokemonView";
import {
  genOpening,
  setGame,
  spriteGameName,
  spriteSets,
  spriteUrl,
  spriteVariants,
  type SpritePalette,
  type SpriteSetId,
  type SpriteView,
} from "@/domain/sprites";
import type { Pokemon } from "@/types/pokemon";
import { SpriteFrame } from "./SpriteFrame";
import { useAnimatedOnce } from "./useAnimatedOnce";

/** How wide a sprite is drawn: the same 240 px the column always gave it. */
const SPRITE_WIDTH = 240;

const chip = (isActive: boolean) =>
  `px-2 py-1 text-[10px] leading-none cursor-pointer ${
    isActive
      ? "bg-[#356DB2] text-white"
      : "bg-gray-200 text-black hover:bg-[#FECB09]"
  }`;

const PICTURE_LABEL = {
  "front/default": "details.spriteDefault",
  "front/shiny": "details.spriteShiny",
  "back/default": "details.spriteBackDefault",
  "back/shiny": "details.spriteBackShiny",
} as const satisfies Record<`${SpriteView}/${SpritePalette}`, string>;

/**
 * The picture column, and the choice of which picture.
 *
 * The era only sets the opening shot — retro lands on Crystal, modern on the
 * artwork — and the reader can walk the whole line either way: a generation,
 * then a game where the generation drew more than one sheet, then each view
 * and palette that sheet holds. The set is the page's to hold, because the
 * cry follows it from the header; the view and palette are this column's own.
 * Neither goes to the URL or storage: they are a look at this one Pokémon,
 * not a preference to carry around.
 *
 * A sheet that was drawn in motion — Crystal's — opens on its still, and a
 * click on the picture runs the animation through once with the cry under it,
 * the way the game played the two together when a Pokémon came out.
 */
export const PokemonArtwork = ({
  pokemon,
  set: active,
  onPick: setPicked,
}: {
  pokemon: Pokemon;
  /** The set up, already settled against what this Pokémon has. */
  set: SpriteSetId;
  onPick: (set: SpriteSetId) => void;
}) => {
  const { t } = useTranslation();
  const [pickedView, setPickedView] = useState<SpriteView>("front");
  const [pickedPalette, setPickedPalette] = useState<SpritePalette>("default");

  const sets = spriteSets(pokemon);
  const activeGen = setGame(active)?.gen ?? null;

  // The same rule for the picture: a pick carries across sheets while they
  // hold it — Gold's shiny back is Silver's too — and where they do not, the
  // view is kept and the palette dropped, because Red and Blue drew no shiny.
  const variants = spriteVariants(pokemon, active);
  const variant =
    variants.find(
      (v) => v.view === pickedView && v.palette === pickedPalette,
    ) ??
    variants.find((v) => v.view === pickedView && v.palette === "default") ??
    variants[0] ??
    null;

  const motion = useAnimatedOnce(
    variant?.animated ?? null,
    cryForSet(pokemon, active),
  );

  const gens = GEN_SLUGS.filter((gen) =>
    sets.some((set) => setGame(set)?.gen === gen),
  );
  const gamesOf = (gen: GenSlug) =>
    sets.filter((set) => setGame(set)?.gen === gen);
  const games = activeGen ? gamesOf(activeGen) : [];

  // Picking a numeral keeps the game when it is already one of that
  // generation's, and otherwise opens on the generation's own default.
  const pickGen = (gen: GenSlug) => {
    if (gen === activeGen) return;
    const opening = genOpening(gen);
    setPicked(sets.includes(opening) ? opening : gamesOf(gen)[0]);
  };

  const artwork = spriteUrl(pokemon, "artwork");

  let picture = null;
  if (variant) {
    const frame = (
      <SpriteFrame
        src={motion.src ?? variant.url}
        still={variant.url}
        animated={variant.animated}
        width={SPRITE_WIDTH}
        alt={pokemon.name}
      />
    );
    picture = variant.animated ? (
      <button
        type="button"
        onClick={motion.play}
        aria-label={t("details.playAnimation", { name: pokemon.name })}
        title={t("details.playAnimation", { name: pokemon.name })}
        className="cursor-pointer"
      >
        {frame}
      </button>
    ) : (
      frame
    );
  } else if (artwork) {
    picture = <img src={artwork} alt={pokemon.name} className="w-full h-auto" />;
  }

  return (
    <div>
      {/* The official artwork is square and fills the column, so reserving its
          footprint holds the picker at one height whichever set is showing —
          otherwise the row jumps every time a sprite of another size loads. */}
      <div className="aspect-square flex items-center justify-center">
        {picture}
      </div>

      {sets.length > 1 && (
        <div
          role="group"
          aria-label={t("details.spriteSet")}
          className="mt-4 flex flex-wrap gap-1 justify-center"
        >
          <button
            type="button"
            onClick={() => setPicked("artwork")}
            aria-pressed={activeGen === null}
            title={t("details.showArtwork")}
            aria-label={t("details.showArtwork")}
            className={chip(activeGen === null)}
          >
            {t("details.artwork")}
          </button>
          {gens.map((gen) => {
            const hint = t("details.showSprite", { roman: genRoman(gen) });
            return (
              <button
                key={gen}
                type="button"
                onClick={() => pickGen(gen)}
                aria-pressed={gen === activeGen}
                title={hint}
                aria-label={hint}
                className={chip(gen === activeGen)}
              >
                {genRoman(gen)}
              </button>
            );
          })}
        </div>
      )}

      {games.length > 1 && (
        <div
          role="group"
          aria-label={t("details.spriteGame")}
          className="mt-2 flex flex-wrap gap-1 justify-center"
        >
          {games.map((set) => {
            const name = spriteGameName(set);
            const hint = t("details.showGame", { game: name });
            return (
              <button
                key={set}
                type="button"
                onClick={() => setPicked(set)}
                aria-pressed={set === active}
                title={hint}
                aria-label={hint}
                className={chip(set === active)}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {variants.length > 1 && (
        <div
          role="group"
          aria-label={t("details.spritePicture")}
          className="mt-2 flex flex-wrap gap-1 justify-center"
        >
          {variants.map((v) => {
            const isActive = v.key === variant?.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  setPickedView(v.view);
                  setPickedPalette(v.palette);
                }}
                aria-pressed={isActive}
                className={chip(isActive)}
              >
                {t(PICTURE_LABEL[`${v.view}/${v.palette}`])}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
