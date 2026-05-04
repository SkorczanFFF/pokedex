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
}
