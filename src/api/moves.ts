import type { Move } from "@/types/pokemon";
import { get } from "./client";

/**
 * One move, fetched only when a reader opens its row.
 *
 * The payload is around 50 kB of JSON — half of it a list of every Pokémon that
 * learns the move, which nothing here reads — but it arrives brotli-compressed
 * at roughly 5.5 kB, and PokéAPI offers no way to ask for fewer fields.
 */
export const getMove = (name: string): Promise<Move> =>
  get<Move>(`move/${name}`, `Failed to fetch move ${name}`);
