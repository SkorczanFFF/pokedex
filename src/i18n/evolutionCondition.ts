import { useTranslation } from "react-i18next";

import type { EvolutionDetail } from "@/types/pokemon";
import { humanize, useTypeLabel } from "./labels";

// Keyed lookups rather than a template literal so a missing branch is a compile
// error instead of a silently untranslated string.
const TIME_OF_DAY_KEYS = {
  day: "evolution.day",
  night: "evolution.night",
  dusk: "evolution.dusk",
} as const;

const PHYSICAL_STATS_KEYS = {
  "1": "evolution.atkOverDef",
  "0": "evolution.atkEqualsDef",
  "-1": "evolution.defOverAtk",
} as const;

/**
 * One-line summary of how an evolution triggers: the method first, then every
 * extra condition the games layer on top of it. Item, move and location slugs
 * have no Polish in PokéAPI, so those fall back to humanized English.
 */
export const useEvolutionCondition = () => {
  const { t } = useTranslation();
  const typeLabel = useTypeLabel();

  return (detail: EvolutionDetail): string => {
    const parts: string[] = [];

    switch (detail.trigger.name) {
      case "level-up":
        parts.push(
          detail.min_level
            ? t("evolution.level", { level: detail.min_level })
            : t("evolution.levelUp"),
        );
        break;
      case "use-item":
        parts.push(
          detail.item ? humanize(detail.item.name) : t("evolution.useItem"),
        );
        break;
      case "trade":
        parts.push(
          detail.trade_species
            ? t("evolution.tradeFor", {
                species: humanize(detail.trade_species.name),
              })
            : t("evolution.trade"),
        );
        break;
      case "shed":
        parts.push(t("evolution.shed"));
        break;
      default:
        parts.push(humanize(detail.trigger.name));
    }

    if (detail.min_happiness !== null) parts.push(t("evolution.happiness"));
    if (detail.min_affection !== null) parts.push(t("evolution.affection"));
    if (detail.min_beauty !== null) parts.push(t("evolution.beauty"));
    if (detail.held_item)
      parts.push(
        t("evolution.holding", { item: humanize(detail.held_item.name) }),
      );
    if (detail.known_move)
      parts.push(
        t("evolution.knowsMove", { move: humanize(detail.known_move.name) }),
      );
    if (detail.known_move_type)
      parts.push(
        t("evolution.knowsMoveType", {
          type: typeLabel(detail.known_move_type.name),
        }),
      );
    if (detail.location)
      parts.push(
        t("evolution.location", { location: humanize(detail.location.name) }),
      );
    if (detail.party_species)
      parts.push(
        t("evolution.party", { species: humanize(detail.party_species.name) }),
      );
    if (detail.party_type)
      parts.push(
        t("evolution.partyType", { type: typeLabel(detail.party_type.name) }),
      );
    if (detail.needs_overworld_rain) parts.push(t("evolution.rain"));
    if (detail.turn_upside_down) parts.push(t("evolution.upsideDown"));
    if (detail.gender !== null)
      parts.push(t(detail.gender === 1 ? "evolution.female" : "evolution.male"));

    const timeKey =
      TIME_OF_DAY_KEYS[detail.time_of_day as keyof typeof TIME_OF_DAY_KEYS];
    if (timeKey) parts.push(t(timeKey));

    const statsKey =
      PHYSICAL_STATS_KEYS[
        String(detail.relative_physical_stats) as keyof typeof PHYSICAL_STATS_KEYS
      ];
    if (statsKey) parts.push(t(statsKey));

    return parts.join(" · ");
  };
};
