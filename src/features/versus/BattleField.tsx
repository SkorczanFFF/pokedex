import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { pokemonPath } from "@/app/routes";
import { HpBar } from "@/components/BattleScreen";
import { statsInEra, typingInEra } from "@/domain/pokemonView";
import { battleSprite, type SpriteView } from "@/domain/sprites";
import { STAT, barPercent, statValue } from "@/domain/stats";
import { useEra } from "@/era/context";
import { humanize } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";
import { TypeChip } from "./Matchup";

/** `a` is the trainer's side, bottom left; `b` the opponent's, top right. */
export type Side = "a" | "b";

interface Idle {
  side: Side;
  status: "empty" | "loading" | "notFound" | "error";
  name: string | null;
  pokemon: null;
}

export interface Known {
  side: Side;
  status: "ready" | "outOfEra";
  name: string;
  pokemon: Pokemon;
}

export type Fighter = Idle | Known;

const SIZE = "h-20 w-20 md:h-28 md:w-28";
/** Showdown's sprites run to twice Crystal's size, so the modern slot is bigger. */
const MODERN_SIZE = "h-24 w-24 md:h-40 md:w-40";

/** The Game Boy's battle layout with two real Pokémon in it. */
export const BattleField = ({
  yours,
  foe,
}: {
  yours: Fighter;
  foe: Fighter;
}) => {
  const { era } = useEra();
  // Modern's taller slots pull the trainer's side up into the empty corner
  // under the foe's panel; on a phone that corner is too shallow to take it.
  const rows = era.pixelArt ? "mt-6" : "md:-mt-12";

  return (
    <div className="border-4 border-black bg-white p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <FighterBox fighter={foe} />
        <Slot fighter={foe} view="front" />
      </div>
      <div className={`${rows} flex items-end justify-between gap-4`}>
        <Slot fighter={yours} view="back" />
        <FighterBox fighter={yours} />
      </div>
    </div>
  );
};

const Slot = ({ fighter, view }: { fighter: Fighter; view: SpriteView }) => {
  const { era } = useEra();
  const modern = !era.pixelArt;
  const size = modern ? MODERN_SIZE : SIZE;

  switch (fighter.status) {
    case "empty":
      return (
        <span
          aria-hidden="true"
          className={`${size} flex items-center justify-center border-2 border-dashed border-gray-300 text-2xl text-gray-300 md:text-4xl`}
        >
          ?
        </span>
      );
    case "loading":
      return (
        <span aria-hidden="true" className={`${size} bg-gray-200 animate-pulse`} />
      );
    case "ready": {
      const showdown = modern ? showdownSprite(fighter.pokemon, view) : null;
      if (showdown) {
        return (
          <span className={`${size} relative flex items-end justify-center`}>
            <span
              aria-hidden="true"
              className="absolute bottom-0 h-4 w-full rounded-[50%] bg-black/10 md:h-6"
            />
            <ShowdownSprite
              key={showdown.url}
              {...showdown}
              alt={fighter.pokemon.name}
            />
          </span>
        );
      }
      const sprite = battleSprite(fighter.pokemon, era.sprites, view);
      if (!sprite) return <span className={size} />;
      return (
        <img
          src={sprite.url}
          alt={fighter.pokemon.name}
          className={`${size} object-contain [image-rendering:pixelated] ${
            sprite.mirrored ? "-scale-x-100" : ""
          }`}
        />
      );
    }
    default:
      // Not found, or not in this era: the slot tears the way the 404's does.
      return (
        <span
          aria-hidden="true"
          className={`${size} glitch flex items-center justify-center text-2xl md:text-4xl`}
        >
          ???
        </span>
      );
  }
};

/**
 * Showdown's animated GIF for the view, or its front turned round where only
 * the back is missing — one style in both slots beats a mix. Null sends the
 * slot back to the static sprites.
 */
const showdownSprite = (
  pokemon: Pokemon,
  view: SpriteView,
): { url: string; mirrored: boolean } | null => {
  const sheet = pokemon.sprites.other.showdown;
  if (view === "back" && sheet?.back_default) {
    return { url: sheet.back_default, mirrored: false };
  }
  return sheet?.front_default
    ? { url: sheet.front_default, mirrored: view === "back" }
    : null;
};

/**
 * Drawn at twice its own size, so a Caterpie stays smaller than a Charizard,
 * capped by the slot, feet on the platform. Hidden until its size is known.
 */
const ShowdownSprite = ({
  url,
  mirrored,
  alt,
}: {
  url: string;
  mirrored: boolean;
  alt: string;
}) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  return (
    <img
      src={url}
      alt={alt}
      onLoad={(e) =>
        setSize({
          width: e.currentTarget.naturalWidth * 2,
          height: e.currentTarget.naturalHeight * 2,
        })
      }
      style={size ?? undefined}
      className={`relative max-h-full max-w-full object-contain object-bottom [image-rendering:pixelated] ${
        size ? "" : "opacity-0"
      } ${mirrored ? "-scale-x-100" : ""}`}
    />
  );
};

/** The status panel: name, dex number, base HP on the bar, and the typing. */
const FighterBox = ({ fighter }: { fighter: Fighter }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const ready = fighter.status === "ready" ? fighter.pokemon : null;
  const hp = ready ? statValue(statsInEra(ready, era), STAT.hp) : 0;

  return (
    <div className="min-w-40 border-2 border-black bg-white px-2 py-1 md:px-3 md:py-2">
      <div className="flex items-baseline gap-4 text-[10px] md:text-xs">
        {ready ? (
          <Link
            to={pokemonPath(ready.name)}
            className="uppercase hover:text-dex-red"
          >
            {humanize(ready.name)}
          </Link>
        ) : (
          <span className="uppercase text-gray-400">
            {fighter.name
              ? humanize(fighter.name)
              : t(fighter.side === "a" ? "versus.yours" : "versus.foe")}
          </span>
        )}
        {ready && <span className="ml-auto">#{ready.id}</span>}
      </div>
      <HpBar percent={barPercent(hp)} value={ready ? hp : undefined} />
      {ready && (
        <div className="mt-2 flex flex-wrap gap-1">
          {typingInEra(ready, era).map((type) => (
            <TypeChip key={type} type={type} />
          ))}
        </div>
      )}
    </div>
  );
};
