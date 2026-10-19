/** What a row of chips chooses between. */
export type ChipKind = "gen" | "game" | "picture" | "ability";

/**
 * Each row of a picker owns a colour, so three rows under a sprite read as
 * three questions rather than one: the app's blue for the generation, the Game
 * Boy's green for the game, purple for the picture. Pressed is the full colour,
 * unpressed a wash of it, so the row is told apart before anything is pressed.
 * An ability, which is neither a date nor a picture, is black on grey.
 */
const ACCENTS: Record<ChipKind, { on: string; off: string }> = {
  gen: {
    on: "bg-dex-blue text-white",
    off: "bg-dex-blue/15 text-black hover:bg-dex-blue/35",
  },
  game: {
    on: "bg-gb-green-dark text-white",
    off: "bg-gb-green/35 text-black hover:bg-gb-green/70",
  },
  picture: {
    on: "bg-dex-purple text-white",
    off: "bg-dex-purple/15 text-black hover:bg-dex-purple/35",
  },
  ability: {
    on: "bg-black text-white",
    off: "bg-gray-200 text-black hover:bg-gray-300",
  },
};

export const chipClass = (kind: ChipKind, active: boolean): string =>
  `px-2 py-1 text-[10px] leading-none cursor-pointer ${
    active ? ACCENTS[kind].on : ACCENTS[kind].off
  }`;
