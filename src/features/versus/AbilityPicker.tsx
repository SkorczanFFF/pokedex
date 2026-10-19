import { useTranslation } from "react-i18next";
import { Chip, ChipRow } from "@/components/Chip";
import { abilitiesInOrder } from "@/domain/abilities";
import { useEra } from "@/era/context";
import { useAbilityLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

/**
 * Which of its abilities a fighter is read with, as a row of chips under its
 * picker. Shown only where the era has abilities at all. The hidden one is
 * offered too and marked, since a reader weighing a matchup may well mean it.
 */
export const AbilityPicker = ({
  pokemon,
  value,
  onPick,
}: {
  pokemon: Pokemon;
  value: string | null;
  onPick: (ability: string) => void;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const abilityLabel = useAbilityLabel();

  if (!era.hasAbilities || pokemon.abilities.length === 0) return null;

  const abilities = abilitiesInOrder(pokemon);

  return (
    <ChipRow label={t("versus.ability")} className="items-center">
      <span className="mr-1 text-[10px] text-gray-500">{t("versus.ability")}:</span>
      {abilities.map((entry) => {
        const name = abilityLabel(entry.ability.name);
        return (
          <Chip
            key={entry.ability.name}
            kind="ability"
            active={entry.ability.name === value}
            onClick={() => onPick(entry.ability.name)}
            label={entry.is_hidden ? t("versus.hiddenAbility", { name }) : undefined}
          >
            {name}
            {entry.is_hidden && (
              <span aria-hidden="true" className="opacity-60">
                {" *"}
              </span>
            )}
          </Chip>
        );
      })}
    </ChipRow>
  );
};
