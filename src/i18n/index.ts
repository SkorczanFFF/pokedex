import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enPokemon from "./locales/en/pokemon.json";
import plCommon from "./locales/pl/common.json";
import plPokemon from "./locales/pl/pokemon.json";
import plAbilities from "./locales/pl/abilities.json";

export const SUPPORTED_LANGUAGES = ["en", "pl"] as const;

// Keep the document locale in sync with the UI. Registered before init() so the
// initial detection is picked up too.
const syncDocumentLang = (lng: string) => {
  document.documentElement.lang = lng;
};
i18n.on("languageChanged", syncDocumentLang);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Resources are bundled rather than fetched: two locales on a small app, so
    // this costs less than a backend plugin and needs no Suspense boundary.
    resources: {
      en: { common: enCommon, pokemon: enPokemon, abilities: {} },
      pl: { common: plCommon, pokemon: plPokemon, abilities: plAbilities },
    },
    ns: ["common", "pokemon", "abilities"],
    defaultNS: "common",
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    load: "languageOnly", // pl-PL -> pl
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
    },
    // React escapes interpolated values already.
    interpolation: { escapeValue: false },
  });

syncDocumentLang(i18n.resolvedLanguage ?? "en");

export default i18n;
