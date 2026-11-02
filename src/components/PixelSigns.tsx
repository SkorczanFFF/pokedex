/**
 * Signs the pixel font lacks, drawn on its own grid of eight to the em, a column of
 * space after each; a row past the seventh hangs below the baseline.
 */
const SIGNS: Record<string, readonly string[]> = {
  "♂": ["....###", ".....##", ".####.#", "#...#..", "#...#..", "#...#..", ".###..."],
  "♀": [".###.", "#...#", "#...#", "#...#", ".###.", "..#..", ".###.", "..#.."],
};

const Sign = ({ char }: { char: string }) => {
  const rows = SIGNS[char];
  const columns = rows[0].length + 1;
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${columns} ${rows.length}`}
        shapeRendering="crispEdges"
        fill="currentColor"
        className="inline-block"
        style={{
          width: `${columns / 8}em`,
          height: `${rows.length / 8}em`,
          verticalAlign: `${(7 - rows.length) / 8}em`,
        }}
      >
        {rows.flatMap((row, y) =>
          [...row].flatMap((cell, x) =>
            cell === "#" ? [<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} />] : [],
          ),
        )}
      </svg>
      <span className="sr-only">{char}</span>
    </>
  );
};

const SIGN = new RegExp(`([${Object.keys(SIGNS).join("")}])`);

/** `text` with every sign the pixel font lacks drawn in its place. */
export const WithSigns = ({ text }: { text: string }) => (
  <>
    {/* Split on a captured group, so the signs land on the odd indices. */}
    {text.split(SIGN).map((part, i) => (i % 2 ? <Sign key={i} char={part} /> : part))}
  </>
);
