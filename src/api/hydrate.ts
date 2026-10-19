import type { QueryClient } from "@tanstack/react-query";
import type { Pokemon } from "@/types/pokemon";
import { NotFoundError } from "./client";
import { pokemonQuery } from "./queries";

/**
 * The records behind a list of names, through the cache, so a card's details
 * are already there when it is opened.
 *
 * The list, the filters and the search all end here, and all with one policy.
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
export const hydratePokemon = async (
  queryClient: QueryClient,
  names: readonly { name: string }[],
  { retry = true }: { retry?: boolean } = {},
): Promise<Pokemon[]> => {
  const settled = await Promise.allSettled(
    names.map((entry) =>
      queryClient.fetchQuery(
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
