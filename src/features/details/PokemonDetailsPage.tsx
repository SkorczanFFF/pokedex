import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { NotFoundError } from "@/api/client";
import { getPokemonDetails } from "@/api/pokemon";
import { getPokemonSpecies } from "@/api/species";
import ErrorView from "@/components/ErrorView";
import Loader from "@/components/Loader";
import { NotFound } from "@/features/not-found/NotFound";
import { useEra } from "@/era/context";
import { AbilityList } from "./AbilityList";
import { BackButton } from "./BackButton";
import { EvolutionChain } from "./EvolutionChain";
import { Measurements } from "./Measurements";
import { NotInEra } from "./NotInEra";
import { PokemonArtwork } from "./PokemonArtwork";
import { PokemonHeader } from "./PokemonHeader";
import { StatList } from "./StatList";
import { TypeBadges } from "./TypeBadges";

export const PokemonDetailsPage = () => {
  const { name } = useParams<{ name: string }>();
  const { era } = useEra();

  // Evolution links stay on this route with a different param, so the component
  // is reused rather than remounted — the reset has to follow the name.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [name]);

  const {
    data: pokemon,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pokemon", name],
    queryFn: () => getPokemonDetails(name!),
    enabled: !!name,
  });

  // A link or a bookmark can reach a Pokémon the era does not cover; the dex
  // scope only narrows the list, the search and the filters.
  const outOfEra = pokemon !== undefined && pokemon.id > era.maxDexId;

  // Everything the entry says about the species rather than the specimen: the
  // flavour text, the genus, the generation and the evolution chain. Not worth
  // a request for a Pokémon whose card will not be shown.
  const { data: species } = useQuery({
    queryKey: ["species", pokemon?.id],
    queryFn: () => getPokemonSpecies(pokemon!.id),
    enabled: !!pokemon?.id && !outOfEra,
  });

  if (isLoading) return <Loader />;
  if (error instanceof NotFoundError) return <NotFound />;
  if (error || !pokemon) return <ErrorView errorType="details" />;
  if (outOfEra) return <NotInEra pokemon={pokemon} />;

  return (
    <div className="container mx-auto px-4 pt-8 lg:max-w-7xl pb-12">
      <BackButton />

      <div className="bg-white p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <PokemonArtwork pokemon={pokemon} />

          <div>
            <PokemonHeader pokemon={pokemon} species={species} />
            <TypeBadges pokemon={pokemon} />

            <div className="space-y-6">
              <StatList stats={pokemon.stats} />
              <AbilityList abilities={pokemon.abilities} />
              <Measurements height={pokemon.height} weight={pokemon.weight} />
            </div>
          </div>
        </div>
      </div>

      {species && (
        <EvolutionChain
          chainUrl={species.evolution_chain.url}
          currentId={pokemon.id}
        />
      )}
    </div>
  );
};
