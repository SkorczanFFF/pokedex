import { describe, expect, it } from "vitest";
import {
  KNOWN_GAMES,
  gameName,
  generationOfVersion,
  generationOfVersionGroup,
  versionGroupRank,
  versionRank,
} from "./games";

describe("games", () => {
  it("dates a version and a version group, and refuses to guess", () => {
    expect(generationOfVersion("crystal")).toBe("ii");
    expect(generationOfVersion("colosseum")).toBe("iii");
    expect(generationOfVersion("red-japan")).toBe("i");
    expect(generationOfVersion("stadium")).toBeNull();
    expect(generationOfVersionGroup("lets-go-pikachu-lets-go-eevee")).toBe("vii");
    expect(generationOfVersionGroup("red")).toBeNull();
  });

  it("orders the games as they came out, not as PokéAPI numbers them", () => {
    expect(versionRank("red")).toBe(0);
    expect(versionRank("gold")!).toBeLessThan(versionRank("crystal")!);
    expect(versionRank("colosseum")!).toBeLessThan(versionRank("diamond")!);
    expect(versionGroupRank("gold-silver")!).toBeLessThan(versionGroupRank("crystal")!);
    expect(versionGroupRank("nope")).toBeNull();
  });

  it("names every game and group it knows, the pairs with a slash and Japan marked", () => {
    for (const slug of KNOWN_GAMES) {
      expect(gameName(slug), slug).not.toBe(slug);
    }
    expect(gameName("red-blue")).toBe("Red / Blue");
    expect(gameName("red-japan")).toBe("Red (JP)");
    expect(gameName("lets-go-pikachu-lets-go-eevee")).toBe("Let's Go, Pikachu! / Let's Go, Eevee!");
    expect(gameName("scarlet-violet")).toBe("Scarlet / Violet");
  });

  it("reads a game it does not know off its slug", () => {
    expect(gameName("stadium-2")).toBe("Stadium 2");
  });
});
