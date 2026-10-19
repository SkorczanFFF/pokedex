import type { Effectiveness } from "@/domain/matchup";

/**
 * How a multiplier is printed: the way the games' guides print it, with the
 * values an ability leaves between — 1.5, 1.25, 0.75 — as plain decimals.
 */
export const printed = (value: Effectiveness): string => {
  if (value === 0.5) return "½";
  if (value === 0.25) return "¼";
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(2).replace(/0$/, "");
};

type PhraseKey =
  | "versus.super"
  | "versus.notVery"
  | "versus.noEffect"
  | "versus.neutral";

/** The games' own line for a hit; ×4 and ×¼ get the same words as ×2 and ×½. */
export const phraseKey = (value: Effectiveness): PhraseKey => {
  if (value > 1) return "versus.super";
  if (value === 0) return "versus.noEffect";
  if (value < 1) return "versus.notVery";
  return "versus.neutral";
};

/**
 * The colour says what the number says, by range rather than by value, since
 * an ability can leave any fraction. A neutral 1 is grey unless `traced`, which
 * the chart uses for the cells on a hover trace and the Versus page for every
 * chip.
 */
export const effectClass = (value: Effectiveness, traced = false): string => {
  if (value >= 4) return "bg-effect-super-4x text-white";
  if (value > 1) return "bg-effect-super text-white";
  if (value === 0) return "bg-black text-white";
  if (value < 0.5) return "bg-effect-weak-4x text-white";
  if (value < 1) return "bg-effect-weak text-white";
  return traced ? "bg-white text-black" : "bg-white text-gray-300";
};
