import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Chip, ChipRow } from "@/components/Chip";
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
        <ChipRow label={t("details.spriteSet")} className="mt-4 justify-center">
          <Chip
            kind="gen"
            active={activeGen === null}
            onClick={() => setPicked("artwork")}
            label={t("details.showArtwork")}
          >
            {t("details.artwork")}
          </Chip>
          {gens.map((gen) => (
            <Chip
              key={gen}
              kind="gen"
              active={gen === activeGen}
              onClick={() => pickGen(gen)}
              label={t("details.showSprite", { roman: genRoman(gen) })}
            >
              {genRoman(gen)}
            </Chip>
          ))}
        </ChipRow>
      )}

      {games.length > 1 && (
        <ChipRow label={t("details.spriteGame")} className="mt-2 justify-center">
          {games.map((set) => {
            const name = spriteGameName(set);
            return (
              <Chip
                key={set}
                kind="game"
                active={set === active}
                onClick={() => setPicked(set)}
                label={t("details.showGame", { game: name })}
              >
                {name}
              </Chip>
            );
          })}
        </ChipRow>
      )}

      {variants.length > 1 && (
        <ChipRow label={t("details.spritePicture")} className="mt-2 justify-center">
          {variants.map((v) => (
            <Chip
              key={v.key}
              kind="picture"
              active={v.key === variant?.key}
              onClick={() => {
                setPickedView(v.view);
                setPickedPalette(v.palette);
              }}
            >
              {t(PICTURE_LABEL[`${v.view}/${v.palette}`])}
            </Chip>
          ))}
        </ChipRow>
      )}
    </div>
  );
};
