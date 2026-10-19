import { describe, expect, it } from "vitest";
import { intersectByName } from "./intersect";

const grass = [{ name: "bulbasaur" }, { name: "oddish" }, { name: "exeggcute" }];
const poison = [{ name: "oddish" }, { name: "zubat" }, { name: "bulbasaur" }];
const genI = [{ name: "bulbasaur" }, { name: "zubat" }];

describe("intersectByName", () => {
  it("answers nothing for no lists and a copy for one", () => {
    expect(intersectByName([])).toEqual([]);
    const copy = intersectByName([grass]);
    expect(copy).toEqual(grass);
    expect(copy).not.toBe(grass);
  });

  it("keeps the first list's order", () => {
    expect(intersectByName([grass, poison])).toEqual([
      { name: "bulbasaur" },
      { name: "oddish" },
    ]);
    expect(intersectByName([poison, grass])).toEqual([
      { name: "oddish" },
      { name: "bulbasaur" },
    ]);
  });

  it("narrows by every list at once", () => {
    expect(intersectByName([grass, poison, genI])).toEqual([{ name: "bulbasaur" }]);
    expect(intersectByName([grass, []])).toEqual([]);
  });
});
