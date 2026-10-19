import { describe, expect, it } from "vitest";
import { moveMethodAccent } from "./moveAccents";

describe("moveMethodAccent", () => {
  it("colours the four methods the games use and greys the rest", () => {
    expect(moveMethodAccent("level-up").fill).not.toBe(moveMethodAccent("machine").fill);
    expect(moveMethodAccent("egg").label).toMatch(/^text-/);
    expect(moveMethodAccent("train")).toEqual(moveMethodAccent("stadium-surfing-pikachu"));
  });
});
