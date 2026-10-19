import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { genApiName, type GenSlug } from "@/domain/dex";
import type { DexEra } from "@/domain/era";
import { pageOffset } from "@/domain/pagination";
import type { PokemonType } from "@/domain/pokemonTypes";
import { matchNames } from "@/domain/search";
import type { Pokemon } from "@/types/pokemon";
import { getPokemonByGeneration } from "./catalog";
import { NotFoundError } from "./client";
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
 * session; the rest keep the client's five-minute default. The composite
 * queries at the bottom — a page of records, a search — read through the
 * per-record ones, so a card's details are already there when it is opened.
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

/**
 * The selected types' member lists, each read through the type's own query so
 * that toggling one type reuses what the other selection — or the chart page —
 * already fetched.
 */
export const typeListsQuery = (types: readonly PokemonType[]) =>
  queryOptions({
    queryKey: ["typeLists", types.join(",")],
    queryFn: ({ client }) =>
      Promise.all(types.map((type) => client.fetchQuery(typeQuery(type)))),
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

/**
 * The records behind a list of names, through the cache.
 *
 * The dex, the filters and the search all end here, and all with one policy.
 * A name that is not a Pokémon's is dropped rather than failing the page: the
 * generation lists carry species names, and a dozen species only ever exist as
 * named forms — `wormadam` 404s where `wormadam-plant` answers. Any other
 * failure is the page's failure, and is thrown so that a dropped connection
 * shows an error rather than a shorter list that pretends to be the answer.
 *
 * `retry: false` is for a caller that already retries at its own level: the
 * search's query retries as a whole, and retrying each record underneath as
 * well multiplied a dead connection into the better part of a minute of
 * skeletons before the error appeared.
 */
const hydratePokemon = async (
  client: QueryClient,
  names: readonly { name: string }[],
  { retry = true }: { retry?: boolean } = {},
): Promise<Pokemon[]> => {
  const settled = await Promise.allSettled(
    names.map((entry) =>
      client.fetchQuery(
        retry ? pokemonQuery(entry.name) : { ...pokemonQuery(entry.name), retry: false },
      ),
    ),
  );
  const found: Pokemon[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") found.push(result.value);
    else if (!(result.reason instanceof NotFoundError)) throw result.reason;
  }
  return found;
};

/** One page of the plain dex as records, narrowed to the era's ids. */
export const pageDetailsQuery = (
  page: number,
  perPage: number,
  era: DexEra,
  names: readonly { name: string }[],
) =>
  queryOptions({
    queryKey: ["pokemonDetails", page, perPage, era.maxDexId],
    queryFn: ({ client }) => hydratePokemon(client, names),
  });

/** One page of a filtered list as records. */
export const filteredDetailsQuery = (
  filters: { typeKey: string; gen: GenSlug | null; page: number; perPage: number },
  era: DexEra,
  names: readonly { name: string }[],
) =>
  queryOptions({
    queryKey: [
      "filteredDetails",
      filters.typeKey,
      filters.gen,
      filters.page,
      filters.perPage,
      era.maxDexId,
    ],
    queryFn: ({ client }) => hydratePokemon(client, names),
  });

/**
 * A search over the name index as records, capped at `limit`. The index is
 * passed in rather than fetched here, because it is held for the session by
 * `allPokemonNamesQuery` and a search must not wait on it twice.
 */
export const searchQuery = (
  query: string,
  era: DexEra,
  index: readonly { name: string; url: string }[],
  limit: number,
) =>
  queryOptions({
    queryKey: ["search", query, era.maxDexId],
    queryFn: ({ client }) => {
      const term = query.trim().toLowerCase();
      if (!term) return Promise.resolve([] as Pokemon[]);
      const matches = matchNames(index, term, era).slice(0, limit);
      // This query retries as a whole, so the records underneath must not.
      return hydratePokemon(client, matches, { retry: false });
    },
  });
