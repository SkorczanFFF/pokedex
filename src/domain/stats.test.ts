import { describe, expect, it } from "vitest";
import { SCALE_MAX, STAT, barPercent, statValue } from "./stats";

describe("stats", () => {
  it("names PokéAPI's slugs once", () => {
    expect(STAT.specialAttack).toBe("special-attack");
    expect(STAT.special).toBe("special");
  });

  it("fills a bar to scale and clamps Blissey", () => {
    expect(SCALE_MAX).toBe(160);
    expect(barPercent(80)).toBe(50);
    expect(barPercent(0)).toBe(0);
    expect(barPercent(255)).toBe(100);
  });

  it("reads a value by slug, or 0", () => {
    const stats = [
      { name: "hp", value: 35 },
      { name: "speed", value: 90 },
    ];
    expect(statValue(stats, STAT.speed)).toBe(90);
    expect(statValue(stats, STAT.attack)).toBe(0);
  });
});
