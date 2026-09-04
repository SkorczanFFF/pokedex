import { useTranslation } from "react-i18next";
import { genRoman } from "@/domain/dex";
import { getDescription, getGeneration, getGenus } from "@/domain/species";
import type { Pokemon, PokemonSpecies } from "@/types/pokemon";
import { CryButton } from "./CryButton";

/**
 * Name, dex number and the species text under them. The species payload arrives
 * on a second request, so everything it feeds stays optional until it lands —
 * the name and the number are on screen either way.
 */
export const PokemonHeader = ({
  pokemon,
  species,
}: {
  pokemon: Pokemon;
  species?: PokemonSpecies;
}) => {
  const { t, i18n } = useTranslation();

  const locale = i18n.resolvedLanguage ?? "en";
  // PokéAPI has no Polish species text, so these always resolve to English.
  const description = species ? getDescription(species, locale) : "";
  const genus = species ? getGenus(species, locale) : "";
  const generationSlug = species ? getGeneration(species) : null;
  const generation = generationSlug
    ? t("gen.badge", { roman: genRoman(generationSlug) })
    : "";
  const meta = [generation, genus].filter(Boolean).join(" · ");
  const showEnglishMarker = locale !== "en";

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl capitalize">{pokemon.name}</h1>
        <CryButton pokemon={pokemon} />
        <span className="text-gray-500">[{pokemon.id}]</span>
      </div>

      {meta && <p className="text-xs text-gray-500 mb-3">{meta}</p>}
      {description && (
        <p className="text-xs leading-relaxed mb-6">
          {description}
          {showEnglishMarker && (
            <span
              title={t("details.englishEntry")}
              className="ml-2 align-middle bg-gray-200 text-gray-600 text-[10px] px-1 py-[2px]"
            >
              <span aria-hidden="true">{t("details.englishEntryShort")}</span>
              <span className="sr-only">{t("details.englishEntry")}</span>
            </span>
          )}
        </p>
      )}
    </>
  );
};
