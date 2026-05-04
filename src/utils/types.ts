export const TYPE_STYLES: Record<string, string> = {
  normal: "bg-[#A8A77A] text-white",
  fire: "bg-[#EE8130] text-white",
  water: "bg-[#6390F0] text-white",
  electric: "bg-[#F7D02C] text-black",
  grass: "bg-[#7AC74C] text-white",
  ice: "bg-[#96D9D6] text-black",
  fighting: "bg-[#C22E28] text-white",
  poison: "bg-[#A33EA1] text-white",
  ground: "bg-[#E2BF65] text-black",
  flying: "bg-[#A98FF3] text-white",
  psychic: "bg-[#F95587] text-white",
  bug: "bg-[#A6B91A] text-white",
  rock: "bg-[#B6A136] text-white",
  ghost: "bg-[#735797] text-white",
  dragon: "bg-[#6F35FC] text-white",
  dark: "bg-[#705746] text-white",
  steel: "bg-[#B7B7CE] text-black",
  fairy: "bg-[#D685AD] text-white",
};

export const typeClass = (name: string): string =>
  TYPE_STYLES[name] ?? "bg-gray-200 text-black";

export const TYPE_NAMES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonType = (typeof TYPE_NAMES)[number];

export const isPokemonType = (s: string | null): s is PokemonType =>
  s !== null && (TYPE_NAMES as readonly string[]).includes(s);
