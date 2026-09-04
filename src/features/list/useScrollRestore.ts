import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Puts the list back where the user left it when they return from a detail
 * page. The offset rides along in history state, written at click time by the
 * card that was clicked.
 *
 * It has to wait for `hasData`: scrolling to 4000px on an empty grid just lands
 * at the bottom of nothing. The ref makes it a one-shot, and the state is
 * cleared straight after so reloading the same URL later starts at the top.
 */
export const useScrollRestore = (hasData: boolean) => {
  const location = useLocation();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  useLayoutEffect(() => {
    if (restoredRef.current || !hasData) return;
    const y = (location.state as { restoreScroll?: number } | null)
      ?.restoreScroll;
    if (typeof y !== "number") return;

    window.scrollTo(0, y);
    restoredRef.current = true;
    navigate(`${location.pathname}${location.search}`, { replace: true });
  }, [hasData, location, navigate]);
};
