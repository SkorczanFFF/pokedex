import type { DexEra } from "./era";
import { effectiveness, type MatchupAbilities } from "./matchup";
import type { MoveInGame } from "./moves";
import { isPokemonType, type PokemonType } from "./pokemonTypes";
import { STAT, statValue, type StatInEra } from "./stats";
import type { TypeChart } from "./typeChart";

// The damage calculator's arithmetic: the stats a battle is fought with, which
// stat a move reads, and what one hit does. Nothing here fetches or renders.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;
/** Where a calculation starts: the level the games' own battle facilities fight at. */
export const DEFAULT_LEVEL = 50;

export const clampLevel = (level: number): number =>
  Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(level)));

export type DamageClass = "physical" | "special" | "status";

/**
 * Through Gen III a move was physical or special by its type, not by the move:
 * these eight were special and every other type was physical. PokéAPI carries
 * only today's class, so the era decides which rule to read.
 */
const SPECIAL_TYPES: ReadonlySet<string> = new Set([
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
]);

export const damageClassInEra = (
  move: Pick<MoveInGame, "type" | "damageClass">,
  era: DexEra,
): DamageClass => {
  if (move.damageClass === "status") return "status";
  if (era.damageClassByType) {
    return SPECIAL_TYPES.has(move.type) ? "special" : "physical";
  }
  return move.damageClass === "special" ? "special" : "physical";
};

/**
 * A base stat grown to a level, with nothing else going for it: full IVs,
 * no EVs and a neutral nature since Gen III, full DVs and no stat experience
 * before. Shedinja's HP is 1 at every level.
 */
const grow = (name: string, base: number, level: number, era: DexEra): number => {
  if (name === STAT.hp && base === 1) return 1;
  const core =
    era.statFormula === "dv"
      ? Math.floor(((base + 15) * 2 * level) / 100)
      : Math.floor(((2 * base + 31) * level) / 100);
  return name === STAT.hp ? core + level + 10 : core + 5;
};

/** The era's base stats grown to a level, in the same order and under the same names. */
export const battleStats = (
  base: readonly StatInEra[],
  level: number,
  era: DexEra,
): StatInEra[] =>
  base.map((stat) => ({ name: stat.name, value: grow(stat.name, stat.value, level, era) }));

/**
 * The stat a move's class reads on each side. Gen I had one Special for both
 * offence and defence, and `statsInEra` names it `special` where that holds.
 */
export const offenceStat = (stats: readonly StatInEra[], cls: DamageClass): string =>
  cls === "physical" ? STAT.attack : pickSpecial(stats, STAT.specialAttack);

export const defenceStat = (stats: readonly StatInEra[], cls: DamageClass): string =>
  cls === "physical" ? STAT.defense : pickSpecial(stats, STAT.specialDefense);

const pickSpecial = (stats: readonly StatInEra[], split: string): string =>
  stats.some((stat) => stat.name === split) ? split : STAT.special;

export interface DamageRange {
  /** The lowest roll, 85%. */
  min: number;
  /** The highest, 100%. */
  max: number;
}

/**
 * What one hit does, at the two ends of the random roll.
 *
 * The formula every generation has shared: a base from the level, the power
 * and the attack over the defence, then the roll, then STAB, then the type
 * multiplier, floored at each step. Gen I and II rolled 217–255 over 255,
 * which comes to the same 85–100% to the integer, so one formula serves every
 * era; what the eras differ in — the class a move takes, the way a stat grows,
 * criticals and items — is decided before or left out. A hit that lands does
 * at least 1.
 */
export const damageRange = ({
  level,
  power,
  attack,
  defense,
  stab,
  effectiveness,
}: {
  level: number;
  power: number | null;
  attack: number;
  defense: number;
  stab: boolean;
  effectiveness: number;
}): DamageRange | null => {
  if (power === null || power <= 0 || effectiveness <= 0 || defense <= 0) return null;
  const base =
    Math.floor(
      Math.floor((Math.floor((2 * level) / 5 + 2) * power * attack) / defense) / 50,
    ) + 2;
  const roll = (percent: number): number => {
    let damage = Math.floor((base * percent) / 100);
    if (stab) damage = Math.floor(damage * 1.5);
    damage = Math.floor(damage * effectiveness);
    return Math.max(1, damage);
  };
  return { min: roll(85), max: roll(100) };
};

/** How many such hits take the defender down: guaranteed on the lowest roll, best case on the highest. */
export const hitsToKo = (
  hp: number,
  range: DamageRange,
): { guaranteed: number; best: number } => ({
  guaranteed: Math.ceil(hp / range.min),
  best: Math.ceil(hp / range.max),
});

/** Who moves first, by Speed alone; a tie is a coin toss in the games. */
export const firstToMove = (speedA: number, speedB: number): "a" | "b" | "tie" => {
  if (speedA === speedB) return "tie";
  return speedA > speedB ? "a" : "b";
};

/** Everything one hit is computed from. */
export interface HitInput {
  move: MoveInGame;
  /** The power to use: the move's own, or what the reader typed over it. */
  power: number | null;
  level: number;
  attackerTypes: readonly PokemonType[];
  defenderTypes: readonly PokemonType[];
  /** Both sides' stats as the battle is fought with them, already grown. */
  stats: readonly StatInEra[];
  defenderStats: readonly StatInEra[];
  abilities: MatchupAbilities;
  chart: TypeChart;
  era: DexEra;
}

/** What the calculator says about one hit. */
export interface ComputedHit {
  damageClass: DamageClass;
  type: string;
  stab: boolean;
  effectiveness: number;
  /** The defender's HP, which the damage is read against. */
  hp: number;
  /** Null for a status move, an immunity, or a move without power. */
  range: DamageRange | null;
}

/**
 * One hit, from the move's class in the era through to the damage: the class
 * decides which stats it reads, the type decides STAB and the multiplier, and
 * the abilities have their say on the multiplier before the roll.
 */
export const computeHit = ({
  move,
  power,
  level,
  attackerTypes,
  defenderTypes,
  stats,
  defenderStats,
  abilities,
  chart,
  era,
}: HitInput): ComputedHit => {
  const damageClass = damageClassInEra(move, era);
  const type = move.type;
  const stab = isPokemonType(type) && attackerTypes.includes(type);
  const value =
    damageClass !== "status" && isPokemonType(type)
      ? effectiveness(chart, type, defenderTypes, abilities)
      : 1;
  const hp = statValue(defenderStats, STAT.hp);
  const range =
    damageClass === "status"
      ? null
      : damageRange({
          level,
          power,
          attack: statValue(stats, offenceStat(stats, damageClass)),
          defense: statValue(defenderStats, defenceStat(defenderStats, damageClass)),
          stab,
          effectiveness: value,
        });
  return { damageClass, type, stab, effectiveness: value, hp, range };
};
