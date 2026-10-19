import { useEffect } from "react";
import { useAnimatedOnce } from "./useAnimatedOnce";

/**
 * A GIF played through once when it appears and once every `everyMs` after,
 * without a cry: the enemy's sprite on the battle screen, which the game
 * animates when it comes out and this page keeps animating now and then so it
 * is not mistaken for a picture. `src` is the GIF while a pass runs and null
 * between passes, so the caller falls back to its still. Held still for a
 * reader who asked for reduced motion.
 */
export const useAnimatedEvery = (gif: string | null, everyMs: number): string | null => {
  const { src, play } = useAnimatedOnce(gif, null);

  useEffect(() => {
    if (!gif || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    play();
    const timer = window.setInterval(play, everyMs);
    return () => window.clearInterval(timer);
  }, [gif, everyMs, play]);

  return src;
};
