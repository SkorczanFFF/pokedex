import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getMove } from "@/api/moves";
import { moveInGame, moveMethodAccent } from "@/domain/moves";
import { typeClass } from "@/domain/pokemonTypes";
import { humanize, useDamageClassLabel, useTypeLabel } from "@/i18n/labels";
import { useTranslatedMoveText } from "@/i18n/translated";

/**
 * One move's numbers and the sentence its game printed about it.
 *
 * The body only: whoever opens it owns the frame around it, because the same
 * markup is the panel beside the list on a wide screen and the drawer under a
 * row on a narrow one. It is told the source anyway — not to draw that frame,
 * but because the rule down the side of the quote is a second line parallel to
 * the frame's own, and two lines that close on a move want the same colour.
 *
 * Mounted only when a row is opened, which is the whole fetching strategy: a
 * move payload is about 5.5 kB over the wire and a Pokémon knows dozens, so
 * nothing is asked for until somebody wants it. Held forever once it arrives —
 * a move does not change between two clicks.
 */
export const MoveDetails = ({
  name,
  game,
  method,
}: {
  name: string;
  game: string;
  method: string;
}) => {
  const { t, i18n } = useTranslation();
  const typeLabel = useTypeLabel();
  const damageClassLabel = useDamageClassLabel();
  const translatedText = useTranslatedMoveText();

  const { data, isLoading, error } = useQuery({
    queryKey: ["move", name],
    queryFn: () => getMove(name),
    staleTime: Infinity,
  });

  if (isLoading) return <MoveSkeleton />;
  // A move is a detail on a page that already works; losing one is not worth
  // replacing anything with an error.
  if (error || !data) return null;

  const locale = i18n.resolvedLanguage ?? "en";
  const move = moveInGame(data, game, locale, translatedText(name));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className={`px-2 py-1 text-[10px] ${typeClass(move.type)}`}>
          {typeLabel(move.type)}
        </span>
        <span className="px-2 py-1 text-[10px] bg-gray-200">
          {damageClassLabel(move.damageClass)}
        </span>
      </div>

      {/* Three numbers read as three numbers when they are given their own
          boxes, and as a run-on sentence when they are not. */}
      <dl className="grid grid-cols-3 gap-2 text-center">
        <MoveStat label={t("details.movePower")} value={move.power} />
        <MoveStat label={t("details.moveAccuracy")} value={move.accuracy} />
        <MoveStat label={t("details.movePp")} value={move.pp} />
      </dl>

      {move.text && (
        // Half the width of the frame's bar, which is the hierarchy: the bar
        // says which section the move came from, this only says the sentence
        // is the game's own.
        <p
          className={`border-l-4 ${
            moveMethodAccent(method).bar
          } pl-3 text-[10px] leading-relaxed`}
        >
          {move.text}
          {/* Said only when the sentence is not in the reading language, which
              now means the translation had no entry reaching back this far
              rather than that none exists at all. */}
          {move.textLanguage !== locale && (
            <span
              title={t("details.englishMoveText")}
              className="ml-2 align-middle bg-gray-200 text-gray-600 text-[10px] px-1 py-[2px]"
            >
              <span aria-hidden="true">{t("details.englishEntryShort")}</span>
              <span className="sr-only">{t("details.englishMoveText")}</span>
            </span>
          )}
          {/* The text came from whichever game had one; say so when that is not
              the game the rest of the section is quoting. */}
          {move.textFromGame && move.textFromGame !== game && (
            <span className="ml-2 text-gray-500">
              {t("details.moveTextFrom", {
                game: humanize(move.textFromGame),
              })}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

const MoveStat = ({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white px-2 py-3">
      <dt className="text-[9px] text-gray-500">{label}</dt>
      {/* Null is not zero: a status move has no power, and a move that cannot
          miss has no accuracy. */}
      <dd className="mt-2 text-sm">{value ?? t("details.moveNoValue")}</dd>
    </div>
  );
};

const MoveSkeleton = () => (
  <div className="space-y-4" aria-hidden="true">
    <div className="flex gap-2">
      <div className="h-6 w-24 bg-gray-200 animate-pulse" />
      <div className="h-6 w-20 bg-gray-200 animate-pulse" />
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="h-16 bg-gray-200 animate-pulse" />
      <div className="h-16 bg-gray-200 animate-pulse" />
      <div className="h-16 bg-gray-200 animate-pulse" />
    </div>
    <div className="h-8 bg-gray-200 animate-pulse" />
  </div>
);
