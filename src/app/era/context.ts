import { createContext, useContext } from "react";
import type { DexEra, EraName } from "@/domain/era";

export interface EraContextValue {
  /** The rules themselves — what components ask, instead of "is retro on". */
  era: DexEra;
  /** Which era is selected, for the toggle and for storage. */
  name: EraName;
  setEra: (name: EraName) => void;
}

export const EraContext = createContext<EraContextValue | null>(null);

export const useEra = (): EraContextValue => {
  const value = useContext(EraContext);
  if (!value) {
    throw new Error("useEra must be called inside an EraProvider");
  }
  return value;
};
