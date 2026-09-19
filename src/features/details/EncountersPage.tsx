import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { NotFoundError } from "@/api/client";
import { getEncounters } from "@/api/encounters";
import { getPokemonDetails } from "@/api/pokemon";
import ErrorView from "@/components/ErrorView";
import Loader from "@/components/Loader";
import {
  gamesInEra,
  placesInEra,
  splitArea,
  type EncounterPlace,
  type EncounterRow,
} from "@/domain/encounters";
import { spriteUrl } from "@/domain/pokemonView";
import { useEra } from "@/era/context";
import { NotFound } from "@/features/not-found/NotFound";
import {
  humanize,
  useEncounterConditionLabel,
  useEncounterMethodLabel,
} from "@/i18n/labels";
import { NotInEra } from "./NotInEra";

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
  useEffect(() => {
    window.scrollTo(0, 0);
    setGame(null);
    setShowAll(false);
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

  const { data: encounters, isLoading: loadingPlaces } = useQuery({
    queryKey: ["encounters", name],
    queryFn: () => getEncounters(name!),
    enabled: !!name,
    staleTime: Infinity,
  });

  if (isLoading || loadingPlaces) return <Loader />;
  if (error instanceof NotFoundError) return <NotFound />;
  if (error || !pokemon) return <ErrorView errorType="details" />;
  if (pokemon.id > era.maxDexId) return <NotInEra pokemon={pokemon} />;

  const games = encounters ? gamesInEra(encounters, era) : [];
  // A game picked in one era may not exist in another; fall back to all of them
  // rather than to an empty page.
  const picked = game !== null && games.includes(game) ? game : null;
  const places = encounters ? placesInEra(encounters, era, picked) : [];
  const shown = showAll ? places : places.slice(0, PLACES_SHOWN);
  const rest = places.length - shown.length;

  const sprite = spriteUrl(pokemon, era.sprites) ?? spriteUrl(pokemon, "artwork");

  return (
    <div className="container mx-auto px-4 pt-8 lg:max-w-7xl pb-12">
      <Link
        to={`/pokemon/${pokemon.name}`}
        state={location.state}
        className="inline-block mb-8 text-black bg-[#FECB09] hover:bg-[#E12025] hover:text-white px-4 py-2 cursor-pointer"
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
                era.sprites === "artwork" ? "" : "[image-rendering:pixelated]"
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
          <div className="border border-dashed border-gray-300 p-8 text-center">
            <p className="text-xs leading-relaxed">{t("encounters.none")}</p>
            <p className="mt-3 text-[10px] leading-relaxed text-gray-500">
              {t("encounters.noneHint")}
            </p>
          </div>
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
                className="mt-8 px-3 py-1 bg-gray-200 text-black text-xs cursor-pointer hover:bg-[#FECB09]"
              >
                {showAll
                  ? t("encounters.showLess")
                  : t("encounters.showMore", { count: rest })}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
};

/**
 * `red-japan` is a game of its own — the Japanese release, where the Celadon
 * prize corner sold Pikachu for 620 coins rather than Crystal's 2222 — but
 * "Red Japan" reads like a mistake, so it is marked rather than spelled out.
 */
const gameLabel = (game: string): string =>
  game.endsWith("-japan")
    ? `${humanize(game.slice(0, -"-japan".length))} (JP)`
    : humanize(game);

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

  const chip = (isActive: boolean) =>
    `px-2 py-1 text-[10px] leading-none cursor-pointer ${
      isActive
        ? "bg-[#356DB2] text-white"
        : "bg-gray-200 text-black hover:bg-[#FECB09]"
    }`;

  return (
    <div
      role="group"
      aria-label={t("encounters.title")}
      className="mb-6 flex flex-wrap gap-1"
    >
      <button
        type="button"
        onClick={() => onPick(null)}
        aria-pressed={picked === null}
        className={chip(picked === null)}
      >
        {t("encounters.allGames")}
      </button>
      {games.map((game) => (
        <button
          key={game}
          type="button"
          onClick={() => onPick(game)}
          aria-pressed={picked === game}
          className={chip(picked === game)}
        >
          {gameLabel(game)}
        </button>
      ))}
    </div>
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
