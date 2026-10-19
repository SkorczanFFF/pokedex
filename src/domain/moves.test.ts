import { describe, expect, it } from "vitest";
import type { Move, Pokemon } from "@/types/pokemon";
import { makePokemon } from "./__fixtures__/pokemon";
import { MODERN, RETRO } from "./era";
import { learnsetInEra, moveInGame, moveMethodAccent, uniqueMoves } from "./moves";

const learns = (
  move: string,
  details: { group: string; method: string; level: number }[],
): Pokemon["moves"][number] => ({
  move: { name: move, url: "" },
  version_group_details: details.map((entry) => ({
    level_learned_at: entry.level,
    version_group: { name: entry.group },
    move_learn_method: { name: entry.method },
  })),
});

/** Typhlosion: Ember twice in Crystal, and Champions teaching only by `train`. */
const typhlosion = makePokemon({
  name: "typhlosion",
  moves: [
    learns("ember", [
      { group: "crystal", method: "level-up", level: 12 },
      { group: "crystal", method: "level-up", level: 1 },
      { group: "scarlet-violet", method: "level-up", level: 1 },
      { group: "champions", method: "train", level: 0 },
    ]),
    learns("flamethrower", [
      { group: "crystal", method: "machine", level: 0 },
      { group: "scarlet-violet", method: "machine", level: 0 },
      { group: "champions", method: "train", level: 0 },
    ]),
    learns("eruption", [{ group: "scarlet-violet", method: "level-up", level: 64 }]),
  ],
});

describe("learnsetInEra", () => {
  it("reads the newest game in the era that teaches by levelling", () => {
    expect(learnsetInEra(typhlosion, MODERN)).toEqual({
      game: "scarlet-violet",
      groups: [
        { method: "level-up", moves: [{ name: "ember", level: 1 }, { name: "eruption", level: 64 }] },
        { method: "machine", moves: [{ name: "flamethrower", level: 0 }] },
      ],
    });
  });

  it("keeps both rows when a game teaches a move twice", () => {
    expect(learnsetInEra(typhlosion, RETRO)).toEqual({
      game: "crystal",
      groups: [
        { method: "level-up", moves: [{ name: "ember", level: 1 }, { name: "ember", level: 12 }] },
        { method: "machine", moves: [{ name: "flamethrower", level: 0 }] },
      ],
    });
  });

  it("falls back to the newest game of any kind, and to nothing", () => {
    const onlyChampions = makePokemon({
      moves: [learns("tackle", [{ group: "champions", method: "train", level: 0 }])],
    });
    expect(learnsetInEra(onlyChampions, MODERN)).toEqual({
      game: "champions",
      groups: [{ method: "train", moves: [{ name: "tackle", level: 0 }] }],
    });
    expect(learnsetInEra(onlyChampions, RETRO)).toEqual({ game: null, groups: [] });
    expect(learnsetInEra(makePokemon({ moves: [] }), MODERN)).toEqual({ game: null, groups: [] });
  });
});

describe("moveMethodAccent", () => {
  it("colours the four methods the games use and greys the rest", () => {
    expect(moveMethodAccent("level-up").fill).not.toBe(moveMethodAccent("machine").fill);
    expect(moveMethodAccent("train")).toEqual(moveMethodAccent("stadium-surfing-pikachu"));
  });
});

/** Thunderbolt: 95 power through Black 2 and White 2, 90 since. */
const thunderbolt: Move = {
  id: 85,
  name: "thunderbolt",
  power: 90,
  accuracy: 100,
  pp: 15,
  effect_chance: 10,
  type: { name: "electric" },
  damage_class: { name: "special" },
  flavor_text_entries: [
    {
      flavor_text: "A strong electric\nblast is loosed\fat the foe.",
      language: { name: "en" },
      version_group: { name: "gold-silver" },
    },
    {
      flavor_text: "A strong electric blast crashes down on the target.",
      language: { name: "en" },
      version_group: { name: "x-y" },
    },
    {
      flavor_text: "Une grosse décharge électrique.",
      language: { name: "fr" },
      version_group: { name: "x-y" },
    },
  ],
  past_values: [
    {
      version_group: { name: "black-2-white-2" },
      power: 95,
      accuracy: null,
      pp: null,
      effect_chance: null,
      type: null,
    },
  ],
};

describe("moveInGame", () => {
  it("reads the numbers that stood in the game", () => {
    expect(moveInGame(thunderbolt, "crystal", "en").power).toBe(95);
    expect(moveInGame(thunderbolt, "black-2-white-2", "en").power).toBe(95);
    expect(moveInGame(thunderbolt, "x-y", "en").power).toBe(90);
    expect(moveInGame(thunderbolt, "scarlet-violet", "en").power).toBe(90);
    expect(moveInGame(thunderbolt, "crystal", "en").accuracy).toBe(100);
    expect(moveInGame(thunderbolt, "crystal", "en").type).toBe("electric");
  });

  it("quotes the game's own sentence, or the nearest one before it, cleaned", () => {
    const crystal = moveInGame(thunderbolt, "crystal", "en");
    expect(crystal.text).toBe("A strong electric blast is loosed at the foe.");
    expect(crystal.textFromGame).toBe("gold-silver");
    expect(crystal.textLanguage).toBe("en");
    expect(moveInGame(thunderbolt, "scarlet-violet", "en").textFromGame).toBe("x-y");
    expect(moveInGame(thunderbolt, "red-blue", "en").textFromGame).toBe("gold-silver");
  });

  it("reads a language PokéAPI carries, and falls back to English for one it does not", () => {
    const french = moveInGame(thunderbolt, "x-y", "fr");
    expect(french.text).toBe("Une grosse décharge électrique.");
    expect(french.textLanguage).toBe("fr");
    const polish = moveInGame(thunderbolt, "crystal", "pl");
    expect(polish.text).toBe("A strong electric blast is loosed at the foe.");
    expect(polish.textLanguage).toBe("en");
  });

  it("takes a translated table over PokéAPI's text", () => {
    const polish = moveInGame(thunderbolt, "crystal", "pl", [
      [["gold-silver", "crystal"], "Silne wyładowanie elektryczne."],
    ]);
    expect(polish.text).toBe("Silne wyładowanie elektryczne.");
    expect(polish.textFromGame).toBe("crystal");
    expect(polish.textLanguage).toBe("pl");
  });
});

describe("uniqueMoves", () => {
  it("offers a move once, keeping its first row", () => {
    expect(
      uniqueMoves([
        { name: "ember", level: 1 },
        { name: "ember", level: 12 },
        { name: "smokescreen", level: 6 },
      ]),
    ).toEqual([
      { name: "ember", level: 1 },
      { name: "smokescreen", level: 6 },
    ]);
  });
});
