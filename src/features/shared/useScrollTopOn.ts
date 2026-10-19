import { useEffect } from "react";

/**
 * Scrolls to the top when `key` changes — and once on mount, which is what a
 * route reached from the bottom of another page needs. A route that keeps its
 * component mounted across a change of `:name` passes the name, so the reset
 * follows it.
 */
export const useScrollTopOn = (key: unknown = null) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);
};
