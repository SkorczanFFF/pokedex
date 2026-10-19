import { useEffect } from "react";

/** Calls `onEscape` on the Escape key while `enabled` — the way out of a menu or a sheet. */
export const useEscape = (onEscape: () => void, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onEscape, enabled]);
};
