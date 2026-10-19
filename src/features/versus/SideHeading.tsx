import { humanize } from "@/i18n/labels";
import type { Side } from "./model";

/** The trainer's side reads in the dex's blue, the opponent's in its red, on every tab. */
const SIDE_COLOUR: Record<Side, string> = { a: "text-dex-blue", b: "text-dex-red" };

/**
 * A side's Pokémon named over its half of a tab, in capitals the way the
 * battle screen prints a name. The Stats and Moves tabs each head their halves
 * with this, so a reader switching between them sees the same two names in the
 * same two places.
 */
export const SideHeading = ({
  side,
  name,
  className = "",
}: {
  side: Side;
  name: string;
  className?: string;
}) => (
  <h2 className={`text-xs uppercase ${SIDE_COLOUR[side]} ${className}`}>
    {humanize(name)}
  </h2>
);
