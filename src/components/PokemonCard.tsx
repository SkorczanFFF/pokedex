import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Pokemon } from "../types/pokemon";
import { typeClass } from "@/domain/types";
import { genRoman, generationFromId } from "@/domain/dex";
import { useTypeLabel } from "../i18n/domain";

interface PokemonCardProps {
  pokemon: Pokemon;
}

export const PokemonCard = ({ pokemon }: PokemonCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();
  const imageUrl =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;
  const target = `/pokemon/${pokemon.name}`;
  const gen = generationFromId(pokemon.id);
  const genBadge = gen ? t("gen.badge", { roman: genRoman(gen) }) : null;

  // Manual click handler so scrollY is captured at click time.
  // Link's `state` prop is fixed at render time, which produces a stale 0.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
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
        <span className="absolute top-[1px] left-[-1px] text-white text-[10px] leading-none px-2 py-1">
          {pokemon.id}
        </span>
        <span className="absolute top-0 left-0 text-black text-[10px] leading-none px-2 py-1">
          {pokemon.id}
        </span>
        {gen && (
          <>
            {/* Offset copy acts as a text shadow — hidden from screen readers
                so the badge is not announced twice. */}
            <span
              aria-hidden="true"
              className="absolute top-[1px] right-[-1px] text-white text-[10px] leading-none px-2 py-1"
            >
              {genBadge}
            </span>
            <span className="absolute top-0 right-0 text-black text-[10px] leading-none px-2 py-1">
              {genBadge}
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
              className={`px-2 py-1 text-[10px] leading-4 ${typeClass(type.type.name)}`}
            >
              {typeLabel(type.type.name)}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
};
