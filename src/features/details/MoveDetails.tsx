import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { moveQuery } from "@/api/queries";
import { SkeletonMoveBody } from "@/components/Skeleton";
import { ClassBadge, LangMarker, TypeBadge } from "@/components/badges";
import { moveInGame, moveMethodAccent } from "@/domain/moves";
import { useGameLabel } from "@/i18n/labels";
import { useLocale } from "@/i18n/locale";
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
  const { t } = useTranslation();
  const locale = useLocale();
  const gameLabel = useGameLabel();
  const translatedText = useTranslatedMoveText();

  const { data, isLoading, error } = useQuery(moveQuery(name));

  if (isLoading) return <SkeletonMoveBody />;
  // A move is a detail on a page that already works; losing one is not worth
  // replacing anything with an error.
  if (error || !data) return null;

  const move = moveInGame(data, game, locale, translatedText(name));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <TypeBadge type={move.type} />
        <ClassBadge damageClass={move.damageClass} />
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
            <LangMarker title={t("details.englishMoveText")} />
          )}
          {/* The text came from whichever game had one; say so when that is not
              the game the rest of the section is quoting. */}
          {move.textFromGame && move.textFromGame !== game && (
            <span className="ml-2 text-gray-500">
              {t("details.moveTextFrom", {
                game: gameLabel(move.textFromGame),
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
