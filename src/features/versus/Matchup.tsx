import { useTranslation } from "react-i18next";
import {
  defensiveProfile,
  matchup,
  typingOf,
  type Effectiveness,
  type MatchupAbilities,
} from "@/domain/matchup";
import { typeClass, type PokemonType } from "@/domain/pokemonTypes";
import { typesInEra } from "@/domain/pokemonView";
import type { TypeChart } from "@/domain/typeChart";
import { useEra } from "@/era/context";
import { effectClass, phraseKey, printed } from "@/features/types/effectiveness";
import { humanize, useTypeLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

export const TypeChip = ({ type }: { type: PokemonType }) => {
  const typeLabel = useTypeLabel();
  return (
    <span className={`px-2 py-1 text-[10px] leading-none ${typeClass(type)}`}>
      {typeLabel(type)}
    </span>
  );
};

export const EffectChip = ({ value }: { value: Effectiveness }) => (
  <span
    className={`inline-flex h-6 min-w-6 items-center justify-center border border-gray-300 px-1 text-[10px] ${effectClass(
      value,
      true,
    )}`}
  >
    ×{printed(value)}
  </span>
);

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
    typingOf(typesInEra(attacker, era)),
    typingOf(typesInEra(defender, era)),
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
            <TypeChip type={hit.attack} />
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
  const groups = defensiveProfile(
    chart,
    typingOf(typesInEra(pokemon, era)),
    abilities,
  );

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
              <TypeChip key={type} type={type} />
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
};
