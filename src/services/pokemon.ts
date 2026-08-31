import type {
  EvolutionChainResponse,
  Pokemon,
  PokemonGenerationResponse,
  PokemonListResponse,
  PokemonSpecies,
  PokemonTypeResponse,
} from "../types/pokemon";

const API_URL = "https://pokeapi.co/api/v2";

/**
 * The API answered and the resource genuinely is not there — as opposed to a
 * transport or server failure, which is worth retrying. Callers use the
 * distinction to show a 404 rather than an error, and to stop React Query
 * retrying an answer that will not change.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export const getPokemonList = async (
  limit = 20,
  offset = 0
): Promise<PokemonListResponse> => {
  const response = await fetch(
    `${API_URL}/pokemon?limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch Pokemon list");
  }
  return response.json();
};

/** Name of the default form behind a species slug, or null if there is no such species. */
const getDefaultVariety = async (species: string): Promise<string | null> => {
  const response = await fetch(`${API_URL}/pokemon-species/${species}`);
  if (!response.ok) return null;
  const data: PokemonSpecies = await response.json();
  return data.varieties.find((v) => v.is_default)?.pokemon.name ?? null;
};

export const getPokemonDetails = async (name: string): Promise<Pokemon> => {
  const response = await fetch(`${API_URL}/pokemon/${name}`);
  if (response.ok) {
    return response.json();
  }
  if (response.status !== 404) {
    throw new Error(`Failed to fetch Pokemon ${name}`);
  }

  // A dozen Pokédex species only ever exist as named forms, so /pokemon/wormadam
  // 404s while /pokemon/wormadam-plant works. Anything holding a species slug —
  // an evolution chain, the generation filter — would otherwise dead-end here,
  // so resolve the species' default variety and retry once.
  const fallback = await getDefaultVariety(name);
  if (!fallback || fallback === name) {
    throw new NotFoundError(`No Pokemon named ${name}`);
  }

  const retry = await fetch(`${API_URL}/pokemon/${fallback}`);
  if (!retry.ok) {
    throw new Error(`Failed to fetch Pokemon ${name}`);
  }
  return retry.json();
};

export const getAllPokemonNames = async (): Promise<
  { name: string; url: string }[]
> => {
  const response = await fetch(`${API_URL}/pokemon?limit=2000`);
  if (!response.ok) {
    throw new Error("Failed to fetch all Pokemon names");
  }

  const data: PokemonListResponse = await response.json();
  return data.results;
};

export const getPokemonByType = async (
  typeName: string
): Promise<PokemonTypeResponse> => {
  const response = await fetch(`${API_URL}/type/${typeName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch type ${typeName}`);
  }
  return response.json();
};

export const getPokemonByGeneration = async (
  generationName: string
): Promise<PokemonGenerationResponse> => {
  const response = await fetch(`${API_URL}/generation/${generationName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch generation ${generationName}`);
  }
  return response.json();
};

export const getPokemonSpecies = async (
  id: number
): Promise<PokemonSpecies> => {
  const response = await fetch(`${API_URL}/pokemon-species/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch species ${id}`);
  }
  return response.json();
};

export const getEvolutionChain = async (
  id: number
): Promise<EvolutionChainResponse> => {
  const response = await fetch(`${API_URL}/evolution-chain/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch evolution chain ${id}`);
  }
  return response.json();
};

const pickLang = <T>(
  arr: T[],
  getLang: (x: T) => string,
  preferred: readonly string[]
): T | undefined => {
  for (const lang of preferred) {
    const hit = arr.find((x) => getLang(x) === lang);
    if (hit) return hit;
  }
  return undefined;
};

// PokéAPI serves no Polish — its /language list has no `pl` — so a Polish UI
// always falls through to English here. That is permanent, not a gap to fill.
const preferredLangs = (locale: string): readonly string[] => [locale, "en"];

export const getDescription = (s: PokemonSpecies, locale = "en"): string =>
  pickLang(s.flavor_text_entries, (e) => e.language.name, preferredLangs(locale))
    ?.flavor_text.replace(/[\f\n\r\u00ad]/g, " ")
    .trim() ?? "";

export const getGenus = (s: PokemonSpecies, locale = "en"): string =>
  pickLang(s.genera, (g) => g.language.name, preferredLangs(locale))?.genus ?? "";

/** Raw generation slug (e.g. `generation-i`), or null. Display formatting is the UI's job. */
export const getGeneration = (s: PokemonSpecies): string | null => {
  const raw = s.generation?.name ?? "";
  return raw.startsWith("generation-") ? raw : null;
};
