import type { LocationEncounter } from "@/types/pokemon";
import { get } from "./client";

/**
 * Every place a Pokémon is met, in every game that has it.
 *
 * The payload looks alarming and is not. Magikarp's is 935 kB of JSON — 287
 * areas across 36 games — and 9.4 kB on the wire: the rows repeat so heavily
 * that brotli gets ninety-nine to one on them. Most Pokémon cost two to four.
 */
export const getEncounters = (name: string): Promise<LocationEncounter[]> =>
  get<LocationEncounter[]>(
    `pokemon/${name}/encounters`,
    `Failed to fetch encounters for ${name}`
  );
