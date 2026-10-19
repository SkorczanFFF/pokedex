import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { encountersQuery } from "@/api/queries";
import { useEra } from "@/app/era/context";
import { pokemonPath } from "@/app/routes";
import { Chip, ChipRow } from "@/components/Chip";
import Loader from "@/components/Loader";
import { PokemonGate } from "@/components/PokemonGate";
import { ACTION_LG, MORE } from "@/components/buttons";
import { EmptyState, PageContainer } from "@/components/layout";
import {
  gamesInEra,
  placesInEra,
  splitArea,
  type EncounterPlace,
  type EncounterRow,
} from "@/domain/encounters";
import { spriteUrl } from "@/domain/sprites";
import { usePokemonStatus } from "@/features/shared/usePokemonStatus";
import { useScrollTopOn } from "@/features/shared/useScrollTopOn";
import {
  humanize,
  useEncounterConditionLabel,
  useEncounterMethodLabel,
  useGameLabel,
} from "@/i18n/labels";

/** Kept short so the first screen is places rather than a wall of them. */
const PLACES_SHOWN = 12;

/**
 * Where a Pokémon is met, as the era's games have it.
 *
 * A route of its own rather than a section on the details page, because the
 * answer runs long — Magikarp is found in seventy-four areas in the Gen II
 * games alone — and because "where do I catch it" is a question worth its own
 * address. It costs no request of its own: the details page has already asked
 * for the encounters to decide whether to offer the link here, so this arrives
 * on a warm cache.
 */
export const EncountersPage = () => {
  const { name } = useParams<{ name: string }>();
  const { t } = useTranslation();
  const { era } = useEra();
  const location = useLocation();
  const [game, setGame] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // The route keeps this component mounted across a change of `:name`, so
  // everything that belongs to one Pokémon has to be put back by hand —
  // otherwise Magikarp's expanded list and picked game carry over to the next.
  useScrollTopOn(name);
  useEffect(() => {
    setGame(null);
    setShowAll(false);
  }, [name]);

  const result = usePokemonStatus(name);
  const { data: encounters, isLoading: loadingPlaces } = useQuery(
    encountersQuery(name),
  );

  if (loadingPlaces) return <Loader />;

  const games = encounters ? gamesInEra(encounters, era) : [];
  // A game picked in one era may not exist in another; fall back to all of them
  // rather than to an empty page.
  const picked = game !== null && games.includes(game) ? game : null;
  const places = encounters ? placesInEra(encounters, era, picked) : [];
  const shown = showAll ? places : places.slice(0, PLACES_SHOWN);
  const rest = places.length - shown.length;

  return (
    <PokemonGate result={result}>
      {(pokemon) => {
        const sprite = spriteUrl(pokemon, era.sprites) ?? spriteUrl(pokemon, "artwork");

        return (
          <PageContainer>
            <Link
              to={pokemonPath(pokemon.name)}
              state={location.state}
              className={`inline-block mb-8 ${ACTION_LG}`}
            >
              {t("encounters.back", { name: humanize(pokemon.name) })}
            </Link>

            <section className="bg-white p-6">
              <div className="flex items-center gap-4 mb-6">
                {sprite && (
                  <img
                    src={sprite}
                    alt={pokemon.name}
                    className={`h-16 w-16 object-contain ${
                      era.pixelArt ? "[image-rendering:pixelated]" : ""
                    }`}
                  />
                )}
                <div>
                  <h1 className="text-lg capitalize">{pokemon.name}</h1>
                  <p className="mt-2 text-xs text-gray-500">
                    {t("encounters.title")} · {t("encounters.places", { count: places.length })}
                  </p>
                </div>
              </div>

              {places.length === 0 ? (
                <EmptyState>
                  <p className="text-xs leading-relaxed">{t("encounters.none")}</p>
                  <p className="mt-3 text-[10px] leading-relaxed text-gray-500">
                    {t("encounters.noneHint")}
                  </p>
                </EmptyState>
              ) : (
                <>
                  {games.length > 1 && (
                    <GamePicker games={games} picked={picked} onPick={setGame} />
                  )}

                  <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
                    {shown.map((place) => (
                      <Place key={place.area} place={place} />
                    ))}
                  </div>

                  {(rest > 0 || showAll) && (
                    <button
                      type="button"
                      onClick={() => setShowAll(!showAll)}
                      aria-expanded={showAll}
                      className={`mt-8 ${MORE}`}
                    >
                      {showAll
                        ? t("encounters.showLess")
                        : t("encounters.showMore", { count: rest })}
                    </button>
                  )}
                </>
              )}
            </section>
          </PageContainer>
        );
      }}
    </PokemonGate>
  );
};

const GamePicker = ({
  games,
  picked,
  onPick,
}: {
  games: string[];
  picked: string | null;
  onPick: (game: string | null) => void;
}) => {
  const { t } = useTranslation();
  const gameLabel = useGameLabel();

  return (
    <ChipRow label={t("encounters.title")} className="mb-6">
      <Chip kind="game" active={picked === null} onClick={() => onPick(null)}>
        {t("encounters.allGames")}
      </Chip>
      {games.map((game) => (
        <Chip
          key={game}
          kind="game"
          active={picked === game}
          onClick={() => onPick(game)}
        >
          {gameLabel(game)}
        </Chip>
      ))}
    </ChipRow>
  );
};

const Place = ({ place }: { place: EncounterPlace }) => {
  const { region, rest } = splitArea(place.area);

  return (
    <div>
      <h2 className="text-sm leading-relaxed">
        {humanize(rest)}
        {region && (
          <span className="ml-2 text-[10px] text-gray-500">
            {humanize(region)}
          </span>
        )}
      </h2>
      <ul className="mt-3 space-y-2">
        {place.rows.map((row, index) => (
          <Row key={`${row.method}-${row.chance}-${index}`} row={row} />
        ))}
      </ul>
    </div>
  );
};

const Row = ({ row }: { row: EncounterRow }) => {
  const { t } = useTranslation();
  const methodLabel = useEncounterMethodLabel();
  const conditionLabel = useEncounterConditionLabel();
  const gameLabel = useGameLabel();

  const levels =
    row.minLevel === row.maxLevel
      ? t("encounters.level", { level: row.minLevel })
      : t("encounters.levelRange", { min: row.minLevel, max: row.maxLevel });

  return (
    <li className="text-xs leading-relaxed">
      {/* The games first and on their own line: which game is the question a
          reader came with, and run into the method it turns to mush. */}
      <p className="text-[10px] text-gray-500">
        {row.games.map(gameLabel).join(" · ")}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span>{methodLabel(row.method)}</span>
        <span className="text-gray-500">{levels}</span>
        {/* Rates above 100 would mean the slots were added across conditions
            that exclude each other, which is exactly what this app refuses to
            print. They should not occur — the sum is taken inside one set of
            conditions — so this is a guard rather than a case. */}
        {row.chance > 0 && row.chance <= 100 && (
          <span>{t("encounters.chance", { chance: row.chance })}</span>
        )}
      </div>
      {row.conditions.length > 0 && (
        <p className="mt-1 text-[10px] text-gray-500">
          {row.conditions
            .map((set) => set.map(conditionLabel).join(", "))
            .join(" · ")}
        </p>
      )}
    </li>
  );
};
