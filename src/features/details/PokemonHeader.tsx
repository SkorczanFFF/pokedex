import { useTranslation } from "react-i18next";
import { LangMarker } from "@/components/badges";
import { genRoman } from "@/domain/dex";
import { getDescription, getGeneration, getGenus } from "@/domain/species";
import type { SpriteSetId } from "@/domain/sprites";
import { useEra } from "@/app/era/context";
import { VersusLink } from "@/features/versus";
import { useLocale } from "@/i18n/locale";
import { useTranslatedSpeciesText } from "@/i18n/translated";
import type { Pokemon, PokemonSpecies } from "@/types/pokemon";
import { CryButton } from "./CryButton";
import { EncountersLink } from "@/features/encounters";
import { ReadButton } from "./ReadButton";

/**
 * Name, dex number and the species text under them. The species payload arrives
 * on a second request, so everything it feeds stays optional until it lands —
 * the name and the number are on screen either way.
 */
export const PokemonHeader = ({
  pokemon,
  species,
  spriteSet,
}: {
  pokemon: Pokemon;
  species?: PokemonSpecies;
  /** The picture up in the column beside, which the cry follows. */
  spriteSet: SpriteSetId;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const locale = useLocale();
  // PokéAPI has no Polish species text; `translated` is where it comes from
  // instead, and is null for every language PokéAPI does answer for.
  const translated = useTranslatedSpeciesText()(pokemon.species.name);
  const description = species
    ? getDescription(species, locale, era, translated)
    : null;
  const genus = species ? getGenus(species, locale, translated) : "";
  const generationSlug = species ? getGeneration(species) : null;
  const generation = generationSlug
    ? t("gen.badge", { roman: genRoman(generationSlug) })
    : "";
  const meta = [generation, genus].filter(Boolean).join(" · ");
  // Said only when the entry is not in the reading language, which now means
  // the translation had nothing for this Pokémon rather than that none exists.
  const showEnglishMarker = !!description && description.language !== locale;

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-2xl capitalize">{pokemon.name}</h1>
        <CryButton pokemon={pokemon} set={spriteSet} />
        <EncountersLink pokemon={pokemon} />
        <VersusLink pokemon={pokemon} />
        <span className="text-gray-500">[{pokemon.id}]</span>
      </div>

      {meta && <p className="text-xs text-gray-500 mb-3">{meta}</p>}
      {description?.text && (
        <p className="text-xs leading-relaxed mb-6">
          {description.text}
          <ReadButton
            name={pokemon.name}
            text={description.text}
            lang={description.language}
          />
          {showEnglishMarker && <LangMarker title={t("details.englishEntry")} />}
        </p>
      )}
    </>
  );
};
