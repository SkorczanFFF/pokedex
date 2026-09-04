import { useState } from "react";
import { useTranslation } from "react-i18next";
import { genRoman } from "@/domain/dex";
import type { SpriteSetId } from "@/domain/era";
import { spriteSets, spriteUrl } from "@/domain/pokemonView";
import { useEra } from "@/era/context";
import type { Pokemon } from "@/types/pokemon";

/**
 * The picture column, and the choice of which picture.
 *
 * The era only sets the opening shot — retro lands on the Gen II sprite, modern
 * on the artwork — and the reader can walk the whole line either way. The picker
 * stays in local state rather than the URL or storage: it is a look at this one
 * Pokémon, not a preference to carry around.
 */
export const PokemonArtwork = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const [picked, setPicked] = useState<SpriteSetId | null>(null);

  const sets = spriteSets(pokemon);
  // An explicit pick wins, but only while it exists: following an evolution
  // link to a Pokémon with no Gen I sprite falls back rather than showing a gap.
  const chosen = picked ?? era.sprites;
  const active = sets.includes(chosen) ? chosen : (sets[0] ?? "artwork");
  const url = spriteUrl(pokemon, active);

  return (
    <div>
      {/* The official artwork is square and fills the column, so reserving its
          footprint holds the picker at one height whichever set is showing —
          otherwise the row jumps every time a sprite of another size loads. */}
      <div className="aspect-square flex items-center justify-center">
        {url && (
          <img
            src={url}
            alt={pokemon.name}
            className={
              active === "artwork"
                ? "w-full h-auto"
                : // Gen I sprites are 56 square. Stretched across the column
                  // they turn to mush, so they are capped and kept crisp.
                  "w-full h-auto max-w-[240px] [image-rendering:pixelated]"
            }
          />
        )}
      </div>

      {sets.length > 1 && (
        <div
          role="group"
          aria-label={t("details.spriteSet")}
          className="mt-4 flex flex-wrap gap-1 justify-center"
        >
          {sets.map((set) => {
            const isActive = set === active;
            const label =
              set === "artwork" ? t("details.artwork") : genRoman(set);
            const hint =
              set === "artwork"
                ? t("details.showArtwork")
                : t("details.showSprite", { roman: genRoman(set) });

            return (
              <button
                key={set}
                type="button"
                onClick={() => setPicked(set)}
                aria-pressed={isActive}
                title={hint}
                aria-label={hint}
                className={`px-2 py-1 text-[10px] leading-none cursor-pointer ${
                  isActive
                    ? "bg-[#356DB2] text-white"
                    : "bg-gray-200 text-black hover:bg-[#FECB09]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
