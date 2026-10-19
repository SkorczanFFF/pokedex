/** Everywhere a move's source is allowed to speak in colour. */
interface MethodAccent {
  /** The bright shade: the square beside a heading, and the row that is open. */
  fill: string;
  /** The bright shade thinned, under the pointer. */
  hover: string;
  /** The bright shade thinner still, behind an opened move. */
  panel: string;
  /** The bright shade as a border: the bar down an opened move's edge, and
   *  the rule down the side of the sentence its game printed. */
  bar: string;
  /** The dark shade, and the only place it appears. */
  label: string;
}

/**
 * The colour a move's source carries, in the list and in the panel alike.
 *
 * Five open panels were five identical boxes and five picked rows five
 * identical blue bars, so neither column said which section a move came from.
 * A source now owns a colour and spends it in both: the square beside its
 * heading, the wash a row takes under the pointer, the fill it takes once it is
 * open, and — across the gutter — the bar and wash of the panel that row
 * opened.
 *
 * They are the machine's own colours. Gold, Silver and Crystal ran on a Game
 * Boy Color, which mixes five bits to a channel — thirty-two steps, not two
 * hundred and fifty-six — so every value below lands on that grid, written here
 * with the RGB555 triple it came from. And a Gen II Pokémon is drawn from four
 * colours of which two are black and white, leaving each one exactly two of its
 * own. Each source is dressed the same way, and the two split by job rather
 * than by place: the bright one is every graphic — the square, the open row,
 * the bar, both washes — and the dark one is text and nothing else.
 *
 * Text is the whole reason the dark one exists. Ten pixels of #29CE21 on a
 * wash of itself is 1.9:1 and unreadable; the dark shade is 6.8:1. A bar has no
 * such floor — what it says is said in words on the line below it — so it takes
 * the bright shade and eight pixels of width to carry the weight the dark one
 * was carrying.
 *
 * The brights are bright enough to want black on them — what the yellow buttons
 * and the Electric badge already ask for — so every open row reads alike.
 * Level-up takes the blue the app already spends on a measured number, lit up;
 * the machines take the orange furthest from it, being the largest group by far
 * — ninety rows for Mewtwo in Scarlet and Violet — and so the one a level-up
 * move is most often held against.
 *
 * Never a filled chip inside a panel: that is what a *type* looks like two
 * lines below, and a second one would be read as another type. The words stay
 * too — colour is the fast channel and the label the reliable one, so nothing
 * here is told by colour alone.
 */
const METHOD_ACCENTS: Record<string, MethodAccent> = {
  // RGB 6, 18, 31 over RGB 2, 9, 22
  "level-up": {
    fill: "bg-[#3194FF]",
    hover: "hover:bg-[#3194FF]/20",
    panel: "bg-[#3194FF]/12",
    bar: "border-[#3194FF]",
    label: "text-[#104AB5]",
  },
  // RGB 5, 25, 4 over RGB 2, 12, 2
  egg: {
    fill: "bg-[#29CE21]",
    hover: "hover:bg-[#29CE21]/20",
    panel: "bg-[#29CE21]/12",
    bar: "border-[#29CE21]",
    label: "text-[#106310]",
  },
  // RGB 31, 12, 0 over RGB 19, 6, 0
  machine: {
    fill: "bg-[#FF6300]",
    hover: "hover:bg-[#FF6300]/20",
    panel: "bg-[#FF6300]/12",
    bar: "border-[#FF6300]",
    label: "text-[#9C3100]",
  },
  // RGB 22, 8, 31 over RGB 13, 0, 20
  tutor: {
    fill: "bg-[#B542FF]",
    hover: "hover:bg-[#B542FF]/20",
    panel: "bg-[#B542FF]/12",
    bar: "border-[#B542FF]",
    label: "text-[#6B00A5]",
  },
};

/**
 * The four are the ones the era's games use. PokéAPI carries a dozen more —
 * `train` for Pokémon Champions, the Stadium and XD oddities — and those keep
 * grey rather than borrow a colour whose meaning the headings do not teach.
 */
const NO_ACCENT: MethodAccent = {
  fill: "bg-gray-400",
  hover: "hover:bg-gray-100",
  panel: "bg-gray-50",
  bar: "border-gray-400",
  label: "text-gray-500",
};

export const moveMethodAccent = (method: string): MethodAccent =>
  METHOD_ACCENTS[method] ?? NO_ACCENT;
