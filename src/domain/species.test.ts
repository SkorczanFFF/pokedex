import { describe, expect, it } from "vitest";
import type { PokemonSpecies } from "@/types/pokemon";
import { MODERN, RETRO } from "./era";
import { getDescription, getGeneration, getGenus } from "./species";

const entry = (version: string, language: string, flavor_text: string) => ({
  flavor_text,
  language: { name: language },
  version: { name: version },
});

const bulbasaur: PokemonSpecies = {
  flavor_text_entries: [
    entry("red", "en", "A strange seed was\nplanted on its\fback at birth."),
    entry("gold", "en", "It carries a seed on its back right from birth."),
    entry("sword", "en", "It grows by gaining nourishment from the seed on its back."),
    entry("sword", "fr", "Il grandit grâce à la graine sur son dos."),
  ],
  genera: [
    { genus: "Seed Pokémon", language: { name: "en" } },
    { genus: "Pokémon Graine", language: { name: "fr" } },
  ],
  generation: { name: "generation-i" },
  habitat: { name: "grassland" },
  evolution_chain: { url: "https://pokeapi.co/api/v2/evolution-chain/1/" },
  varieties: [{ is_default: true, pokemon: { name: "bulbasaur" } }],
};

describe("getDescription", () => {
  it("quotes the newest entry the era knows", () => {
    expect(getDescription(bulbasaur, "en", MODERN).text).toMatch(/^It grows/);
    expect(getDescription(bulbasaur, "en", RETRO).text).toMatch(/^It carries/);
  });

  it("cleans the games' line breaks and soft hyphens", () => {
    const asOfGenI = getDescription(bulbasaur, "en", { ...RETRO, maxGen: "i" });
    expect(asOfGenI.text).toBe("A strange seed was planted on its back at birth.");
  });

  it("reads a language PokéAPI has, and says so when it had to fall back to English", () => {
    const french = getDescription(bulbasaur, "fr", MODERN);
    expect(french).toEqual({ text: "Il grandit grâce à la graine sur son dos.", language: "fr" });
    const polish = getDescription(bulbasaur, "pl", MODERN);
    expect(polish.language).toBe("en");
    expect(polish.text).toMatch(/^It grows/);
  });

  it("prefers a translated table, and reads it through the same era rule", () => {
    const translated = {
      dex: [
        [["gold", "silver"], "Od urodzenia nosi na grzbiecie nasiono."],
        [["sword"], "Rośnie, czerpiąc z nasiona na grzbiecie."],
      ] as const,
    };
    expect(getDescription(bulbasaur, "pl", RETRO, translated)).toEqual({
      text: "Od urodzenia nosi na grzbiecie nasiono.",
      language: "pl",
    });
    expect(getDescription(bulbasaur, "pl", MODERN, translated).text).toMatch(/^Rośnie/);
  });

  it("lets the oldest entry stand in for a Pokémon that postdates the era", () => {
    const grookey: PokemonSpecies = {
      ...bulbasaur,
      flavor_text_entries: [entry("sword", "en", "A sword entry."), entry("scarlet", "en", "A scarlet entry.")],
    };
    expect(getDescription(grookey, "en", RETRO).text).toBe("A sword entry.");
  });
});

describe("getGenus and getGeneration", () => {
  it("picks the genus by language, English last", () => {
    expect(getGenus(bulbasaur, "en")).toBe("Seed Pokémon");
    expect(getGenus(bulbasaur, "fr")).toBe("Pokémon Graine");
    expect(getGenus(bulbasaur, "pl")).toBe("Seed Pokémon");
    expect(getGenus(bulbasaur, "pl", { genus: "Pokémon Nasienny", dex: [] })).toBe("Pokémon Nasienny");
  });

  it("hands back the generation slug raw, or null", () => {
    expect(getGeneration(bulbasaur)).toBe("i");
    expect(getGeneration({ ...bulbasaur, generation: { name: "unknown" } })).toBeNull();
  });
});
