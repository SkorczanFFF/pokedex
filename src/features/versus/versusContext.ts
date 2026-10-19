import { createContext, useContext } from "react";
import type { TypeChart } from "@/domain/typeChart";
import type { Side } from "./model";
import type { SideParams } from "./useVersusParams";

/**
 * What every part of the text box reads once both fighters and the chart are
 * in: the chart of the era, each side's ability and URL state, and the two
 * setters that write a pick back. Held in a context rather than threaded four
 * levels down through props that no level in between used.
 */
interface VersusContextValue {
  chart: TypeChart;
  /** The ability each side is read with, or null where the era has none. */
  abilities: Record<Side, string | null>;
  sides: Record<Side, SideParams>;
  setMove: (side: Side, move: string | null) => void;
  setLevel: (side: Side, level: number) => void;
}

export const VersusContext = createContext<VersusContextValue | null>(null);

export const useVersus = (): VersusContextValue => {
  const value = useContext(VersusContext);
  if (!value) {
    throw new Error("useVersus must be called inside VersusContext.Provider");
  }
  return value;
};
