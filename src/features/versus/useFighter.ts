import { usePokemonStatus } from "@/features/shared/usePokemonStatus";
import type { Fighter, Side } from "./model";

/** One slot of the battle: the Pokémon the URL names for that side, and where it stands. */
export const useFighter = (side: Side, name: string | null): Fighter => {
  const result = usePokemonStatus(name);
  if (result.pokemon) {
    return { side, name: name ?? result.pokemon.name, pokemon: result.pokemon, status: result.status };
  }
  return { side, name, pokemon: null, status: result.status };
};
