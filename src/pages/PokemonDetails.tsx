import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  getDescription,
  getGeneration,
  getGenus,
  getPokemonDetails,
  getPokemonSpecies,
} from "../services/pokemon";
import { typeClass } from "../utils/types";
import Loader from "../components/Loader";
import ErrorView from "../components/ErrorView";

export const PokemonDetails = () => {
  const { name } = useParams<{ name: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const navState =
    (location.state as { from?: string; scrollY?: number } | null) ?? null;
  const backTo = navState?.from ?? "/";

  const handleBack = () => {
    navigate(backTo, {
      state:
        typeof navState?.scrollY === "number"
          ? { restoreScroll: navState.scrollY }
          : null,
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const {
    data: pokemon,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => getPokemonDetails(name!),
    enabled: !!name,
  });

  const { data: species } = useQuery({
    queryKey: ["species", pokemon?.id],
    queryFn: () => getPokemonSpecies(pokemon!.id),
    enabled: !!pokemon?.id,
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error || !pokemon) {
    return <ErrorView errorType="details" />;
  }

  const playCry = () => {
    if (!pokemon.cries?.latest) return;
    const audio = new Audio(pokemon.cries.latest);
    audio.volume = 0.3;
    audio.play().catch(() => {
      /* user-gesture missing or autoplay blocked */
    });
  };

  const description = species ? getDescription(species) : "";
  const genus = species ? getGenus(species) : "";
  const generation = species ? getGeneration(species) : "";
  const meta = [generation, genus].filter(Boolean).join(" · ");

  return (
    <div className="container mx-auto px-4 pt-8 lg:max-w-7xl pb-12">
      <button
        onClick={handleBack}
        className="inline-block mb-8 text-black bg-[#FECB09] hover:bg-[#E12025] hover:text-white px-4 py-2 cursor-pointer"
      >
        Back to List
      </button>

      <div className="bg-white p-6">
        <div className="grid md:grid-cols-2 gap-8">
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

          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h1 className="text-2xl capitalize">{pokemon.name}</h1>
              {pokemon.cries?.latest && (
                <button
                  onClick={playCry}
                  aria-label={`Play ${pokemon.name} cry`}
                  className="text-xs px-2 py-1 bg-[#FECB09] hover:bg-[#E12025] hover:text-white cursor-pointer"
                >
                  ▶ Cry
                </button>
              )}
            </div>

            {meta && (
              <p className="text-xs text-gray-500 mb-3">{meta}</p>
            )}
            {description && (
              <p className="text-xs leading-relaxed mb-6">{description}</p>
            )}

            <div className="flex gap-2 mb-6">
              {pokemon.types.map((type) => (
                <Link
                  key={type.type.name}
                  to={`/?type=${type.type.name}`}
                  aria-label={`Show all ${type.type.name} type Pokémon`}
                  className={`px-4 py-1 text-xs cursor-pointer hover:opacity-80 ${typeClass(
                    type.type.name
                  )}`}
                >
                  {type.type.name}
                </Link>
              ))}
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg mb-3">Stats</h2>
                <div className="space-y-3">
                  {pokemon.stats.map((stat) => (
                    <div
                      key={stat.stat.name}
                      className="flex items-center gap-2 flex-col md:flex-row"
                    >
                      <span className="w-full md:w-32 capitalize text-xs">
                        {stat.stat.name}:
                      </span>
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex w-full h-4 bg-[#EAEBF2] overflow-hidden">
                          <div
                            className="h-full bg-[#356DB2]"
                            style={{
                              width: `${(stat.base_stat / 160) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="ml-0 md:ml-2 w-12 text-right text-xs">
                          {stat.base_stat}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg mb-3">Abilities</h2>
                <div className="flex flex-wrap gap-2">
                  {pokemon.abilities.map((ability) => (
                    <span
                      key={ability.ability.name}
                      className="px-3 py-1 bg-gray-100 capitalize text-xs"
                    >
                      {ability.ability.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h2 className="text-lg  mb-2">Height</h2>
                  <p className=" text-xs">{pokemon.height / 10} m</p>
                </div>
                <div>
                  <h2 className="text-lg mb-2">Weight</h2>
                  <p className=" text-xs">{pokemon.weight / 10} kg</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
