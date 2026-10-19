// The six stats — five, at era I — by their PokéAPI slugs, and the arithmetic
// every bar and every calculation shares.

/** PokéAPI's stat slugs, named once. `special` is Gen I's one stat for both sides. */
export const STAT = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  specialAttack: "special-attack",
  specialDefense: "special-defense",
  speed: "speed",
  special: "special",
} as const;

/** A stat as an era had it. The name is a slug, and at era I it can be `special`. */
export interface StatInEra {
  name: string;
  value: number;
}

/**
 * Top of a stat bar's scale. Blissey's 255 HP would otherwise run past the
 * track, so the fill is clamped rather than the track widened for one outlier.
 */
export const SCALE_MAX = 160;

/** How much of the track a value fills, in percent, clamped at the top. */
export const barPercent = (value: number): number =>
  Math.min(value / SCALE_MAX, 1) * 100;

/** A stat's value by slug, or 0 for one the list lacks. */
export const statValue = (stats: readonly StatInEra[], name: string): number =>
  stats.find((stat) => stat.name === name)?.value ?? 0;
