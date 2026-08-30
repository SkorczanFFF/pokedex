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
  };
  types: {
    slot: number;
    type: {
      name: string;
    };
  }[];
  stats: {
    base_stat: number;
    stat: {
      name: string;
    };
  }[];
  height: number;
  weight: number;
  abilities: {
    ability: {
      name: string;
    };
  }[];
  species: { url: string };
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
