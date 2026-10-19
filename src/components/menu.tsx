/** A menu line the way the games drew them, cursor and all. */
export const MENU_ITEM =
  "group flex items-center gap-2 text-sm cursor-pointer hover:text-dex-red focus-ring-dark";

/**
 * The `>` in front of a menu line. By default dim until the line is hovered or
 * focused; a caller with its own idea of when the cursor shows passes the
 * classes that say so.
 */
export const MenuCursor = ({
  className = "opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100",
}: {
  className?: string;
}) => (
  <span aria-hidden="true" className={className}>
    {">"}
  </span>
);
