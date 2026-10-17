import { useCallback, useEffect, useRef, useState } from "react";
import { readGif } from "@/domain/gif";
import { playCry } from "./cry";
import { gifBytes } from "./gifBytes";

/** When the bytes say nothing about the length: about one Crystal pass. */
const FALLBACK_MS = 3000;

/**
 * Stop this far inside the last frame's hold, so the loop never gets to show
 * its first frame again before the still goes back in.
 */
const MARGIN_MS = 50;

interface Pass {
  url: string | null;
  timer: number | null;
}

/**
 * A GIF played through once, on demand, with a cry under it.
 *
 * `src` is what to show now: the GIF while it runs, null otherwise, so the
 * caller falls back to its still. The GIF is fetched into memory and shown
 * from an object URL rather than its own address: a fresh URL each time, so
 * the browser starts it at frame one instead of joining an animation it
 * already has running for that address — Firefox keeps one clock per URL —
 * and no cache-busting query that would refetch. The bytes also give the
 * length of one pass, which is the only way to stop at the end of it: the
 * sheets loop forever and an <img> raises no event for a lap.
 */
export const useAnimatedOnce = (
  gif: string | null,
  cry: string | null,
): { src: string | null; play: () => void } => {
  const [src, setSrc] = useState<string | null>(null);
  const pass = useRef<Pass | null>(null);

  const stop = useCallback(() => {
    const current = pass.current;
    if (!current) return;
    if (current.timer !== null) window.clearTimeout(current.timer);
    if (current.url !== null) URL.revokeObjectURL(current.url);
    pass.current = null;
    setSrc(null);
  }, []);

  // A pick of another picture, or leaving the page, ends a pass early.
  useEffect(() => stop, [gif, stop]);

  const play = useCallback(async () => {
    if (!gif || pass.current) return;
    const attempt: Pass = { url: null, timer: null };
    pass.current = attempt;

    let bytes: ArrayBuffer;
    try {
      bytes = await gifBytes(gif);
    } catch {
      if (pass.current === attempt) pass.current = null;
      return;
    }
    if (pass.current !== attempt) return; // stopped while it was fetching

    attempt.url = URL.createObjectURL(new Blob([bytes], { type: "image/gif" }));
    const ms = readGif(bytes)?.cycleMs ?? FALLBACK_MS;
    attempt.timer = window.setTimeout(stop, Math.max(0, ms - MARGIN_MS));
    setSrc(attempt.url);
    if (cry) playCry(cry);
  }, [gif, cry, stop]);

  return { src, play };
};
