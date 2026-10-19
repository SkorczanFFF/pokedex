import { queryOptions } from "@tanstack/react-query";
import { genApiName, type GenSlug } from "@/domain/dex";
import { pageOffset } from "@/domain/pagination";
import { getPokemonByGeneration } from "./catalog";
import { getEncounters } from "./encounters";
import { getEvolutionChain } from "./evolution";
import { getMove } from "./moves";
import {
  getAllPokemonNames,
  getDexWindow,
  getPokemonDetails,
  getPokemonList,
} from "./pokemon";
import { getPokemonSpecies } from "./species";
import { getType } from "./types";

/**
 * Every resource the app reads, defined once.
 *
 * React Query is the shared store: two components asking for the same key get
 * one request and one cache entry. What that needs is that they spell the key
 * the same way, which is what these are for — the details page, the Versus
 * page and the search all read `pokemonQuery(name)` rather than each writing
 * `["pokemon", name]` by hand. A resource that never changes is held for the
 * session; the rest keep the client's five-minute default.
 */

/** One Pokémon. Takes a missing name so a route can ask before it has one. */
export const pokemonQuery = (name: string | null | undefined) =>
  queryOptions({
    queryKey: ["pokemon", name ?? null],
    queryFn: () => getPokemonDetails(name!),
    enabled: !!name,
  });

/** The whole name index: 1351 names, 11.5 kB, the one request search needs. */
export const allPokemonNamesQuery = queryOptions({
  queryKey: ["allPokemonNames"],
  queryFn: getAllPokemonNames,
  staleTime: Infinity,
  gcTime: Infinity,
});

/** One page of the dex index. */
export const pokemonListQuery = (page: number, perPage: number) =>
  queryOptions({
    queryKey: ["pokemonList", page, perPage],
    queryFn: () => getPokemonList(perPage, pageOffset(page, perPage)),
  });

/** The three index entries around a dex id. */
export const dexWindowQuery = (id: number) =>
  queryOptions({
    queryKey: ["dexWindow", id],
    queryFn: () => getDexWindow(id),
    staleTime: Infinity,
  });

/**
 * One type: its damage relations for the chart and its member list for the
 * filter, out of a single request.
 */
export const typeQuery = (name: string) =>
  queryOptions({
    queryKey: ["type", name],
    queryFn: () => getType(name),
    staleTime: Infinity,
  });

/** The species of a generation, for the filter. */
export const genListQuery = (gen: GenSlug | null) =>
  queryOptions({
    queryKey: ["genList", gen],
    queryFn: () => getPokemonByGeneration(genApiName(gen!)),
    enabled: gen !== null,
    staleTime: Infinity,
  });

export const speciesQuery = (name: string | undefined) =>
  queryOptions({
    queryKey: ["species", name ?? null],
    queryFn: () => getPokemonSpecies(name!),
    enabled: !!name,
  });

export const encountersQuery = (name: string | null | undefined) =>
  queryOptions({
    queryKey: ["encounters", name ?? null],
    queryFn: () => getEncounters(name!),
    enabled: !!name,
    staleTime: Infinity,
  });

export const evolutionChainQuery = (id: number) =>
  queryOptions({
    queryKey: ["evolutionChain", id],
    queryFn: () => getEvolutionChain(id),
    enabled: id > 0,
    staleTime: Infinity,
  });

export const moveQuery = (name: string) =>
  queryOptions({
    queryKey: ["move", name],
    queryFn: () => getMove(name),
    staleTime: Infinity,
  });
