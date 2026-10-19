import { useTranslation } from "react-i18next";
import { genRoman, generationFromId } from "@/domain/dex";
import { useEra } from "@/app/era/context";
import { humanize } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

/**
 * The sentence that says a Pokémon postdates the era, with its generation
 * where the id can tell one — the details page's screen and Versus' text box
 * say it the same way. From the id alone, so it costs no request. Null above
 * 1025, where PokéAPI numbers the alternate forms.
 */
export const useNotInEraText = () => {
  const { t } = useTranslation();
  const { era } = useEra();

  return (pokemon: Pokemon): string => {
    const generation = generationFromId(pokemon.id);
    return t(generation ? "era.notHereBody" : "era.notHereBodyNoGen", {
      name: humanize(pokemon.name),
      id: pokemon.id,
      gen: generation ? genRoman(generation) : "",
      max: era.maxDexId,
    });
  };
};
