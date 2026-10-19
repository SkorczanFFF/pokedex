import { typeClass } from "@/domain/pokemonTypes";

/** How big a badge is: the chip beside a number, the badge on a card, the badge that is a link. */
export type BadgeSize = "xs" | "sm" | "md";

const SIZES: Record<BadgeSize, string> = {
  xs: "px-2 py-1 text-[10px] leading-none",
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-1 text-xs",
};

/** The classes of a type badge, for an element that has to be a link or a button rather than a span. */
export const typeBadgeClass = (type: string, size: BadgeSize = "xs"): string =>
  `${SIZES[size]} ${typeClass(type)}`;
