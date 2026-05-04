import { useLocation, useNavigate } from "react-router-dom";
import type { Pokemon } from "../types/pokemon";
import { typeClass } from "../utils/types";
import { formatGen, generationFromId } from "../utils/generations";

interface PokemonCardProps {
  pokemon: Pokemon;
}

export const PokemonCard = ({ pokemon }: PokemonCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const imageUrl =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;
  const target = `/pokemon/${pokemon.name}`;
  const gen = generationFromId(pokemon.id);

  // Manual click handler so scrollY is captured at click time.
  // Link's `state` prop is fixed at render time, which produces a stale 0.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    navigate(target, {
      state: {
        from: `${location.pathname}${location.search}`,
        scrollY: window.scrollY,
      },
    });
  };

  return (
    <a
      href={target}
      onClick={handleClick}
      className="block bg-white p-4 hover:translate-y-[-10px]"
    >
      <div className="aspect-square relative">
        <img
          src={imageUrl}
          alt={pokemon.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
        {gen && (
          <>
            <span className="absolute top-[1px] right-[-1px] text-white text-[10px] leading-none px-2 py-1">
              {formatGen(gen)}
            </span>
            <span className="absolute top-0 right-0 text-black text-[10px] leading-none px-2 py-1">
              {formatGen(gen)}
            </span>
          </>
        )}
      </div>
      <div className="mt-4">
        <h2 className="text-lg capitalize leading-relaxed">{pokemon.name}</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {pokemon.types.map((type) => (
            <span
              key={type.type.name}
              className={`px-2 py-1 text-xs ${typeClass(type.type.name)}`}
            >
              {type.type.name}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
};
