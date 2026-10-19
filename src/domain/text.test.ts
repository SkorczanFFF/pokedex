import { describe, expect, it } from "vitest";
import { cleanFlavorText, flattenTranslated, inLanguage } from "./text";

describe("cleanFlavorText", () => {
  it("turns the games' breaks and soft hyphens into spaces", () => {
    expect(cleanFlavorText("A strange seed was\nplanted on its\fback at birth.")).toBe(
      "A strange seed was planted on its back at birth.",
    );
    expect(cleanFlavorText("  trailing\r\n")).toBe("trailing");
    expect(cleanFlavorText("soft­hyphen")).toBe("soft hyphen");
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
