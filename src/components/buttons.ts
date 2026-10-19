// The app's buttons and boxes as class strings, named once. A component would
// wrap most of them in nothing but a `<button>`, and some are links.

/**
 * Yellow is something to press about this Pokémon: a cry, a reading, the page
 * of where it is met, Versus with it already picked — and Versus' swap.
 */
export const ACTION =
  "text-xs px-2 py-1 bg-dex-yellow hover:bg-dex-red hover:text-white cursor-pointer";

/** The same yellow at the size of a page's main step: Back, the filter sheet's Show. */
export const ACTION_LG =
  "px-4 py-2 bg-dex-yellow text-black hover:bg-dex-red hover:text-white cursor-pointer";

/** Grey, for stepping and clearing: the pager, the filter sheet's Clear. Dims when there is nothing to do. */
export const GHOST =
  "px-4 py-2 bg-gray-300 text-sm cursor-pointer hover:bg-dex-yellow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-300";

/** Shows the rest of a list that was cut short, or hides it again. */
export const MORE =
  "px-3 py-1 bg-gray-200 text-black text-xs cursor-pointer hover:bg-dex-yellow";

/** The red X that clears what was typed or picked. */
export const DANGER =
  "h-9 px-3 bg-dex-red text-white text-sm hover:bg-red-700 cursor-pointer";

/** A text box, the height of the buttons beside it. */
export const INPUT = "h-9 border-2 px-2 text-sm bg-white";

/** The closed box of a dropdown, the height of the buttons beside it. */
export const SELECT = "h-9 border-2 pl-2 bg-white";

/**
 * A framed link is a reference page that is about no Pokémon in particular:
 * the chart. Framed like a menu box, so it is neither a picker's wash nor an
 * action's yellow.
 */
export const PAGE_LINK =
  "inline-block px-3 py-1 text-xs border-2 border-black bg-white text-black hover:bg-dex-yellow cursor-pointer";
