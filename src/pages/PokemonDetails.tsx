import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getPokemonDetails } from "../services/pokemon";
import Loader from "../components/Loader";
import Error from "../components/Error";

export const PokemonDetails = () => {
  const { name } = useParams<{ name: string }>();
  const location = useLocation();

  const previousPage = location.state?.fromPage || 1;

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

  if (isLoading) {
    return <Loader />;
  }

  if (error || !pokemon) {
    return <Error errorType="details" />;
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:max-w-7xl">
      <Link
        to={`/${previousPage}`}
        className="inline-block mb-8 text-black bg-[#FECB09] hover:bg-[#E12025] hover:text-white px-4 py-2"
      >
        Back to List
      </Link>

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
            <h1 className="text-2xl capitalize mb-4">{pokemon.name}</h1>

            <div className="flex gap-2 mb-6">
              {pokemon.types.map((type) => (
                <span
                  key={type.type.name}
                  className="px-4 py-1 text-xs bg-gray-100"
                >
                  {type.type.name}
                </span>
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
