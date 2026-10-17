export interface GifRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GifReading {
  /** The length of one pass, in milliseconds. */
  cycleMs: number;
  /** Where each frame paints on the canvas, in order. */
  frames: GifRect[];
}

/**
 * What a GIF's structure says about it, or null when the bytes are not a GIF
 * this can read. Nothing is decoded: only the frame table is walked.
 *
 * A GIF carries no total length. It is a run of frames, each preceded by a
 * Graphic Control Extension holding that frame's delay in hundredths of a
 * second, and one pass is the sum of those. A delay of 0 or 1 is shown as
 * 100 ms by every browser — Netscape did that for the GIFs of its day that
 * wrote 0 and meant "as fast as you can", and nothing since has dared differ —
 * so it is summed that way here too.
 *
 * Each frame also declares the rectangle it paints, and a frame after the
 * first paints only what changed, so those rectangles say how far the
 * animation reaches beyond its first frame.
 *
 * Crystal's sheets loop without end (a Netscape loop count of 0), hold their
 * last frame for a second, and run 2.7 to 3.6 s a pass, Bulbasaur to Unown.
 */
export const readGif = (bytes: ArrayBuffer): GifReading | null => {
  const b = new Uint8Array(bytes);
  // "GIF" and the 13-byte header: signature, version, logical screen descriptor.
  if (b.length < 13 || b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) {
    return null;
  }
  // A colour table, when the flag bit says there is one, is 3 × 2^(n+1) bytes.
  const colourTable = (packed: number): number =>
    packed & 0x80 ? 3 << ((packed & 7) + 1) : 0;
  const u16 = (at: number): number => b[at] | (b[at + 1] << 8);

  let at = 13 + colourTable(b[10]);
  let cycleMs = 0;
  const frames: GifRect[] = [];

  // Data sub-blocks: a length byte and that many bytes, until a 0 length.
  const skipSubBlocks = () => {
    while (at < b.length && b[at] !== 0) at += b[at] + 1;
    at++;
  };

  while (at < b.length) {
    const block = b[at];
    if (block === 0x3b) break; // trailer
    if (block === 0x21) {
      // Extension: introducer, label, then sub-blocks. The graphic control one
      // is a 4-byte block — packed flags, delay low, delay high, transparent index.
      const label = b[at + 1];
      at += 2;
      if (label === 0xf9 && at + 4 < b.length) {
        const delay = u16(at + 2);
        cycleMs += (delay <= 1 ? 10 : delay) * 10;
      }
      skipSubBlocks();
    } else if (block === 0x2c) {
      // Image descriptor: introducer, left, top, width, height, packed — then
      // an optional local colour table, the LZW minimum code size, and the
      // pixel sub-blocks.
      if (at + 10 > b.length) return null;
      frames.push({
        x: u16(at + 1),
        y: u16(at + 3),
        width: u16(at + 5),
        height: u16(at + 7),
      });
      at += 10 + colourTable(b[at + 9]) + 1;
      skipSubBlocks();
    } else {
      return null;
    }
  }
  return frames.length > 0 ? { cycleMs, frames } : null;
};
