import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { typingOf } from "@/domain/matchup";
import { statsInEra, typesInEra } from "@/domain/pokemonView";
import { battleSprite, type SpriteView } from "@/domain/sprites";
import { useEra } from "@/era/context";
import { SCALE_MAX } from "@/features/details/StatList";
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

/** The Game Boy's battle layout with two real Pokémon in it. */
export const BattleField = ({
  yours,
  foe,
}: {
  yours: Fighter;
  foe: Fighter;
}) => (
  <div className="border-4 border-black bg-white p-4 md:p-6">
    <div className="flex items-start justify-between gap-4">
      <FighterBox fighter={foe} />
      <Slot fighter={foe} view="front" />
    </div>
    <div className="mt-6 flex items-end justify-between gap-4">
      <Slot fighter={yours} view="back" />
      <FighterBox fighter={yours} />
    </div>
  </div>
);

const Slot = ({ fighter, view }: { fighter: Fighter; view: SpriteView }) => {
  const { era } = useEra();

  switch (fighter.status) {
    case "empty":
      return (
        <span
          aria-hidden="true"
          className={`${SIZE} flex items-center justify-center border-2 border-dashed border-gray-300 text-2xl text-gray-300 md:text-4xl`}
        >
          ?
        </span>
      );
    case "loading":
      return (
        <span aria-hidden="true" className={`${SIZE} bg-gray-200 animate-pulse`} />
      );
    case "ready": {
      const sprite = battleSprite(fighter.pokemon, era.sprites, view);
      if (!sprite) return <span className={SIZE} />;
      return (
        <img
          src={sprite.url}
          alt={fighter.pokemon.name}
          className={`${SIZE} object-contain [image-rendering:pixelated] ${
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
          className={`${SIZE} glitch flex items-center justify-center text-2xl md:text-4xl`}
        >
          ???
        </span>
      );
  }
};

/** The status panel: name, dex number, base HP on the bar, and the typing. */
const FighterBox = ({ fighter }: { fighter: Fighter }) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const ready = fighter.status === "ready" ? fighter.pokemon : null;
  const hp = ready
    ? (statsInEra(ready, era).find((stat) => stat.name === "hp")?.value ?? 0)
    : 0;

  return (
    <div className="min-w-40 border-2 border-black bg-white px-2 py-1 md:px-3 md:py-2">
      <div className="flex items-baseline gap-4 text-[10px] md:text-xs">
        {ready ? (
          <Link
            to={`/pokemon/${ready.name}`}
            className="uppercase hover:text-[#E12025]"
          >
            {humanize(ready.name)}
          </Link>
        ) : (
          <span className="uppercase text-gray-400">
            {fighter.name
              ? humanize(fighter.name)
              : t(fighter.side === "a" ? "compare.yours" : "compare.foe")}
          </span>
        )}
        {ready && <span className="ml-auto">#{ready.id}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-[8px] md:text-[10px]">HP:</span>
        <div className="h-2 w-20 border-2 border-black md:w-28">
          <div
            className="h-full bg-[#356DB2]"
            style={{ width: `${Math.min(hp / SCALE_MAX, 1) * 100}%` }}
          />
        </div>
        {ready && <span className="text-[8px] md:text-[10px]">{hp}</span>}
      </div>
      {ready && (
        <div className="mt-2 flex flex-wrap gap-1">
          {typingOf(typesInEra(ready, era)).map((type) => (
            <TypeChip key={type} type={type} />
          ))}
        </div>
      )}
    </div>
  );
};
