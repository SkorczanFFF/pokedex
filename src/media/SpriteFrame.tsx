import { useSpriteBounds } from "./spriteBounds";

/**
 * The Game Boy builds a sprite from 8 × 8 tiles, and a Pokémon's box is a
 * whole number of them a side — 40, 48 or 56. Rounding the drawing up to the
 * tile draws at the box's size rather than the drawing's, which keeps the
 * game's own order: a 40-box Bulbasaur comes out smaller than a 56-box
 * Charizard instead of every Pokémon stretched to fill the frame.
 */
const TILE = 8;

/**
 * A sprite drawn at its own size, however it was padded.
 *
 * The transparent sheets sit the sprite on a canvas larger than it — and not
 * always in the same place, or at the same scale: a Gen II back sits in the
 * bottom right where a front sits bottom centre, and a Gen I back is drawn
 * twice over. So nothing is assumed about the canvas: the drawn pixels are
 * measured and the picture cropped to them, widened to wherever the animation
 * reaches, so the animation takes the still's place without the Pokémon
 * shifting or changing size.
 *
 * `width` is how wide to draw the frame, which is square — a number of pixels,
 * or `"fill"` to take the parent's square, which must then have a height of
 * its own. Until the bounds are measured nothing is drawn, so the picture
 * lands once, at its size, rather than twice.
 */
export const SpriteFrame = ({
  src,
  still,
  animated,
  width,
  alt,
}: {
  /** What to show: the still, or the animation standing in for it. */
  src: string;
  /** The still, which is what is measured. */
  still: string;
  /** Its animation, whose reach the measure takes in. */
  animated: string | null;
  width: number | "fill";
  alt: string;
}) => {
  const bounds = useSpriteBounds(still, animated);
  if (bounds === undefined) return null;

  const fill = width === "fill";

  // Bounds that could not be read: show the picture whole, as it comes.
  if (!bounds) {
    return (
      <img
        src={src}
        alt={alt}
        className={`block [image-rendering:pixelated] ${fill ? "h-full w-full object-contain" : ""}`}
        style={fill ? undefined : { width }}
      />
    );
  }

  const box = Math.ceil(Math.max(bounds.width, bounds.height) / TILE) * TILE;
  // The drawing sits centred in its box.
  const left = bounds.x - (box - bounds.width) / 2;
  const top = bounds.y - (box - bounds.height) / 2;
  // In a filled frame every length is a share of the frame's width — margins
  // included, which CSS measures against the width even on the top. The frame
  // is square, so that is the height too.
  const part = (length: number) =>
    fill ? `${(length / box) * 100}%` : length * (width / box);
  const frame = fill ? "100%" : width;

  return (
    <div className="overflow-hidden" style={{ width: frame, height: frame }}>
      {/* Preflight caps an <img> at its parent's width; this one is meant to
          overflow it by exactly the padding being cropped away. */}
      <img
        src={src}
        alt={alt}
        className="block max-w-none [image-rendering:pixelated]"
        style={{
          width: part(bounds.canvas.width),
          height: part(bounds.canvas.height),
          marginLeft: part(-left),
          marginTop: part(-top),
        }}
      />
    </div>
  );
};
