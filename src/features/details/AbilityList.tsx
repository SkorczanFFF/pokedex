import { useTranslation } from "react-i18next";
import { useEra } from "@/era/context";
import { useAbilityLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

export const AbilityList = ({
  abilities,
}: {
  abilities: Pokemon["abilities"];
}) => {
  const { t } = useTranslation();
  const abilityLabel = useAbilityLabel();
  const { era } = useEra();

  // Abilities arrived in Ruby and Sapphire. Before Gen III a Pokémon simply did
  // not have one, so the section is absent rather than empty.
  if (!era.hasAbilities) return null;

  return (
    <div>
      <h2 className="text-lg mb-3">{t("details.abilities")}</h2>
      <div className="flex flex-wrap gap-2">
        {abilities.map((ability) => (
          <span
            key={ability.ability.name}
            className="px-3 py-1 bg-gray-100 text-xs"
          >
            {abilityLabel(ability.ability.name)}
          </span>
        ))}
      </div>
    </div>
  );
};
