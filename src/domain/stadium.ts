// The cups of the two N64 Stadiums and what each lets in. Hand-written: PokéAPI knows
// neither game. Read from Bulbapedia, checked against Serebii and WikiDex.

import { genOrder } from "./dex";
import type { DexEra } from "./era";

/** The two games, by the digit their address carries. */
export const STADIUM_GAMES = ["1", "2"] as const;
export type StadiumGame = (typeof STADIUM_GAMES)[number];

export const isStadiumGame = (value: string | undefined): value is StadiumGame =>
  STADIUM_GAMES.some((game) => game === value);

/** Whether the era is one the Stadiums cover: neither game goes past Gen II. */
export const stadiumInEra = (era: DexEra): boolean => genOrder(era.maxGen) <= genOrder("ii");

/** Pokémon entered, Pokémon sent into each battle, trainers beaten in a row; alike in both games. */
export const STADIUM_TEAM = { entered: 6, battle: 3, trainers: 8 } as const;

/** The classes a four-class cup climbs, easiest first, by their item slugs. */
export const BALLS = ["poke-ball", "great-ball", "ultra-ball", "master-ball"] as const;
type Ball = (typeof BALLS)[number];

export type CupId =
  | "pika"
  | "petit"
  | "poke"
  | "prime"
  | "little"
  | "challenge"
  | "castle"
  | "mewtwo"
  | "rival";

export interface Cup {
  id: CupId;
  /** The levels a Pokémon may enter at, both ends included. */
  levels?: { min: number; max: number };
  /** The most the three sent into one battle may add up to. */
  levelTotal?: number;
  /** One class, or the four from Poké Ball to Master Ball; a castle or a boss has none. */
  classes?: 1 | 4;
  /** The level each class deals its Pokémon at, where the class sets it and not the player. */
  classLevels?: Readonly<Record<Ball, number>>;
  /** Height and weight caps, both included, in PokéAPI's tenths: decimetres and hectograms. */
  size?: { height: number; weight: number };
  /** Species kept out; empty is everyone let in, absent is a cup that takes no entries. */
  banned?: readonly string[];
  bannedMoves?: readonly string[];
  /** How many species pass every rule, where the rules leave a short list. */
  eligible?: number;
  /** The opponents' level, where it is fixed or rises to the player's highest. */
  foes?: { level: number; matchesYours?: boolean };
}

const ANY_LEVEL = { min: 1, max: 100 };

export const STADIUM_CUPS: Record<StadiumGame, readonly Cup[]> = {
  "1": [
    {
      id: "pika",
      levels: { min: 15, max: 20 },
      levelTotal: 50,
      classes: 1,
      banned: ["mewtwo", "mew"],
    },
    {
      id: "petit",
      levels: { min: 25, max: 30 },
      levelTotal: 80,
      classes: 1,
      size: { height: 20, weight: 200 },
      banned: ["mew"],
      eligible: 45,
    },
    {
      id: "poke",
      levels: { min: 50, max: 55 },
      levelTotal: 155,
      classes: 4,
      banned: ["mewtwo", "mew"],
    },
    { id: "prime", levels: ANY_LEVEL, classes: 4, banned: [], foes: { level: 100 } },
    { id: "castle", levels: ANY_LEVEL, banned: [], foes: { level: 50, matchesYours: true } },
    { id: "mewtwo", levels: ANY_LEVEL, banned: [], foes: { level: 100 } },
  ],
  "2": [
    {
      id: "little",
      levels: { min: 5, max: 5 },
      classes: 1,
      bannedMoves: ["dragon-rage", "sonic-boom"],
      eligible: 86,
    },
    {
      id: "poke",
      levels: { min: 50, max: 55 },
      levelTotal: 155,
      classes: 4,
      banned: ["mewtwo", "mew", "lugia", "ho-oh", "celebi"],
    },
    { id: "prime", levels: ANY_LEVEL, classes: 1, banned: [], foes: { level: 100 } },
    {
      id: "challenge",
      classes: 4,
      classLevels: { "poke-ball": 30, "great-ball": 45, "ultra-ball": 60, "master-ball": 75 },
    },
    { id: "castle", levels: ANY_LEVEL, banned: [], foes: { level: 50, matchesYours: true } },
    { id: "rival", levels: ANY_LEVEL, banned: [] },
  ],
};

/** One stop on a castle's climb: a city's slug for a gym, else a stop named in the copy; leader last. */
export interface CastleStop {
  at: string;
  fought: readonly string[];
}

