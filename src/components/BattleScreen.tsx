import type { ReactNode } from "react";

/**
 * Red's original battle back sprite: 32×32, four shades, 256 bytes, lifted from
 * the pokered disassembly (`gfx/player/redb.png`). Self-hosted rather than
 * hotlinked because PokéAPI serves no trainer sprites at all — only Pokémon,
 * items, badges and types — so there is no endpoint to build this URL from.
 * Scaled up with `image-rendering: pixelated` so it stays chunky, not blurred.
 */
const TRAINER_SPRITE = "/trainer-back.png";

/** A menu line the way the games drew them, cursor and all. */
export const MENU_ITEM =
  "group flex items-center gap-2 text-sm cursor-pointer hover:text-[#E12025] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

/** The `>` in front of it, dim until the line is hovered or focused. */
export const MenuCursor = () => (
  <span
    aria-hidden="true"
    className="opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100"
  >
    {">"}
  </span>
);

/** Gen 1 status panel: name and level on one line, HP bar under it. */
const StatusBox = ({
  name,
  level,
  hp,
}: {
  name: string;
  level: string;
  hp: number;
}) => (
  <div className="border-2 border-black bg-white px-2 py-1 md:px-3 md:py-2">
    <div className="flex items-baseline gap-4 text-[10px] md:text-xs">
      <span>{name}</span>
      <span className="ml-auto">:L{level}</span>
    </div>
    <div className="mt-2 flex items-center gap-2">
      <span className="text-[8px] md:text-[10px]">HP:</span>
      <div className="h-2 w-20 border-2 border-black md:w-28">
        <div className="h-full bg-[#356DB2]" style={{ width: `${hp}%` }} />
      </div>
    </div>
  </div>
);

/**
 * The Game Boy's battle layout, borrowed by the screens whose job is to say
 * that something is not here: the opponent's panel top left facing whatever
 * stands in for it top right, Red's back sprite mirrored underneath, and a
 * bordered text box below for the message and the way out.
 *
 * `opponent` fills the sprite slot — `404` for a page that does not exist, `???`
 * for a Pokémon this era has no data on — and tears sideways in steps, because
 * neither of them is really there. The panel beside it can carry a name and a
 * level of its own: the encounter knows who it met even when the dex does not,
 * and a 28-square box at `text-4xl` has no room for a name anyway.
 */
export const BattleScreen = ({
  opponent,
  name = opponent,
  level = opponent,
  children,
}: {
  opponent: string;
  /** Panel name; defaults to whatever fills the slot. */
  name?: string;
  /** Panel level; defaults to the same. */
  level?: string;
  children: ReactNode;
}) => (
  <div className="mx-auto w-full max-w-xl px-4 py-8">
    <div className="border-4 border-black bg-white p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <StatusBox name={name} level={level} hp={0} />
        <span
          aria-hidden="true"
          className="glitch flex h-20 w-20 items-center justify-center text-2xl md:h-28 md:w-28 md:text-4xl"
        >
          {opponent}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <img
          src={TRAINER_SPRITE}
          alt=""
          className="h-20 w-20 [image-rendering:pixelated] md:h-28 md:w-28"
        />
        {/* :L200 against the opponent's level — the panels carry the joke. */}
        <StatusBox name="ASH" level="200" hp={100} />
      </div>
    </div>

    <div className="mt-4 border-4 border-black bg-white p-4 md:p-6">
      {children}
    </div>
  </div>
);
