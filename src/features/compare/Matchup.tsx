import { useTranslation } from "react-i18next";
import {
  defensiveProfile,
  matchup,
  typingOf,
  type Effectiveness,
} from "@/domain/matchup";
import { typeClass, type PokemonType } from "@/domain/pokemonTypes";
import { typesInEra } from "@/domain/pokemonView";
import type { TypeChart } from "@/domain/typeChart";
import { useEra } from "@/era/context";
import { effectClass, printed } from "@/features/types/effectiveness";
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

type PhraseKey =
  | "compare.super"
  | "compare.notVery"
  | "compare.noEffect"
  | "compare.neutral";

/** The games' own line for a hit; ×4 and ×¼ get the same words as ×2 and ×½. */
const phraseKey = (value: Effectiveness): PhraseKey => {
  if (value >= 2) return "compare.super";
  if (value === 0) return "compare.noEffect";
  if (value < 1) return "compare.notVery";
  return "compare.neutral";
};

/** What each of the attacker's types does to the defender. */
export const Attacks = ({
  chart,
  attacker,
  defender,
}: {
  chart: TypeChart;
  attacker: Pokemon;
  defender: Pokemon;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const hits = matchup(
    chart,
    typingOf(typesInEra(attacker, era)),
    typingOf(typesInEra(defender, era)),
  );
  const name = humanize(defender.name);

  return (
    <section>
      <h2 className="text-xs mb-3">
        {t("compare.attacks", { name: humanize(attacker.name) })}
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
}: {
  chart: TypeChart;
  pokemon: Pokemon;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const groups = defensiveProfile(chart, typingOf(typesInEra(pokemon, era)));

  return (
    <section>
      <h2 className="text-xs mb-3">
        {t("compare.profile", { name: humanize(pokemon.name) })}
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