/** The castles' stops by region; trainers by the class names the game prints. */
export const CASTLE_ROSTER: Record<
  StadiumGame,
  readonly { region: "kanto" | "johto"; stops: readonly CastleStop[] }[]
> = {
  "1": [
    {
      region: "kanto",
      stops: [
        { at: "pewter", fought: ["Bug Boy", "Lad", "Jr.♂", "Brock"] },
        { at: "cerulean", fought: ["Fisher", "Jr.♀", "Swimmer", "Misty"] },
        { at: "vermilion", fought: ["Sailor", "Rocker", "Old Man", "Lt. Surge"] },
        { at: "celadon", fought: ["Lass", "Beauty", "Cool♀", "Erika"] },
        { at: "fuchsia", fought: ["Biker", "Tamer", "Juggler", "Koga"] },
        { at: "saffron", fought: ["Cueball", "Burglar", "Medium", "Sabrina"] },
        { at: "cinnabar", fought: ["Judoboy", "Psychic", "Nerd", "Blaine"] },
        { at: "viridian", fought: ["Rocket", "Lab Man", "Cool♂", "Giovanni"] },
        { at: "elite-four", fought: ["Lorelei", "Bruno", "Agatha", "Lance"] },
        { at: "champion", fought: ["Rival"] },
      ],
    },
  ],
  "2": [
    {
      region: "johto",
      stops: [
        { at: "violet", fought: ["Bird Keeper Matt", "Falkner"] },
        { at: "azalea", fought: ["Bug Catcher Chaz", "Twins Min & Lyn", "Bugsy"] },
        { at: "goldenrod", fought: ["Lass Lois", "Beauty Rita", "Whitney"] },
        { at: "ecruteak", fought: ["Medium Holly", "Sage Ty", "Morty"] },
        { at: "cianwood", fought: ["Black Belt Nick", "Chuck"] },
        { at: "olivine", fought: ["Jasmine"] },
        { at: "rocket", fought: ["Grunt ♂", "Grunt ♀", "Executive ♀", "Executive ♂"] },
        { at: "mahogany", fought: ["Boarder Alvin", "Skier Carol", "Pryce"] },
        { at: "blackthorn", fought: ["Cooltrainer Gloria", "Cooltrainer Vince", "Clair"] },
        { at: "elite-four", fought: ["Will", "Koga", "Bruno", "Karen"] },
        { at: "champion", fought: ["Lance"] },
      ],
    },
    {
      region: "kanto",
      stops: [
        { at: "pewter", fought: ["Brock"] },
        { at: "cerulean", fought: ["Misty"] },
        { at: "vermilion", fought: ["Lt. Surge"] },
        { at: "celadon", fought: ["Erika"] },
        { at: "fuchsia", fought: ["Janine"] },
        { at: "saffron", fought: ["Sabrina"] },
        { at: "cinnabar", fought: ["Blaine"] },
        { at: "viridian", fought: ["Blue"] },
        { at: "silver-cave", fought: ["Red"] },
      ],
    },
  ],
};

/** The first game's prize for the castle's rival: one of these, at random. */
export const CASTLE_PRIZES: Record<StadiumGame, readonly { pokemon: string; level: number }[]> = {
  "1": [
    { pokemon: "bulbasaur", level: 5 },
    { pokemon: "charmander", level: 5 },
    { pokemon: "squirtle", level: 5 },
    { pokemon: "hitmonlee", level: 20 },
    { pokemon: "hitmonchan", level: 20 },
    { pokemon: "eevee", level: 25 },
    { pokemon: "omanyte", level: 20 },
    { pokemon: "kabuto", level: 20 },
  ],
  "2": [],
};

type GiftPokemon = "psyduck" | "pikachu" | "farfetchd" | "gligar";

/** A Pokémon the game hands over with a move it could not otherwise have; the copy says what for. */
export const STADIUM_GIFTS: Record<
  StadiumGame,
  readonly { pokemon: GiftPokemon; level?: number; move: string }[]
> = {
  "1": [
    { pokemon: "psyduck", level: 15, move: "amnesia" },
    // Taught to your own Pikachu, so no level of its own.
    { pokemon: "pikachu", move: "surf" },
  ],
  "2": [
    { pokemon: "farfetchd", level: 5, move: "baton-pass" },
    { pokemon: "gligar", level: 5, move: "earthquake" },
  ],
};
