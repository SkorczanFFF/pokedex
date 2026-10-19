import { describe, expect, it } from "vitest";
import enCommon from "./locales/en/common.json";
import enPokemon from "./locales/en/pokemon.json";
import plCommon from "./locales/pl/common.json";
import plPokemon from "./locales/pl/pokemon.json";

/** Every leaf's dotted path, with a plural suffix taken off: `_one` and `_many` are one key. */
const keysOf = (table: object, prefix = ""): string[] =>
  Object.entries(table).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keysOf(value, `${prefix}${key}.`)
      : [`${prefix}${key}`.replace(/_(zero|one|two|few|many|other)$/, "")],
  );

const distinct = (keys: string[]) => [...new Set(keys)].sort();

// Only `common` from EN is typed, so a key the Polish table lacks — or one it
// keeps after the English one went — would otherwise surface as a raw key on
// screen rather than fail the build.
describe("locale tables", () => {
  it("say the same things in common.json", () => {
    expect(distinct(keysOf(plCommon))).toEqual(distinct(keysOf(enCommon)));
  });

  it("label the same slugs in pokemon.json", () => {
    expect(distinct(keysOf(plPokemon))).toEqual(distinct(keysOf(enPokemon)));
  });
});
