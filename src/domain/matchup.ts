import type { PokemonTypeSlot } from "@/types/pokemon";
import { isPokemonType, type PokemonType } from "./pokemonTypes";
import type { TypeChart } from "./typeChart";

/** What an attack does to a whole Pokémon: the chart's four values, and what two of them multiply to. */
export type Effectiveness = 0 | 0.25 | 0.5 | 1 | 2 | 4;

/** A typing as type names, in slot order. */
export const typingOf = (slots: readonly PokemonTypeSlot[]): PokemonType[] =>
  [...slots]
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => slot.type.name)
    .filter(isPokemonType);

/** The product over the defender's types — closed over the six values for up to two of them. */
export const effectiveness = (
  chart: TypeChart,
  attack: PokemonType,
  defender: readonly PokemonType[],
): Effectiveness =>
  defender.reduce<number>(
    (product, type) => product * chart.multiplier(attack, type),
    1,
  ) as Effectiveness;

export interface Hit {
  attack: PokemonType;
  value: Effectiveness;
}

/** Each of the attacker's own types against the defender's typing. */
export const matchup = (
  chart: TypeChart,
  attacker: readonly PokemonType[],
  defender: readonly PokemonType[],
): Hit[] =>
  attacker.map((attack) => ({
    attack,
    value: effectiveness(chart, attack, defender),
  }));

/** Weaknesses first, then resistances, then immunities; neutral is left out. */
const PROFILE_ORDER: readonly Effectiveness[] = [4, 2, 0.5, 0.25, 0];

export interface ProfileGroup {
  value: Effectiveness;
  attacks: PokemonType[];
}

/** Every type of the era against one typing, grouped by what it does. */
export const defensiveProfile = (
  chart: TypeChart,
  defender: readonly PokemonType[],
): ProfileGroup[] =>
  PROFILE_ORDER.map((value) => ({
    value,
    attacks: chart.types.filter(
      (attack) => effectiveness(chart, attack, defender) === value,
    ),
  })).filter((group) => group.attacks.length > 0);
