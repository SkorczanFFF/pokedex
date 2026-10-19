import { VERSUS_PARAMS } from "@/app/routes";
import { DEFAULT_LEVEL, clampLevel } from "@/domain/damage";
import { useSearchParamsPatch, type ParamPatch } from "@/features/shared/useSearchParamsPatch";
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
  const [params, patch] = useSearchParamsPatch();

  const read = (side: Side): SideParams => {
    const keys = VERSUS_PARAMS[side];
    return {
      name: params.get(keys.name),
      ability: params.get(keys.ability),
      move: params.get(keys.move),
      level: readLevel(params.get(keys.level)),
    };
  };
  const a = read("a");
  const b = read("b");

  const written = (side: Side, value: SideParams): ParamPatch => {
    const keys = VERSUS_PARAMS[side];
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
      patch({
        [VERSUS_PARAMS[side].name]: name,
        [VERSUS_PARAMS[side].ability]: null,
        [VERSUS_PARAMS[side].move]: null,
      }),
    setAbility: (side: Side, ability: string | null) =>
      patch({ [VERSUS_PARAMS[side].ability]: ability }),
    setMove: (side: Side, move: string | null) =>
      patch({ [VERSUS_PARAMS[side].move]: move }),
    /** Typed digit by digit, so it replaces the entry rather than piling up history. */
    setLevel: (side: Side, level: number) =>
      patch(
        {
          [VERSUS_PARAMS[side].level]:
            clampLevel(level) === DEFAULT_LEVEL ? null : String(clampLevel(level)),
        },
        { replace: true },
      ),
    /** Everything changes sides at once, so a move stays with its Pokémon. */
    swap: () => patch({ ...written("a", b), ...written("b", a) }),
  };
};
