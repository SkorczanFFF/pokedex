import type { ReactNode } from "react";
import { GbBox } from "./layout";

/**
 * Red's original battle back sprite: 32×32, four shades, 256 bytes, lifted from
 * the pokered disassembly (`gfx/player/redb.png`). Self-hosted rather than
 * hotlinked because PokéAPI serves no trainer sprites at all — only Pokémon,
 * items, badges and types — so there is no endpoint to build this URL from.
 * Scaled up with `image-rendering: pixelated` so it stays chunky, not blurred.
 */
const TRAINER_SPRITE = "/trainer-back.png";

/** The square a sprite stands in, on this screen and on Versus' field. */
export const BATTLE_SLOT = "h-20 w-20 md:h-28 md:w-28";

/** The panel's HP line: the label, the bar filled to `percent`, and a number if given. */
export const HpBar = ({ percent, value }: { percent: number; value?: number }) => (
  <div className="mt-2 flex items-center gap-2">
    <span className="text-[8px] md:text-[10px]">HP:</span>
    <div className="h-2 w-20 border-2 border-black md:w-28">
      <div className="h-full bg-dex-blue" style={{ width: `${percent}%` }} />
    </div>
    {value !== undefined && (
      <span className="text-[8px] md:text-[10px]">{value}</span>
    )}
  </div>
);

/**
 * Gen 1 status panel: a name and what stands beside it — a level, a dex
 * number — on one line, the HP bar and anything else under it.
 */
export const StatusBox = ({
  name,
  aside,
  className = "",
  children,
}: {
  name: ReactNode;
  aside?: ReactNode;
  className?: string;
  children?: ReactNode;
}) => (
  <div className={`border-2 border-black bg-white px-2 py-1 md:px-3 md:py-2 ${className}`}>
    <div className="flex items-baseline gap-4 text-[10px] md:text-xs">
      {name}
      {aside !== undefined && <span className="ml-auto">{aside}</span>}
    </div>
    {children}
  </div>
);

/** The slot of something that is not really there: it tears sideways in steps. */
export const GlitchSlot = ({
  className = BATTLE_SLOT,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <span
    aria-hidden="true"
    className={`${className} glitch flex items-center justify-center text-2xl md:text-4xl`}
  >
    {children}
  </span>
);

/** The first line of the text box: what happened. */
export const BattleTitle = ({ children }: { children: ReactNode }) => (
  <h1 className="text-sm leading-relaxed md:text-base">{children}</h1>
);

/** The lines under it. */
export const BattleText = ({ children }: { children: ReactNode }) => (
  <p className="mt-3 text-sm leading-relaxed md:text-base">{children}</p>
);

/** The way out: menu lines side by side, stacked on a phone. */
export const BattleActions = ({ children }: { children: ReactNode }) => (
  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-12">{children}</div>
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
    <GbBox>
      <div className="flex items-start justify-between gap-4">
        <StatusBox name={<span>{name}</span>} aside={`:L${level}`}>
          <HpBar percent={0} />
        </StatusBox>
        <GlitchSlot>{opponent}</GlitchSlot>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <img
          src={TRAINER_SPRITE}
          alt=""
          className={`${BATTLE_SLOT} [image-rendering:pixelated]`}
        />
        {/* :L200 against the opponent's level — the panels carry the joke. */}
        <StatusBox name={<span>ASH</span>} aside=":L200">
          <HpBar percent={100} />
        </StatusBox>
      </div>
    </GbBox>

    <GbBox className="mt-4">{children}</GbBox>
  </div>
);
