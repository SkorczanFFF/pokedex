import { describe, expect, it } from "vitest";
import { typeClass } from "./typeStyles";

describe("typeClass", () => {
  it("colours a known type and greys an unknown one", () => {
    expect(typeClass("fire")).toMatch(/^bg-/);
    expect(typeClass("fire")).not.toBe(typeClass("water"));
    expect(typeClass("shadow")).toBe("bg-gray-200 text-black");
  });
});
