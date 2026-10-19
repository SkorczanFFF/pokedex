import { useTranslation } from "react-i18next";
import { EffectChip, TypeBadge } from "@/components/badges";
import { phraseKey } from "@/components/effectiveness";
import {
  defensiveProfile,
  matchup,
  type MatchupAbilities,
} from "@/domain/matchup";
import { typingInEra } from "@/domain/pokemonView";
import type { TypeChart } from "@/domain/typeChart";
import { useEra } from "@/era/context";
import { humanize } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

/** What each of the attacker's types does to the defender. */
export const Attacks = ({
  chart,
  attacker,
  defender,
  abilities,
}: {
  chart: TypeChart;
  attacker: Pokemon;
  defender: Pokemon;
  abilities?: MatchupAbilities;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const hits = matchup(
    chart,
    typingInEra(attacker, era),
    typingInEra(defender, era),
    abilities,
  );
  const name = humanize(defender.name);

  return (
    <section>
      <h2 className="text-xs mb-3">
        {t("versus.attacks", { name: humanize(attacker.name) })}
      </h2>
      <ul className="space-y-2">
        {hits.map((hit) => (
          <li
            key={hit.attack}
            className="flex flex-wrap items-center gap-2 text-[10px]"
          >
            <TypeBadge type={hit.attack} />
            <EffectChip value={hit.value} />
            <span className={hit.value === 1 ? "text-gray-500" : ""}>
              {t(phraseKey(hit.value), { name })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};

/** Every type of the era against one Pokémon, grouped; neutral left out. */
export const Profile = ({
  chart,
  pokemon,
  abilities,
}: {
  chart: TypeChart;
  pokemon: Pokemon;
  abilities?: MatchupAbilities;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const groups = defensiveProfile(chart, typingInEra(pokemon, era), abilities);

  return (
    <section>
      <h2 className="text-xs mb-3">
        {t("versus.profile", { name: humanize(pokemon.name) })}
      </h2>
      <ul className="space-y-3">
        {groups.map((group) => (
          <li key={group.value} className="flex flex-wrap items-center gap-2">
            <EffectChip value={group.value} />
            {group.attacks.map((type) => (
              <TypeBadge key={type} type={type} />
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
};
