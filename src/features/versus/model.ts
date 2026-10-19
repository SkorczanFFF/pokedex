import type { Pokemon } from "@/types/pokemon";

/** `a` is the trainer's side, bottom left; `b` the opponent's, top right. */
export type Side = "a" | "b";

export const OTHER: Record<Side, Side> = { a: "b", b: "a" };

/** A slot with no Pokémon to show: nothing picked, or picked and not (yet) here. */
interface Idle {
  side: Side;
  status: "empty" | "loading" | "notFound" | "error";
  name: string | null;
  pokemon: null;
}

/** A slot whose Pokémon has loaded — whether or not the era will show it. */
export interface Known {
  side: Side;
  status: "ready" | "outOfEra";
  name: string;
  pokemon: Pokemon;
}

export type Fighter = Idle | Known;

/** The three readings of a matchup the text box offers. */
export type Tab = "types" | "stats" | "moves";
