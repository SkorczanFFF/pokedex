import type { NamedApiResource } from "./pokemon";

/** What one type's attacks do to the others, and the others' to it. */
export interface DamageRelations {
  no_damage_to: { name: string }[];
  half_damage_to: { name: string }[];
  double_damage_to: { name: string }[];
  no_damage_from: { name: string }[];
  half_damage_from: { name: string }[];
  double_damage_from: { name: string }[];
}

/** PokéAPI's `/type/{name}`, the part of it the chart reads. */
export interface TypeResource {
  name: string;
  /** Every Pokémon of this type, which the list's filter reads. */
  pokemon: { pokemon: NamedApiResource; slot: number }[];
  /** The generation the type arrived in. */
  generation: { name: string };
  /** The relations in force today. */
  damage_relations: DamageRelations;
  /**
   * Earlier relations, each in force *through* the generation it names: Ghost
   * carries one through Gen I, when Psychic took nothing from it, and one
   * through Gen V, when Steel still resisted it.
   */
  past_damage_relations: {
    generation: { name: string };
    damage_relations: DamageRelations;
  }[];
}
