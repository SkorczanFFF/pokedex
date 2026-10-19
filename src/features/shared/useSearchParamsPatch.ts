import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/** Keys to set, and keys to drop: null, undefined or an empty string removes one. */
export type ParamPatch = Record<string, string | null | undefined>;

/**
 * The query string edited key by key. Keys the patch does not name stay as
 * they are, so the list's filters and Versus' two sides each write only their
 * own. `replace` is for a value typed digit by digit, which should not pile
 * up history entries.
 */
export const useSearchParamsPatch = () => {
  const [params, setParams] = useSearchParams();

  const patch = useCallback(
    (changes: ParamPatch, { replace = false }: { replace?: boolean } = {}) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === "") next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace },
      ),
    [setParams],
  );

  return [params, patch] as const;
};
