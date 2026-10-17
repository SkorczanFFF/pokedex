import { useEffect, useState } from "react";
import { readGif, type GifRect } from "@/domain/gif";
import { gifBytes } from "./gifBytes";

/** Where a sprite's drawn pixels lie on its canvas. */
export interface SpriteBounds extends GifRect {
  canvas: { width: number; height: number };
}

/**
 * Bounds already measured, so a picture is measured once however many times
 * it is shown — and answers in the same render, so switching back to a picture
 * already seen never blanks a frame.
 */
const measured = new Map<string, SpriteBounds | null>();
const measuring = new Map<string, Promise<void>>();

const loadImage = (url: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    // Asked for with CORS so the canvas may read it back; the sprite repo
    // allows any origin. Without that the pixels are sealed and this returns
    // nothing, and the picture is shown whole instead.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });

/** The box around every pixel that is not fully transparent. */
const drawnBounds = (image: HTMLImageElement): SpriteBounds | null => {
  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(image, 0, 0);
  let pixels: Uint8ClampedArray;
  try {
    pixels = context.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 3] === 0) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < 0) return null;
  return {
    canvas: { width, height },
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
};

const union = (bounds: SpriteBounds, rect: GifRect): SpriteBounds => {
  const left = Math.min(bounds.x, rect.x);
  const top = Math.min(bounds.y, rect.y);
  const right = Math.max(bounds.x + bounds.width, rect.x + rect.width);
  const bottom = Math.max(bounds.y + bounds.height, rect.y + rect.height);
  return {
    canvas: bounds.canvas,
    x: left,
    y: top,
    width: Math.min(right, bounds.canvas.width) - left,
    height: Math.min(bottom, bounds.canvas.height) - top,
  };
};

/**
 * The still's drawn pixels, widened to wherever its animation reaches.
 *
 * A GIF's first frame is the still itself; every frame after it declares the
 * rectangle it repaints, so those rectangles are where the Pokémon moves to.
 * Taking them in up front is what lets the animation take the still's place
 * without the picture being cropped or scaled any differently. The GIF shares
 * the still's canvas, which is what makes its rectangles meaningful here. If
 * it cannot be read, the still's own bounds stand.
 */
const measure = async (
  still: string,
  animated: string | null,
): Promise<SpriteBounds | null> => {
  const image = await loadImage(still);
  if (!image) return null;
  let bounds = drawnBounds(image);
  if (!bounds || !animated) return bounds;
  try {
    const gif = readGif(await gifBytes(animated));
    for (const frame of gif?.frames.slice(1) ?? []) {
      bounds = union(bounds, frame);
    }
  } catch {
    /* the still's own bounds stand */
  }
  return bounds;
};

/**
 * A sprite's bounds: undefined while they are being measured, null when they
 * could not be.
 */
export const useSpriteBounds = (
  still: string,
  animated: string | null,
): SpriteBounds | null | undefined => {
  const key = `${still}|${animated ?? ""}`;
  const [, rerender] = useState(0);

  useEffect(() => {
    if (measured.has(key)) return;
    let live = true;
    let pending = measuring.get(key);
    if (!pending) {
      pending = measure(still, animated).then((bounds) => {
        measured.set(key, bounds);
      });
      measuring.set(key, pending);
    }
    pending.then(() => {
      if (live) rerender((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, [key, still, animated]);

  return measured.has(key) ? measured.get(key) : undefined;
};
