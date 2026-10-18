import type { Effectiveness } from "@/domain/matchup";

/** How a multiplier is printed: the way the games' guides print it. */
export const printed = (value: Effectiveness): string => {
  switch (value) {
    case 0.5:
      return "½";
    case 0.25:
      return "¼";
    default:
      return `${value}`;
  }
};

/**
 * The colour says what the number says. A neutral 1 is grey unless `traced`,
 * which the chart uses for the cells on a hover trace and the Versus page for
 * every chip.
 */
export const effectClass = (value: Effectiveness, traced = false): string => {
  switch (value) {
    case 4:
      return "bg-[#4E8A2E] text-white";
    case 2:
      return "bg-[#7AC74C] text-white";
    case 0.5:
      return "bg-[#EE8130] text-white";
    case 0.25:
      return "bg-[#B9521C] text-white";
    case 0:
      return "bg-black text-white";
    default:
      return traced ? "bg-white text-black" : "bg-white text-gray-300";
  }
};
