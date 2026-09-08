import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { NotFoundError } from "@/api/client";
import { getPokemonDetails } from "@/api/pokemon";
import { getPokemonSpecies } from "@/api/species";
import { formSuffix } from "@/domain/evolution";
import ErrorView from "@/components/ErrorView";
import Loader from "@/components/Loader";
import { NotFound } from "@/features/not-found/NotFound";
import { useEra } from "@/era/context";
import { AbilityList } from "./AbilityList";
import { BackButton } from "./BackButton";
import { DexNeighbours } from "./DexNeighbours";
import { EvolutionChain } from "./EvolutionChain";
import { Measurements } from "./Measurements";
import { MoveList } from "./MoveList";
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
    queryKey: ["species", pokemon?.species.name],
    queryFn: () => getPokemonSpecies(pokemon!.species.name),
    enabled: !!pokemon?.species.name && !outOfEra,
  });

  if (isLoading) return <Loader />;
  if (error instanceof NotFoundError) return <NotFound />;
  if (error || !pokemon) return <ErrorView errorType="details" />;
  if (outOfEra) return <NotInEra pokemon={pokemon} />;

  return (
    <div className="container mx-auto px-4 pt-8 lg:max-w-7xl pb-12">
      {/* Narrow, the row stacks and the steps centre under the button. A
          column rather than a wrapped row, because `justify-content` applies to
          a whole flex line and a wrapped row cannot start its first line and
          centre its second. From `md` both fit on one line, where the button
          keeps the left and the steps the right. */}
      <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <BackButton />
        <div className="self-center">
          <DexNeighbours id={pokemon.id} />
        </div>
      </div>

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

      <MoveList pokemon={pokemon} />

      {species && (
        <EvolutionChain
          chainUrl={species.evolution_chain.url}
          currentId={pokemon.id}
          formSuffix={formSuffix(pokemon.name, pokemon.species.name)}
        />
      )}

      {/* The same two steps again, because the entry runs long: by the time the
          evolution line is on screen the row at the top is a scroll away, and a
          reader who reached the bottom is the one who is done and moving on.
          Centred rather than pushed right, there being no back button down here
          holding the other side of the row. */}
      <div className="mt-8 flex justify-center">
        <DexNeighbours id={pokemon.id} />
      </div>
    </div>
  );
};
