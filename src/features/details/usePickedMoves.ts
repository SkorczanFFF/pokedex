import { useState } from "react";
import type { LearnedMove } from "@/domain/moves";

/** A move in the place the list puts it — the same move can hold two. */
export interface PickedMove extends LearnedMove {
  method: string;
}

export const keyOf = (move: PickedMove): string =>
  `${move.method}|${move.name}|${move.level}`;

/**
 * Which rows of the moves list are open.
 *
 * Picks are looked up in the list rather than trusted, because switching era
 * swaps the game under them: Thunderbolt sits at level 26 in Crystal and 36 in
 * Scarlet and Violet. Its own row if that is still there, the same move wherever
 * the new game teaches it otherwise, and dropped when the new game does not
 * teach it at all. Reading them back in list order is what keeps the panels in
 * the same order as the rows they belong to, and writing the resolved list back
 * is what heals the state after an era change, so the next click toggles the
 * row a reader is actually looking at.
 */
export const usePickedMoves = (rows: readonly PickedMove[]) => {
  const [picked, setPicked] = useState<PickedMove[]>([]);

  const openKeys = new Set(
    picked
      .map(
        (pick) =>
          rows.find((row) => keyOf(row) === keyOf(pick)) ??
          rows.find((row) => row.name === pick.name),
      )
      .filter((row) => row !== undefined)
      .map(keyOf),
  );
  const open = rows.filter((row) => openKeys.has(keyOf(row)));

  const toggle = (row: PickedMove) =>
    setPicked(
      openKeys.has(keyOf(row))
        ? open.filter((other) => keyOf(other) !== keyOf(row))
        : [...open, row],
    );

  return { open, openKeys, toggle };
};
