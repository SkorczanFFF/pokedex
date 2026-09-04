import type { Pokemon } from "@/types/pokemon";

/**
 * The picture column. Official artwork, falling back to the plain sprite for
 * the handful of forms the artwork set does not cover.
 */
export const PokemonArtwork = ({ pokemon }: { pokemon: Pokemon }) => (
  <div>
    <img
      src={
        pokemon.sprites.other["official-artwork"].front_default ||
        pokemon.sprites.front_default
      }
      alt={pokemon.name}
      className="w-full h-auto"
    />
  </div>
);
