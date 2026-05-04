import type {
  Pokemon,
  PokemonGenerationResponse,
  PokemonListResponse,
  PokemonSpecies,
  PokemonTypeResponse,
} from "../types/pokemon";
import { formatGen } from "../utils/generations";

const API_URL = "https://pokeapi.co/api/v2";

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

export const getPokemonDetails = async (name: string): Promise<Pokemon> => {
  const response = await fetch(`${API_URL}/pokemon/${name}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon ${name}`);
  }
  return response.json();
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

const pickEnglish = <T,>(
  arr: T[],
  lang: (x: T) => string
): T | undefined => arr.find((x) => lang(x) === "en");

export const getDescription = (s: PokemonSpecies): string =>
  pickEnglish(s.flavor_text_entries, (e) => e.language.name)
    ?.flavor_text.replace(/[\f\n\r\u00ad]/g, " ")
    .trim() ?? "";

export const getGenus = (s: PokemonSpecies): string =>
  pickEnglish(s.genera, (g) => g.language.name)?.genus ?? "";

export const getGeneration = (s: PokemonSpecies): string => {
  const raw = s.generation?.name ?? "";
  return raw.startsWith("generation-") ? formatGen(raw) : "";
};
