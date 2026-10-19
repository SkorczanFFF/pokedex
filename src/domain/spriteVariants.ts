import type { Pokemon } from "@/types/pokemon";
import { sheetOf, type SpriteSetId } from "./spriteSets";
import { spriteUrl } from "./sprites";

// The pictures one sheet holds — front and back, each palette — and which of
// them a battle screen puts in a slot.

/**
 * How a sheet colours a picture. `default` is the game's own palette — for
 * Red and Blue that is the Super Game Boy's, with the plain Game Boy's four
 * greys under `gray` and Yellow's Game Boy Color palette under `gbc`. Shiny
 * arrived with Gen II.
 */
type SpriteColour = "default" | "shiny" | "gray" | "gbc";

/**
 * The palettes on offer: the game's own and, from Gen II, shiny. The Game Boy
 * greys and Yellow's Game Boy Color palette are held back.
 */
export type SpritePalette = "default" | "shiny";

/** Which way the Pokémon faces: the opponent's view, or the trainer's. */
export type SpriteView = "front" | "back";

/** One picture on a sheet: one view, in one palette. */
export interface SpriteVariant {
  /** PokéAPI's own key, e.g. `back_shiny_transparent`; what a pick remembers. */
  key: string;
  /** The picture to show — the transparent one wherever the game has it. */
  url: string;
  view: SpriteView;
  palette: SpritePalette;
  /** The same picture in motion, where the game drew one: Crystal did, Gold did not. */
  animated: string | null;
}

const COLOURS: readonly SpriteColour[] = ["default", "shiny", "gray", "gbc"];
const PALETTES: readonly SpritePalette[] = ["default", "shiny"];
const VIEWS: readonly SpriteView[] = ["front", "back"];

/**
 * Reads a key apart. The keys are compound and not even in one order —
 * `back_shiny_transparent` but `front_transparent_gray` — so they are read
 * by their words rather than assembled from them.
 */
const parseKey = (
  key: string,
): { back: boolean; colour: SpriteColour; transparent: boolean } | null => {
  const words = key.split("_");
  const side = words[0];
  if (side !== "front" && side !== "back") return null;
  return {
    back: side === "back",
    colour:
      COLOURS.find((c) => c !== "default" && words.includes(c)) ?? "default",
    transparent: words.includes("transparent"),
  };
};

/**
 * The pictures a sheet holds for this Pokémon — front then back, each in the
 * palettes on offer — in that fixed order. Empty for the artwork, which is one
 * picture, and for a sheet the Pokémon is not on.
 *
 * Each is shown once, in its transparent cut where the game has one and
 * otherwise as it comes — Red / Green (JP) has no transparent cut at all. The
 * keys are still read in full, so that `front_transparent_gray` is known for
 * the grey picture it is and never taken for the default's transparent cut.
 */
export const spriteVariants = (
  pokemon: Pokemon,
  set: SpriteSetId,
): SpriteVariant[] => {
  const sheet = sheetOf(pokemon, set);
  if (!sheet) return [];
  const picture = (key: string): string | null => {
    const url = sheet[key];
    return typeof url === "string" ? url : null;
  };
  const animated =
    typeof sheet.animated === "object" && sheet.animated !== null
      ? sheet.animated
      : {};
  // Emerald's "animated" entries are stills in PNG; only a GIF is a motion.
  const moving = (key: string): string | null => {
    const url = animated[key];
    return typeof url === "string" && url.endsWith(".gif") ? url : null;
  };

  // Keyed `front/shiny`: the opaque key and the transparent one for each.
  const slots = new Map<string, { opaque?: string; transparent?: string }>();
  for (const key of Object.keys(sheet)) {
    const parsed = parseKey(key);
    if (!parsed || picture(key) === null) continue;
    const at = `${parsed.back ? "back" : "front"}/${parsed.colour}`;
    const slot = slots.get(at) ?? {};
    slot[parsed.transparent ? "transparent" : "opaque"] = key;
    slots.set(at, slot);
  }

  return VIEWS.flatMap((view) =>
    PALETTES.flatMap((palette) => {
      const slot = slots.get(`${view}/${palette}`);
      const shown = slot?.transparent ?? slot?.opaque;
      const url = shown ? picture(shown) : null;
      if (!slot || !shown || !url) return [];
      return [
        {
          key: shown,
          url,
          view,
          palette,
          animated: slot.opaque ? moving(slot.opaque) : null,
        },
      ];
    }),
  );
};

/**
 * The picture a battle screen puts in a slot: the set's own front or back, else
 * the default sheet's, else the front turned round — a back nobody drew is
 * still better shown than left empty.
 */
export const battleSprite = (
  pokemon: Pokemon,
  set: SpriteSetId,
  view: SpriteView,
): { url: string; mirrored: boolean } | null => {
  const own = spriteVariants(pokemon, set).find(
    (v) => v.view === view && v.palette === "default",
  );
  if (own) return { url: own.url, mirrored: false };
  const { front_default: front, back_default: back } = pokemon.sprites;
  if (view === "back" && back) return { url: back, mirrored: false };
  const fallback = front || spriteUrl(pokemon, "artwork");
  return fallback ? { url: fallback, mirrored: view === "back" } : null;
};

/**
 * Showdown's animated GIF for the view, or its front turned round where only
 * the back is missing — one style in both slots beats a mix. Null sends the
 * slot back to the static sprites.
 */
export const showdownSprite = (
  pokemon: Pokemon,
  view: SpriteView,
): { url: string; mirrored: boolean } | null => {
  const sheet = pokemon.sprites.other.showdown;
  if (view === "back" && sheet?.back_default) {
    return { url: sheet.back_default, mirrored: false };
  }
  return sheet?.front_default
    ? { url: sheet.front_default, mirrored: view === "back" }
    : null;
};
