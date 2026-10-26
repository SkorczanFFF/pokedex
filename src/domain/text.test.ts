import { describe, expect, it } from "vitest";
import { cleanFlavorText, flattenTranslated, humanize, inLanguage, speakable } from "./text";

describe("humanize", () => {
  it("turns a slug into words", () => {
    expect(humanize("special-attack")).toBe("Special Attack");
    expect(humanize("mr-mime")).toBe("Mr Mime");
    expect(humanize("xd")).toBe("Xd");
    expect(humanize("")).toBe("");
  });
});

describe("cleanFlavorText", () => {
  it("turns the games' breaks into spaces and joins words a soft hyphen split", () => {
    expect(cleanFlavorText("A strange seed was\nplanted on its\fback at birth.")).toBe(
      "A strange seed was planted on its back at birth.",
    );
    expect(cleanFlavorText("  trailing\r\n")).toBe("trailing");
    expect(cleanFlavorText("draws en­\nergy")).toBe("draws energy");
    expect(cleanFlavorText("soft­hyphen")).toBe("softhyphen");
  });
});

describe("speakable", () => {
  it("quiets shouted words and leaves short ones to be spelled", () => {
    expect(speakable("This POKéMON hits BULBASAUR for 10 HP.")).toBe(
      "This Pokémon hits Bulbasaur for 10 HP.",
    );
    expect(speakable("Ten POKéMON żyje w GÓRACH.")).toBe("Ten Pokémon żyje w Górach.");
    expect(speakable("A Pokémon.")).toBe("A Pokémon.");
  });
});

describe("inLanguage", () => {
  const entries = [
    { text: "en one", language: "en" },
    { text: "fr", language: "fr" },
    { text: "en two", language: "en" },
  ];

  it("answers in the language asked for, else English, else nothing", () => {
    expect(inLanguage(entries, (e) => e.language, "fr").map((e) => e.text)).toEqual(["fr"]);
    expect(inLanguage(entries, (e) => e.language, "pl").map((e) => e.text)).toEqual([
      "en one",
      "en two",
    ]);
    expect(inLanguage([entries[1]], (e) => e.language, "pl")).toEqual([]);
  });
});

describe("flattenTranslated", () => {
  it("unrolls a sentence shared by a run of games to one entry per game", () => {
    expect(
      flattenTranslated([
        [["gold-silver", "crystal"], "one"],
        [["x-y"], "two"],
      ]),
    ).toEqual([
      { game: "gold-silver", text: "one" },
      { game: "crystal", text: "one" },
      { game: "x-y", text: "two" },
    ]);
    expect(flattenTranslated([])).toEqual([]);
  });
});
