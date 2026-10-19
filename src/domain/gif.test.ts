import { describe, expect, it } from "vitest";
import { readGif } from "./gif";

interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
  /** In hundredths of a second, as the file stores it. */
  delay: number;
}

const u16 = (n: number) => [n & 0xff, n >> 8];

/** A GIF with no colour tables and one byte of pixels per frame — enough structure to walk. */
const gif = (frames: Frame[]): ArrayBuffer => {
  const bytes = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, ...u16(56), ...u16(56), 0, 0, 0];
  for (const frame of frames) {
    // Graphic Control Extension: introducer, label, size, packed, delay, transparent index, terminator.
    bytes.push(0x21, 0xf9, 0x04, 0, ...u16(frame.delay), 0, 0);
    // Image descriptor, LZW minimum code size, one sub-block of one byte, terminator.
    bytes.push(0x2c, ...u16(frame.x), ...u16(frame.y), ...u16(frame.width), ...u16(frame.height), 0);
    bytes.push(2, 1, 0x00, 0);
  }
  bytes.push(0x3b);
  return Uint8Array.from(bytes).buffer;
};

describe("readGif", () => {
  it("sums the frame delays into one pass and keeps each frame's rectangle", () => {
    const reading = readGif(
      gif([
        { x: 0, y: 0, width: 56, height: 56, delay: 20 },
        { x: 10, y: 20, width: 30, height: 16, delay: 50 },
      ]),
    );
    expect(reading).toEqual({
      cycleMs: 700,
      frames: [
        { x: 0, y: 0, width: 56, height: 56 },
        { x: 10, y: 20, width: 30, height: 16 },
      ],
    });
  });

  it("shows a delay of 0 or 1 for 100 ms, as every browser does", () => {
    expect(readGif(gif([{ x: 0, y: 0, width: 1, height: 1, delay: 0 }]))?.cycleMs).toBe(100);
    expect(readGif(gif([{ x: 0, y: 0, width: 1, height: 1, delay: 1 }]))?.cycleMs).toBe(100);
    expect(readGif(gif([{ x: 0, y: 0, width: 1, height: 1, delay: 2 }]))?.cycleMs).toBe(20);
  });

  it("answers null for anything that is not a GIF it can walk", () => {
    expect(readGif(new ArrayBuffer(5))).toBeNull();
    expect(readGif(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).buffer)).toBeNull();
    expect(readGif(gif([]))).toBeNull();
  });
});
