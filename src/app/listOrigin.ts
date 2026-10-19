import type { Location } from "react-router-dom";

// How a details page remembers the list it came from, and how the list gets
// its scroll position back. Three parties speak this: the card that leaves the
// list, the Back button that returns, and the list that restores. The shapes
// ride in history state, which is untyped, so they are read here and nowhere
// else.

/** Where a card was clicked: the list's address, filters and all, and how far down it was. */
export interface ListOrigin {
  from: string;
  scrollY: number;
}

/**
 * What a card writes into history state as it leaves. Read at click time: a
 * Link's `state` prop is fixed at render, and would carry a stale 0.
 */
export const leaveList = (location: Location): ListOrigin => ({
  from: `${location.pathname}${location.search}`,
  scrollY: window.scrollY,
});

/** The origin a details page arrived with, or null when it did not come from the list. */
export const readOrigin = (state: unknown): ListOrigin | null => {
  const carried = state as Partial<ListOrigin> | null | undefined;
  if (!carried || typeof carried.from !== "string") return null;
  return {
    from: carried.from,
    scrollY: typeof carried.scrollY === "number" ? carried.scrollY : 0,
  };
};

/** What Back hands the list, so it can put itself back where it was. */
export const returnState = (
  origin: ListOrigin | null,
): { restoreScroll: number } | null =>
  origin ? { restoreScroll: origin.scrollY } : null;

/** The offset the list was asked to return to, or null when it was not. */
export const readRestore = (state: unknown): number | null => {
  const y = (state as { restoreScroll?: unknown } | null | undefined)?.restoreScroll;
  return typeof y === "number" ? y : null;
};
