import { Link } from "react-router-dom";
import type { Pokemon } from "../types/pokemon";

interface PokemonCardProps {
  pokemon: Pokemon;
}

export const PokemonCard = ({ pokemon }: PokemonCardProps) => {
  const imageUrl =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;

  return (
    <Link
      to={`/pokemon/${pokemon.name}`}
      className="block bg-white p-4 hover:translate-y-[-10px]"
    >
      <div className="aspect-square">
        <img
          src={imageUrl}
          alt={pokemon.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="mt-4">
        <h2 className="text-lg  capitalize leading-relaxed">{pokemon.name}</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {pokemon.types.map((type) => (
            <span
              key={type.type.name}
              className="px-2 py-1 text-xs bg-gray-100"
            >
              {type.type.name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};
