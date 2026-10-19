import { useSearchParams } from "react-router-dom";
import { DEFAULT_LEVEL, clampLevel } from "@/domain/damage";
import type { Side } from "./BattleField";

/** One side of the matchup as the URL has it. */
export interface SideParams {
  /** The Pokémon's slug, or null for an empty slot. */
  name: string | null;
  /** An ability slug the reader picked; checked against the Pokémon once it loads. */
  ability: string | null;
  /** A move slug the reader picked; checked against the learnset once it loads. */
  move: string | null;
  level: number;
}

const KEYS: Record<Side, { name: string; ability: string; move: string; level: string }> = {
  a: { name: "a", ability: "aa", move: "am", level: "al" },
  b: { name: "b", ability: "ba", move: "bm", level: "bl" },
};

const readLevel = (raw: string | null): number => {
  const level = Number(raw);
  return raw !== null && raw !== "" && Number.isFinite(level)
    ? clampLevel(level)
    : DEFAULT_LEVEL;
};

/**
 * Both slots live in the URL, so a matchup is a link — and so is a calculation:
 * the ability, the move and the level of each side ride beside the two names.
 * The numbers a reader types over the computed stats do not; they are a look at
 * this one page, not something to send.
 */
export const useVersusParams = () => {
  const [params, setParams] = useSearchParams();

  const read = (side: Side): SideParams => {
    const keys = KEYS[side];
    return {
      name: params.get(keys.name),
      ability: params.get(keys.ability),
      move: params.get(keys.move),
      level: readLevel(params.get(keys.level)),
    };
  };
  const a = read("a");
  const b = read("b");

  const write = (patch: Record<string, string | null>, replace = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace },
    );

  const written = (side: Side, value: SideParams): Record<string, string | null> => {
    const keys = KEYS[side];
    return {
      [keys.name]: value.name,
      [keys.ability]: value.ability,
      [keys.move]: value.move,
      [keys.level]: value.level === DEFAULT_LEVEL ? null : String(value.level),
    };
  };

  return {
    a,
    b,
    /** A new Pokémon drops the ability and the move picked for the old one. */
    pick: (side: Side, name: string | null) =>
      write({ [KEYS[side].name]: name, [KEYS[side].ability]: null, [KEYS[side].move]: null }),
    setAbility: (side: Side, ability: string | null) =>
      write({ [KEYS[side].ability]: ability }),
    setMove: (side: Side, move: string | null) => write({ [KEYS[side].move]: move }),
    /** Typed digit by digit, so it replaces the entry rather than piling up history. */
    setLevel: (side: Side, level: number) =>
      write(
        {
          [KEYS[side].level]:
            clampLevel(level) === DEFAULT_LEVEL ? null : String(clampLevel(level)),
        },
        true,
      ),
    /** Everything changes sides at once, so a move stays with its Pokémon. */
    swap: () => write({ ...written("a", b), ...written("b", a) }),
  };
};
