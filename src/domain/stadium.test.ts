import { describe, expect, it } from "vitest";
import {
  BALLS,
  CASTLE_ROSTER,
  STADIUM_CUPS,
  STADIUM_GAMES,
  STADIUM_TEAM,
  isStadiumGame,
  stadiumInEra,
  type StadiumGame,
} from "./stadium";
import { MODERN, RETRO } from "./era";

const cups = STADIUM_GAMES.flatMap((game) => STADIUM_CUPS[game].map((cup) => ({ game, cup })));

describe("stadium cups", () => {
  it("knows the two games by their digit, and nothing else", () => {
    expect(STADIUM_GAMES.every(isStadiumGame)).toBe(true);
    expect(isStadiumGame("3")).toBe(false);
    expect(isStadiumGame(undefined)).toBe(false);
  });

  it("belongs to an era that stops by Gen II", () => {
    expect(stadiumInEra(RETRO)).toBe(true);
    expect(stadiumInEra(MODERN)).toBe(false);
  });

  it("names each cup once per game", () => {
    for (const game of STADIUM_GAMES) {
      const ids = STADIUM_CUPS[game].map((cup) => cup.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  // A total below three at the floor locks every team out; one at three at the ceiling binds nobody.
  it("sets each level total where a team fits under it and some team does not", () => {
    for (const { cup } of cups.filter(({ cup }) => cup.levelTotal)) {
      const { min, max } = cup.levels!;
      expect(cup.levelTotal).toBeGreaterThanOrEqual(STADIUM_TEAM.battle * min);
      expect(cup.levelTotal).toBeLessThan(STADIUM_TEAM.battle * max);
    }
  });

  it("gives levels by class only to a cup of four classes, rising", () => {
    for (const { cup } of cups.filter(({ cup }) => cup.classLevels)) {
      expect(cup.classes).toBe(4);
      const levels = BALLS.map((ball) => cup.classLevels![ball]);
      expect(levels).toEqual([...levels].sort((a, b) => a - b));
    }
  });
});

describe("the castles", () => {
  const stops = (game: StadiumGame, region: string) =>
    CASTLE_ROSTER[game].find((wing) => wing.region === region)!.stops;

  it("puts eight gyms of three trainers and a leader before the first game's Elite Four and rival", () => {
    const kanto = stops("1", "kanto");
    expect(kanto.slice(0, 8).every((stop) => stop.fought.length === 4)).toBe(true);
    expect(kanto.slice(8).map((stop) => stop.at)).toEqual(["elite-four", "champion"]);
  });

  it("climbs Johto before Kanto in the second, whose eight leaders stand alone before Red", () => {
    expect(CASTLE_ROSTER["2"].map((wing) => wing.region)).toEqual(["johto", "kanto"]);
    const kanto = stops("2", "kanto");
    expect(kanto.slice(0, 8).every((stop) => stop.fought.length === 1)).toBe(true);
    expect(kanto.at(-1)).toEqual({ at: "silver-cave", fought: ["Red"] });
  });
});
