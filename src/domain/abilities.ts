import type { Pokemon } from "@/types/pokemon";
import type { PokemonType } from "./pokemonTypes";

/**
 * What an ability does to a type matchup. PokéAPI describes ability effects in
 * prose only, so this table is written by hand: the abilities that change the
 * multiplier, and nothing else. The ones that scale a stat instead — Huge
 * Power, Adaptability, Technician — are a later table.
 */
export interface AbilityRule {
  /** Defending: an attack of these types takes this much (0 is an immunity). */
  takes?: readonly { types: readonly PokemonType[]; times: number }[];
  /** Defending: a super-effective hit is scaled (Filter, Solid Rock, Prism Armor). */
  superEffectiveTaken?: number;
  /** Defending: only a super-effective hit lands at all (Wonder Guard). */
  onlySuperEffective?: boolean;
  /** Defending: holds even against Mold Breaker (Prism Armor). */
  unbreakable?: boolean;
  /** Attacking: the defender's ability is ignored (Mold Breaker, Teravolt, Turboblaze). */
  ignoresDefender?: boolean;
  /** Attacking: these types hit Ghost for normal damage (Scrappy, Mind's Eye). */
  hitsGhostWith?: readonly PokemonType[];
  /** Attacking: a not-very-effective hit is scaled (Tinted Lens). */
  notVeryEffectiveDealt?: number;
}

const immune = (...types: PokemonType[]): AbilityRule => ({
  takes: [{ types, times: 0 }],
});
const halves = (...types: PokemonType[]): AbilityRule => ({
  takes: [{ types, times: 0.5 }],
});

/** Keyed by PokéAPI's slugs. Checked against Bulbapedia, Gen IX rules. */
const RULES: Record<string, AbilityRule> = {
  levitate: immune("ground"),
  "earth-eater": immune("ground"),
  "flash-fire": immune("fire"),
  "well-baked-body": immune("fire"),
  "water-absorb": immune("water"),
  "storm-drain": immune("water"),
  "volt-absorb": immune("electric"),
  "lightning-rod": immune("electric"),
  "motor-drive": immune("electric"),
  "sap-sipper": immune("grass"),
  "dry-skin": {
    takes: [
      { types: ["water"], times: 0 },
      { types: ["fire"], times: 1.25 },
    ],
  },
  "thick-fat": halves("fire", "ice"),
  heatproof: halves("fire"),
  "water-bubble": halves("fire"),
  "purifying-salt": halves("ghost"),
  // Its other half, contact moves at ½, needs move flags: a later table.
  fluffy: { takes: [{ types: ["fire"], times: 2 }] },
  "wonder-guard": { onlySuperEffective: true },
  filter: { superEffectiveTaken: 0.75 },
  "solid-rock": { superEffectiveTaken: 0.75 },
  "prism-armor": { superEffectiveTaken: 0.75, unbreakable: true },
  scrappy: { hitsGhostWith: ["normal", "fighting"] },
  "minds-eye": { hitsGhostWith: ["normal", "fighting"] },
  "tinted-lens": { notVeryEffectiveDealt: 2 },
  "mold-breaker": { ignoresDefender: true },
  teravolt: { ignoresDefender: true },
  turboblaze: { ignoresDefender: true },
};

/** The rule for an ability, or null for one that leaves the matchup alone. */
export const abilityRule = (slug: string | null | undefined): AbilityRule | null =>
  slug ? (RULES[slug] ?? null) : null;

/** A Pokémon's abilities in slot order: the regular one or two first, the hidden one last. */
export const abilitiesInOrder = (pokemon: Pokemon): Pokemon["abilities"] =>
  [...pokemon.abilities].sort((x, y) => x.slot - y.slot);

/** The ability a Pokémon is assumed to have: its first regular one. */
export const defaultAbility = (pokemon: Pokemon): string | null => {
  const ordered = abilitiesInOrder(pokemon);
  const regular = ordered.filter((entry) => !entry.is_hidden);
  return (regular[0] ?? ordered[0])?.ability.name ?? null;
};

export const hasAbility = (pokemon: Pokemon, slug: string): boolean =>
  pokemon.abilities.some((entry) => entry.ability.name === slug);
