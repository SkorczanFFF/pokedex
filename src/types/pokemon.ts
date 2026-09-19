export interface PokemonTypeSlot {
  slot: number;
  type: {
    name: string;
  };
}

/** A typing the Pokemon carried up to and including `generation`. */
export interface PokemonPastTypes {
  generation: { name: string };
  types: PokemonTypeSlot[];
}

export interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    other: {
      "official-artwork": {
        front_default: string;
      };
    };
    /** Sprite sets by generation and game, keyed "generation-ii" / "crystal". */
    versions?: Record<
      string,
      Record<string, { front_default: string | null }>
    >;
  };
  types: PokemonTypeSlot[];
  past_types?: PokemonPastTypes[];
  stats: {
    base_stat: number;
    stat: {
      name: string;
    };
  }[];
  /**
   * Read like `past_types` — each entry holds what stood *through* the
   * generation it names — with one difference: an entry carries only the stats
   * that changed, so several of them can apply to one era at once.
   */
  past_stats?: {
    generation: { name: string };
    stats: {
      base_stat: number;
      stat: { name: string };
    }[];
  }[];
  height: number;
  weight: number;
  abilities: {
    ability: {
      name: string;
    };
  }[];
  species: { name: string; url: string };
  moves: {
    move: { name: string; url: string };
    version_group_details: {
      level_learned_at: number;
      version_group: { name: string };
      move_learn_method: { name: string };
    }[];
  }[];
  cries: { latest: string | null; legacy: string | null };
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    name: string;
    url: string;
  }[];
}

export interface PokemonTypeResponse {
  name: string;
  pokemon: {
    pokemon: { name: string; url: string };
    slot: number;
  }[];
}

export interface PokemonGenerationResponse {
  id: number;
  name: string;
  main_region: { name: string; url: string };
  pokemon_species: { name: string; url: string }[];
}

export interface PokemonSpecies {
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
  genera: { genus: string; language: { name: string } }[];
  generation: { name: string };
  habitat: { name: string } | null;
  evolution_chain: { url: string };
  varieties: { is_default: boolean; pokemon: { name: string } }[];
}

/** One row of `evolution_details` — the conditions attached to a single step. */
export interface EvolutionDetail {
  version_group: { name: string; url: string };
  trigger: { name: string };
  item: { name: string } | null;
  held_item: { name: string } | null;
  known_move: { name: string } | null;
  known_move_type: { name: string } | null;
  location: { name: string } | null;
  party_species: { name: string } | null;
  party_type: { name: string } | null;
  trade_species: { name: string } | null;
  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  gender: number | null;
  time_of_day: string;
  needs_overworld_rain: boolean;
  turn_upside_down: boolean;
  relative_physical_stats: number | null;
  /**
   * Which forms this step runs between. A species shares one chain with its
   * regional variants, and these are what tell them apart: Alolan Sandshrew's
   * Ice Stone step names `sandshrew-alola`, while Kantonian Sandshrew's
   * level-22 step names nobody at all.
   */
  base_form: { name: string } | null;
  evolved_form: { name: string } | null;
  /** Set instead of `base_form` when the parent has no variant to name. */
  region: { name: string } | null;
}

/** A node of the evolution tree. Branches (Eevee) mean several `evolves_to`. */
export interface EvolutionLink {
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionLink[];
}

export interface EvolutionChainResponse {
  id: number;
  chain: EvolutionLink;
}

/** What a move's numbers were before they were last changed. */
export interface MovePastValues {
  version_group: { name: string };
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effect_chance: number | null;
  type: { name: string } | null;
}

export interface Move {
  id: number;
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  effect_chance: number | null;
  type: { name: string };
  damage_class: { name: string };
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version_group: { name: string };
  }[];
  /**
   * Read the same way as a Pokémon's `past_types`: each entry holds the values
   * that stood through the version group it names. Thunderbolt was 95 power
   * until X and Y, Tackle 35 with 95 accuracy until Black and White.
   */
  past_values: MovePastValues[];
}

/** One slot in one area in one game: a level band, a rate and what it takes. */
export interface EncounterDetail {
  min_level: number;
  max_level: number;
  chance: number;
  method: { name: string };
  condition_values: { name: string }[];
}

export interface VersionEncounter {
  version: { name: string };
  /**
   * The sum of every slot's chance, which double-counts conditions that exclude
   * each other — Zubat's Dark Cave reads 132 in Crystal because day, morning
   * and night are counted one after another. Never display it.
   */
  max_chance: number;
  encounter_details: EncounterDetail[];
}

export interface LocationEncounter {
  location_area: { name: string };
  version_details: VersionEncounter[];
}
