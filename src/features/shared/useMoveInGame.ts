import { useQuery } from "@tanstack/react-query";
import { moveQuery } from "@/api/queries";
import { moveInGame, type MoveInGame } from "@/domain/moves";
import { useLocale } from "@/i18n/locale";
import { useTranslatedMoveText } from "@/i18n/translated";

/**
 * A move as one game had it, in the reading language: the fetch, the era's
 * numbers and the translated sentence in one place, for the details panel and
 * the calculator alike. `move` is null until the payload is in.
 */
export const useMoveInGame = (
  name: string,
  game: string,
): { move: MoveInGame | null; isLoading: boolean; error: Error | null } => {
  const locale = useLocale();
  const translated = useTranslatedMoveText();
  const { data, isLoading, error } = useQuery(moveQuery(name));

  return {
    move: data ? moveInGame(data, game, locale, translated(name)) : null,
    isLoading,
    error,
  };
};
