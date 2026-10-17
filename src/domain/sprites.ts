import type { Pokemon, SpriteSheet } from "@/types/pokemon";
import { GEN_SLUGS, genApiName, isGenSlug, type GenSlug } from "./dex";
import { gameSprite, officialArtwork } from "./resource";

/**
 * The picture column shows the modern artwork or one game's sprite sheet,
 * named `ii/crystal` — the generation, then the game as PokéAPI keys it under
 * `sprites.versions`.
 */
export type SpriteSetId = "artwork" | `${GenSlug}/${string}`;

interface SpriteGame {
  /** PokéAPI's key under `sprites.versions["generation-…"]`. */
  key: string;
  /** The game's name, which is the same in every language. */
  name: string;
}

interface GenSheets {
  /** The sheets the picker offers, in the order they are listed. */
  games: readonly SpriteGame[];
  /** The sheet a generation opens on when picked by its numeral alone. */
  opensOn: string;
}

/**
 * The sheets the picker offers, per generation.
 *
 * Gen I and II are broken out game by game, because each of those games drew
 * its own: Gold's Pikachu is not Silver's, and neither is Crystal's. Later
 * generations list one representative — they ship two or three sheets each and
 * the difference is a palette, so the picker shows the last and most refined.
 * Adding a game is one more entry here.
 *
 * What a generation opens on is the originals for Gen I and the last and most
 * polished sheet everywhere else.
 */
const SPRITE_GAMES: Record<GenSlug, GenSheets> = {
  i: {
    games: [
      { key: "red-blue", name: "Red / Blue" },
      { key: "yellow", name: "Yellow" },
      { key: "red-green-japan", name: "Red / Green (JP)" },
    ],
    opensOn: "red-blue",
  },
  ii: {
    games: [
      { key: "gold", name: "Gold" },
      { key: "silver", name: "Silver" },
      { key: "crystal", name: "Crystal" },
    ],
    opensOn: "crystal",
  },
  iii: { games: [{ key: "emerald", name: "Emerald" }], opensOn: "emerald" },
  iv: { games: [{ key: "platinum", name: "Platinum" }], opensOn: "platinum" },
  v: {
    games: [{ key: "black-white", name: "Black / White" }],
    opensOn: "black-white",
  },
  vi: { games: [{ key: "x-y", name: "X / Y" }], opensOn: "x-y" },
  vii: {
    games: [{ key: "ultra-sun-ultra-moon", name: "Ultra Sun / Ultra Moon" }],
    opensOn: "ultra-sun-ultra-moon",
  },
  viii: {
    games: [
      {
        key: "brilliant-diamond-shining-pearl",
        name: "Brilliant Diamond / Shining Pearl",
      },
    ],
    opensOn: "brilliant-diamond-shining-pearl",
  },
  ix: {
    games: [{ key: "scarlet-violet", name: "Scarlet / Violet" }],
    opensOn: "scarlet-violet",
  },
};

export const gameSet = (gen: GenSlug, game: string): SpriteSetId =>
  `${gen}/${game}`;

/** The generation and game behind a set, or null for the artwork. */
export const setGame = (
  set: SpriteSetId,
): { gen: GenSlug; game: string } | null => {
  if (set === "artwork") return null;
  const [gen, game] = set.split("/");
  return isGenSlug(gen) && game ? { gen, game } : null;
};

/** The set a generation's numeral opens on. */
export const genOpening = (gen: GenSlug): SpriteSetId =>
  gameSet(gen, SPRITE_GAMES[gen].opensOn);

/** The game's name as printed on its box, or its key for one the table lacks. */
export const spriteGameName = (set: SpriteSetId): string => {
  const picked = setGame(set);
  if (!picked) return "";
  return (
    SPRITE_GAMES[picked.gen].games.find((g) => g.key === picked.game)?.name ??
    picked.game
  );
};

const sheetOf = (pokemon: Pokemon, set: SpriteSetId): SpriteSheet | null => {
  const picked = setGame(set);
  if (!picked) return null;
  return (
    pokemon.sprites.versions?.[genApiName(picked.gen)]?.[picked.game] ?? null
  );
};

/**
 * URL for one picture of a set, or null when this Pokémon has none there.
 * `key` is PokéAPI's own — `front_default`, `front_shiny_transparent` — and
 * the artwork has only the one.
 */
export const spriteUrl = (
  pokemon: Pokemon,
  set: SpriteSetId,
  key = "front_default",
): string | null => {
  if (set === "artwork") {
    return (
      pokemon.sprites.other["official-artwork"].front_default ||
      pokemon.sprites.front_default ||
      null
    );
  }
  const url = sheetOf(pokemon, set)?.[key];
  return typeof url === "string" ? url : null;
};

/**
 * The same picture addressed by dex id, for the places that never fetched a
 * payload to ask: an evolution chain hands back species URLs and nothing else.
 *
 * Unlike `spriteUrl` this cannot tell a sprite that exists from one that does
 * not, so it is only safe where the era already bounds the ids — retro stops at
 * 251, and all 251 have a Crystal sprite.
 */
export const spriteUrlById = (id: number, set: SpriteSetId): string => {
  const picked = setGame(set);
  return picked
    ? gameSprite(id, `${genApiName(picked.gen)}/${picked.game}`)
    : officialArtwork(id);
};

/**
 * The sets this Pokémon actually has, artwork first and then in dex order.
 *
 * Costs nothing: the sprite tree rides along in the /pokemon response we already
 * fetched, so a Pokémon's whole visual history is one render away rather than
 * one request per generation.
 */
export const spriteSets = (pokemon: Pokemon): SpriteSetId[] =>
  [
    "artwork" as const,
    ...GEN_SLUGS.flatMap((gen) =>
      SPRITE_GAMES[gen].games.map((game) => gameSet(gen, game.key)),
    ),
  ].filter((set) => spriteUrl(pokemon, set) !== null);

/**
 * The set actually up: the reader's pick while this Pokémon has it, else the
 * era's opening shot, else the first set there is. Following an evolution link
 * to a Pokémon with no Gen I sprite falls back rather than showing a gap.
 */
export const activeSpriteSet = (
  pokemon: Pokemon,
  era: { sprites: SpriteSetId },
  picked: SpriteSetId | null,
): SpriteSetId => {
  const sets = spriteSets(pokemon);
  const chosen = picked ?? era.sprites;
  return sets.includes(chosen) ? chosen : (sets[0] ?? "artwork");
};

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
