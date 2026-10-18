/** What a row of chips chooses between. */
export type ChipKind = "gen" | "game" | "picture";

/**
 * Each row of a picker owns a colour, so three rows under a sprite read as
 * three questions rather than one: the app's blue for the generation, the Game
 * Boy's green for the game, purple for the picture. Pressed is the full colour,
 * unpressed a wash of it, so the row is told apart before anything is pressed.
 */
const ACCENTS: Record<ChipKind, { on: string; off: string }> = {
  gen: {
    on: "bg-[#356DB2] text-white",
    off: "bg-[#356DB2]/15 text-black hover:bg-[#356DB2]/35",
  },
  game: {
    on: "bg-[#306230] text-white",
    off: "bg-[#8BAC0F]/35 text-black hover:bg-[#8BAC0F]/70",
  },
  picture: {
    on: "bg-[#7D3C98] text-white",
    off: "bg-[#7D3C98]/15 text-black hover:bg-[#7D3C98]/35",
  },
};

export const chipClass = (kind: ChipKind, active: boolean): string =>
  `px-2 py-1 text-[10px] leading-none cursor-pointer ${
    active ? ACCENTS[kind].on : ACCENTS[kind].off
  }`;

/**
 * Yellow is something to press about this Pokémon: a cry, a reading, the page
 * of where it is met, Versus with it already picked — and Versus' swap.
 */
export const ACTION =
  "text-xs px-2 py-1 bg-[#FECB09] hover:bg-[#E12025] hover:text-white cursor-pointer";

/**
 * A framed link is a reference page that is about no Pokémon in particular:
 * the chart. Framed like a menu box, so it
 * is neither a picker's wash nor an action's yellow.
 */
export const PAGE_LINK =
  "inline-block px-3 py-1 text-xs border-2 border-black bg-white text-black hover:bg-[#FECB09] cursor-pointer";
