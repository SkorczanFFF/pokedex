import { describe, expect, it } from "vitest";
import { makePokemon } from "./__fixtures__/pokemon";
import { genOpening, setGame, spriteGameName } from "./spriteSets";
import { battleSprite, showdownSprite, spriteVariants } from "./spriteVariants";
import { activeSpriteSet, spriteSets, spriteUrl, spriteUrlById } from "./sprites";

const pikachu = makePokemon({
  sprites: {
    front_default: "today/front.png",
    back_default: "today/back.png",
    other: { "official-artwork": { front_default: "artwork/25.png" } },
    versions: {
      "generation-i": {
        "red-blue": {
          front_default: "rb/front.png",
          front_gray: "rb/front-gray.png",
          front_transparent: "rb/front-t.png",
          back_default: "rb/back.png",
          back_gray: "rb/back-gray.png",
          back_transparent: null,
        },
        yellow: { front_default: null, back_default: null },
      },
      "generation-ii": {
        crystal: {
          front_default: "c/front.png",
          front_shiny: "c/shiny.png",
          front_transparent: "c/front-t.png",
          front_shiny_transparent: "c/shiny-t.png",
          back_default: "c/back.png",
          back_shiny: "c/back-shiny.png",
          animated: { front_default: "c/front.gif", front_shiny: "c/shiny.gif" },
        },
      },
    },
  },
});

describe("sets", () => {
  it("reads a set id apart and names the game", () => {
    expect(setGame("artwork")).toBeNull();
    expect(setGame("ii/crystal")).toEqual({ gen: "ii", game: "crystal" });
    expect(spriteGameName("ii/crystal")).toBe("Crystal");
    expect(spriteGameName("i/red-green-japan")).toBe("Red / Green (JP)");
    expect(genOpening("i")).toBe("i/red-blue");
    expect(genOpening("ii")).toBe("ii/crystal");
  });

  it("lists only the sets this Pokémon is drawn on", () => {
    expect(spriteSets(pikachu)).toEqual(["artwork", "i/red-blue", "ii/crystal"]);
  });

  it("settles on the pick, else the era's opening shot, else the first set there is", () => {
    expect(activeSpriteSet(pikachu, { sprites: "artwork" }, "ii/crystal")).toBe("ii/crystal");
    expect(activeSpriteSet(pikachu, { sprites: "ii/crystal" }, null)).toBe("ii/crystal");
    expect(activeSpriteSet(pikachu, { sprites: "i/yellow" }, null)).toBe("artwork");
  });
});

describe("urls", () => {
  it("resolves a picture from the payload, or by dex id", () => {
    expect(spriteUrl(pikachu, "artwork")).toBe("artwork/25.png");
    expect(spriteUrl(pikachu, "ii/crystal")).toBe("c/front.png");
    expect(spriteUrl(pikachu, "ii/crystal", "front_shiny")).toBe("c/shiny.png");
    expect(spriteUrl(pikachu, "i/yellow")).toBeNull();
    expect(spriteUrlById(25, "ii/crystal")).toMatch(/\/versions\/generation-ii\/crystal\/25\.png$/);
    expect(spriteUrlById(25, "artwork")).toMatch(/\/other\/official-artwork\/25\.png$/);
  });
});

describe("spriteVariants", () => {
  it("shows each view and palette once, transparent where the game has it, with its motion", () => {
    expect(spriteVariants(pikachu, "ii/crystal")).toEqual([
      { key: "front_transparent", url: "c/front-t.png", view: "front", palette: "default", animated: "c/front.gif" },
      { key: "front_shiny_transparent", url: "c/shiny-t.png", view: "front", palette: "shiny", animated: "c/shiny.gif" },
      { key: "back_default", url: "c/back.png", view: "back", palette: "default", animated: null },
      { key: "back_shiny", url: "c/back-shiny.png", view: "back", palette: "shiny", animated: null },
    ]);
  });

  it("holds back the Game Boy greys and skips a cut that is null", () => {
    expect(spriteVariants(pikachu, "i/red-blue")).toEqual([
      { key: "front_transparent", url: "rb/front-t.png", view: "front", palette: "default", animated: null },
      { key: "back_default", url: "rb/back.png", view: "back", palette: "default", animated: null },
    ]);
  });

  it("is empty for the artwork and for a sheet the Pokémon is not on", () => {
    expect(spriteVariants(pikachu, "artwork")).toEqual([]);
    expect(spriteVariants(pikachu, "ii/gold")).toEqual([]);
  });
});

describe("battleSprite", () => {
  it("takes the set's own back where one was drawn", () => {
    expect(battleSprite(pikachu, "ii/crystal", "back")).toEqual({ url: "c/back.png", mirrored: false });
    expect(battleSprite(pikachu, "ii/crystal", "front")).toEqual({ url: "c/front-t.png", mirrored: false });
  });

  it("takes Showdown's GIF where there is one, mirrored for a missing back", () => {
    const withShowdown = makePokemon({
      sprites: {
        ...pikachu.sprites,
        other: {
          ...pikachu.sprites.other,
          showdown: { front_default: "sd/front.gif", back_default: null },
        },
      },
    });
    expect(showdownSprite(withShowdown, "front")).toEqual({ url: "sd/front.gif", mirrored: false });
    expect(showdownSprite(withShowdown, "back")).toEqual({ url: "sd/front.gif", mirrored: true });
    expect(showdownSprite(pikachu, "front")).toBeNull();
  });

  it("falls back to the default sheet, then turns the front round", () => {
    expect(battleSprite(pikachu, "i/yellow", "back")).toEqual({ url: "today/back.png", mirrored: false });
    const noBack = makePokemon({
      sprites: { ...pikachu.sprites, back_default: null },
    });
    expect(battleSprite(noBack, "i/yellow", "back")).toEqual({ url: "today/front.png", mirrored: true });
  });
});
