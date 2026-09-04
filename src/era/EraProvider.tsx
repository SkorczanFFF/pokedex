import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ERAS, isEraName, type EraName } from "@/domain/era";
import { EraContext } from "./context";

const STORAGE_KEY = "era";

/**
 * Reading storage can throw outright, not just return null — a private window,
 * or a browser set to block site data. Either way the answer is the default.
 */
const storedEra = (): EraName => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isEraName(stored) ? stored : "modern";
  } catch {
    return "modern";
  }
};

/**
 * Which era the dex is rendered as of.
 *
 * A preference rather than a view, so it lives in storage the way the language
 * does — not in the URL. Filters belong in the URL because a filtered list is
 * shared as a link; a reading mode is not, and putting it there would mean
 * threading the parameter through every card, every evolution link and the
 * back button.
 */
export const EraProvider = ({ children }: { children: ReactNode }) => {
  const [name, setName] = useState<EraName>(storedEra);

  const setEra = useCallback((next: EraName) => {
    setName(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice still holds for this session, it just will not survive it */
    }
  }, []);

  const value = useMemo(
    () => ({ era: ERAS[name], name, setEra }),
    [name, setEra]
  );

  return <EraContext.Provider value={value}>{children}</EraContext.Provider>;
};
