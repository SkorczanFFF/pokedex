import { useQuery } from "@tanstack/react-query";
import { NotFoundError } from "@/api/client";
import { pokemonQuery } from "@/api/queries";
import { useEra } from "@/app/era/context";
import { isInEra } from "@/domain/era";
import type { Pokemon } from "@/types/pokemon";

/** Where a page stands with the Pokémon it was asked for. */
export type PokemonStatus =
  | { status: "empty" | "loading" | "notFound" | "error"; pokemon: null }
  | { status: "outOfEra" | "ready"; pokemon: Pokemon };

/**
 * A Pokémon by name, read the way every page reads one: still on its way, not
 * a Pokémon at all, failed to arrive, here but outside the era, or here. The
 * details page, the encounters page and both of Versus' slots ask the same
 * question and used to answer it in their own words.
 */
export const usePokemonStatus = (name: string | null | undefined): PokemonStatus => {
  const { era } = useEra();
  const { data, isLoading, error } = useQuery(pokemonQuery(name));

  if (!name) return { status: "empty", pokemon: null };
  if (isLoading) return { status: "loading", pokemon: null };
  if (error instanceof NotFoundError) return { status: "notFound", pokemon: null };
  if (error || !data) return { status: "error", pokemon: null };
  // A link or a bookmark can reach a Pokémon the era does not cover; the dex
  // scope only narrows the list, the search and the filters.
  return { status: isInEra(data.id, era) ? "ready" : "outOfEra", pokemon: data };
};
