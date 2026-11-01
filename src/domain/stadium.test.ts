import { describe, expect, it } from "vitest";
import { BALLS, STADIUM_CUPS, STADIUM_GAMES, STADIUM_TEAM, isStadiumGame } from "./stadium";

const cups = STADIUM_GAMES.flatMap((game) => STADIUM_CUPS[game].map((cup) => ({ game, cup })));

describe("stadium cups", () => {
  it("knows the two games by their digit, and nothing else", () => {
    expect(STADIUM_GAMES.every(isStadiumGame)).toBe(true);
    expect(isStadiumGame("3")).toBe(false);
    expect(isStadiumGame(undefined)).toBe(false);
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
