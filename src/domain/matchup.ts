import type { PokemonTypeSlot } from "@/types/pokemon";
import type { AbilityRule } from "./abilities";
import { isPokemonType, type PokemonType } from "./pokemonTypes";
import type { TypeChart } from "./typeChart";

/**
 * What an attack does to a whole Pokémon: the chart's four values, what two of
 * them multiply to, and — once an ability has had its say — the fractions in
 * between: Filter leaves a ×2 at 1.5, Dry Skin takes Fire at 1.25.
 */
export type Effectiveness = number;

/** The abilities on either side of a hit; missing or null means none that matters. */
export interface MatchupAbilities {
  attacker?: AbilityRule | null;
  defender?: AbilityRule | null;
}

/** A typing as type names, in slot order. */
export const typingOf = (slots: readonly PokemonTypeSlot[]): PokemonType[] =>
  [...slots]
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => slot.type.name)
    .filter(isPokemonType);

/**
 * The product over the defender's types, then the abilities in the order the
 * games apply them: Wonder Guard decides whether the hit lands at all, the
 * defender's immunities and halves scale it, Filter trims what is still
 * super effective, Tinted Lens doubles what is still weak.
 */
export const effectiveness = (
  chart: TypeChart,
  attack: PokemonType,
  defender: readonly PokemonType[],
  abilities: MatchupAbilities = {},
): Effectiveness => {
  const attacking = abilities.attacker ?? null;
  const defending = abilities.defender ?? null;
  // Mold Breaker reads through the defender's ability; Prism Armor holds anyway.
  const held =
    defending && (!attacking?.ignoresDefender || defending.unbreakable)
      ? defending
      : null;

  let value = defender.reduce<number>((product, type) => {
    const times = chart.multiplier(attack, type);
    // Scrappy: a Ghost takes the Normal or Fighting hit it would have shrugged off.
    const lands =
      times === 0 && type === "ghost" && attacking?.hitsGhostWith?.includes(attack);
    return product * (lands ? 1 : times);
  }, 1);

  if (held?.onlySuperEffective && value <= 1) return 0;
  for (const rule of held?.takes ?? []) {
    if (rule.types.includes(attack)) value *= rule.times;
  }
  if (value > 1 && held?.superEffectiveTaken) value *= held.superEffectiveTaken;
  if (value > 0 && value < 1 && attacking?.notVeryEffectiveDealt) {
    value *= attacking.notVeryEffectiveDealt;
  }
  return value;
};

export interface Hit {
  attack: PokemonType;
  value: Effectiveness;
}

/** Each of the attacker's own types against the defender's typing. */
export const matchup = (
  chart: TypeChart,
  attacker: readonly PokemonType[],
  defender: readonly PokemonType[],
  abilities: MatchupAbilities = {},
): Hit[] =>
  attacker.map((attack) => ({
    attack,
    value: effectiveness(chart, attack, defender, abilities),
  }));

export interface ProfileGroup {
  value: Effectiveness;
  attacks: PokemonType[];
}

/**
 * Every type of the era against one typing, grouped by what it does: the
 * weaknesses first, down to the immunities, neutral left out. Grouped by the
 * values that turn up rather than a fixed list, since an ability can leave a
 * 1.5 or a 0.75 that the chart alone never produces.
 */
export const defensiveProfile = (
  chart: TypeChart,
  defender: readonly PokemonType[],
  abilities: MatchupAbilities = {},
): ProfileGroup[] => {
  const groups = new Map<Effectiveness, PokemonType[]>();
  for (const attack of chart.types) {
    const value = effectiveness(chart, attack, defender, abilities);
    if (value === 1) continue;
    groups.set(value, [...(groups.get(value) ?? []), attack]);
  }
  return [...groups]
    .map(([value, attacks]) => ({ value, attacks }))
    .sort((a, b) => b.value - a.value);
};
