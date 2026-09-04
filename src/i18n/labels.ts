import { useTranslation } from "react-i18next";

/**
 * Turns a PokéAPI slug into a readable English label:
 * `special-attack` -> `Special Attack`, `solar-power` -> `Solar Power`.
 *
 * Also the fallback for every lookup here and in `evolutionCondition`, so an
 * untranslated entry renders as proper English rather than a raw slug or a
 * blank.
 */
export const humanize = (slug: string): string =>
  slug
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");

/** Display label for a type slug. The slug stays the URL/style key. */
export const useTypeLabel = () => {
  const { t } = useTranslation("pokemon");
  return (slug: string) => t(`types.${slug}`, { defaultValue: humanize(slug) });
};

/** Display label for a stat slug (`hp`, `special-attack`, ...). */
export const useStatLabel = () => {
  const { t } = useTranslation("pokemon");
  return (slug: string) => t(`stats.${slug}`, { defaultValue: humanize(slug) });
};

/**
 * Display label for an ability slug. PokéAPI has no Polish and there are 373
 * abilities, so the Polish dictionary is filled in progressively — anything
 * missing falls back to humanized English.
 */
export const useAbilityLabel = () => {
  const { t } = useTranslation("abilities");
  return (slug: string) => t(slug, { defaultValue: humanize(slug) });
};
