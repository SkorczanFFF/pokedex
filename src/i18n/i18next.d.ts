import type common from "./locales/en/common.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      // Fully typed: a typo in a message key is a compile error.
      common: typeof common;
      // Keyed by PokéAPI slugs, which arrive as plain strings, so these stay
      // open. Missing entries resolve through the humanize() fallback instead.
      pokemon: {
        types: Record<string, string>;
        stats: Record<string, string>;
      };
      abilities: Record<string, string>;
    };
  }
}
