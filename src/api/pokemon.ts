import type { Pokemon, PokemonListResponse } from "@/types/pokemon";
import { get, NotFoundError, request } from "./client";
import { getDefaultVariety } from "./species";

export const getPokemonList = (
  limit = 20,
  offset = 0
): Promise<PokemonListResponse> =>
  get<PokemonListResponse>(
    `pokemon?limit=${limit}&offset=${offset}`,
    "Failed to fetch Pokemon list"
  );

/**
 * The three entries around a dex id, which is the only thing standing between
 * an id and the name the route is written in.
 *
 * `/pokemon` is ordered by id and its offsets are that order, so entry `id - 1`
 * is the Pokémon with that id — checked at both ends of the national dex and at
 * the seam where it stops. Three of them cost 142 bytes over the wire against
 * the 11.5 kB of the whole catalogue, and the caller reads the ids back out of
 * the URLs rather than trusting the position, so a shift in that ordering shows
 * up as a missing button and never as a wrong link.
 */
export const getDexWindow = (id: number): Promise<PokemonListResponse> =>
  getPokemonList(3, Math.max(0, id - 2));

export const getPokemonDetails = async (name: string): Promise<Pokemon> => {
  const response = await request(`pokemon/${name}`);
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

  return get<Pokemon>(`pokemon/${fallback}`, `Failed to fetch Pokemon ${name}`);
};

export const getAllPokemonNames = async (): Promise<
  { name: string; url: string }[]
> => {
  const data = await get<PokemonListResponse>(
    "pokemon?limit=2000",
    "Failed to fetch all Pokemon names"
  );
  return data.results;
};
