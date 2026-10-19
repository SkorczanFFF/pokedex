import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { speciesQuery } from "@/api/queries";
import { useEra } from "@/app/era/context";
import { PokemonGate } from "@/components/PokemonGate";
import { PageContainer } from "@/components/layout";
import { formSuffix } from "@/domain/evolution";
import { activeSpriteSet } from "@/domain/sprites";
import type { SpriteSetId } from "@/domain/spriteSets";
import { usePokemonStatus } from "@/features/shared/usePokemonStatus";
import { useScrollTopOn } from "@/features/shared/useScrollTopOn";
import { AbilityList } from "./AbilityList";
import { BackButton } from "./BackButton";
import { DexNeighbours } from "./DexNeighbours";
import { EvolutionChain } from "./EvolutionChain";
import { Measurements } from "./Measurements";
import { MoveList } from "./MoveList";
import { PokemonArtwork } from "./PokemonArtwork";
import { PokemonHeader } from "./PokemonHeader";
import { StatList } from "./StatList";
import { TypeBadges } from "./TypeBadges";

export const PokemonDetailsPage = () => {
  const { name } = useParams<{ name: string }>();
  const { era } = useEra();
  // Which picture is up: the reader's pick, or the era's opening shot. Held
  // here rather than in the column because the cry follows it too, and the
  // Cry button sits in the header. Local state all the same — a look at this
  // one Pokémon, not a preference to carry around.
  const [pickedSet, setPickedSet] = useState<SpriteSetId | null>(null);

  // Evolution links stay on this route with a different param, so the component
  // is reused rather than remounted — the reset has to follow the name.
  useScrollTopOn(name);

  const result = usePokemonStatus(name);
  const shown = result.status === "ready" ? result.pokemon : null;

  // Everything the entry says about the species rather than the specimen: the
  // flavour text, the genus, the generation and the evolution chain. Not worth
  // a request for a Pokémon whose card will not be shown.
  const { data: species } = useQuery({
    ...speciesQuery(shown?.species.name),
    enabled: shown !== null,
  });

  return (
    <PokemonGate result={result}>
      {(pokemon) => {
        const spriteSet = activeSpriteSet(pokemon, era, pickedSet);

        return (
          <PageContainer>
            {/* Narrow, the row stacks and the steps centre under the button. A
                column rather than a wrapped row, because `justify-content`
                applies to a whole flex line and a wrapped row cannot start its
                first line and centre its second. From `md` both fit on one
                line, where the button keeps the left and the steps the right. */}
            <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
              <BackButton />
              <div className="self-center">
                <DexNeighbours id={pokemon.id} />
              </div>
            </div>

            <div className="bg-white p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <PokemonArtwork pokemon={pokemon} set={spriteSet} onPick={setPickedSet} />

                <div>
                  <PokemonHeader pokemon={pokemon} species={species} spriteSet={spriteSet} />
                  <TypeBadges pokemon={pokemon} />

                  <div className="space-y-6">
                    <StatList pokemon={pokemon} />
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

            {/* The same two steps again, because the entry runs long: by the
                time the evolution line is on screen the row at the top is a
                scroll away, and a reader who reached the bottom is the one who
                is done and moving on. Centred rather than pushed right, there
                being no back button down here holding the other side. */}
            <div className="mt-8 flex justify-center">
              <DexNeighbours id={pokemon.id} />
            </div>
          </PageContainer>
        );
      }}
    </PokemonGate>
  );
};
