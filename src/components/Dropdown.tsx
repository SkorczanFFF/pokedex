import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { MenuCursor } from "./menu";

interface Option {
  value: string;
  label: string;
}

interface Group {
  label: string;
  options: Option[];
}

const isGroup = (item: Option | Group): item is Group => "options" in item;

/**
 * A select drawn by the app rather than the browser: the closed box is the
 * same framed line the inputs have, and the open list is a menu of the kind
 * the games drew — a cursor on the line under the pointer, the line pressed
 * yellow. A native `<select>` lets a page style the closed box but not the
 * list, and each browser draws that list its own way.
 *
 * Works the way a select does: Space or Enter opens it, the arrows walk it,
 * Home and End jump, a letter jumps to the next option starting with it (and
 * picks it outright while the list is closed), Escape closes it. `items` may
 * mix options with groups of them, as `<optgroup>` does.
 *
 * `className` sizes the whole thing — width and text size, which the list
 * inherits; `boxClassName` frames the closed box. `fit` makes the box as wide
 * as its widest option, the way a native select is, so it does not change
 * width with every pick.
 */
export const Dropdown = ({
  id,
  value,
  items,
  onChange,
  disabled = false,
  fit = false,
  className = "",
  boxClassName = "",
}: {
  id?: string;
  value: string;
  items: readonly (Option | Group)[];
  onChange: (value: string) => void;
  disabled?: boolean;
  fit?: boolean;
  className?: string;
  boxClassName?: string;
}) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const flat = items.flatMap((item) => (isGroup(item) ? item.options : [item]));
  const selectedIndex = flat.findIndex((option) => option.value === value);
  const selected = flat[selectedIndex] ?? null;

  const close = () => setOpen(false);
  const openAt = () => {
    setActive(Math.max(0, selectedIndex));
    setOpen(true);
  };
  const pick = (option: Option) => {
    onChange(option.value);
    close();
  };

  // The active line follows the keyboard into view, as a select's would.
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  /** The next option, after `from` and wrapping round, whose label starts with the letter. */
  const nextStartingWith = (letter: string, from: number): number | undefined => {
    const wanted = letter.toLowerCase();
    for (let step = 1; step <= flat.length; step++) {
      const index = (from + step) % flat.length;
      if (flat[index].label.toLowerCase().startsWith(wanted)) return index;
    }
    return undefined;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const move = (delta: number) => {
      e.preventDefault();
      if (!open) return openAt();
      setActive((index) => Math.min(flat.length - 1, Math.max(0, index + delta)));
    };
    switch (e.key) {
      case "ArrowDown":
        return move(1);
      case "ArrowUp":
        return move(-1);
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        return;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(flat.length - 1);
        }
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) return openAt();
        if (flat[active]) pick(flat[active]);
        return;
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        return;
      default: {
        if (e.key.length !== 1 || e.key === " ") return;
        const hit = nextStartingWith(e.key, open ? active : selectedIndex);
        if (hit === undefined) return;
        if (open) setActive(hit);
        else onChange(flat[hit].value);
      }
    }
  };

  const line = (option: Option) => {
    const index = flat.indexOf(option);
    const isActive = index === active;
    const isSelected = option.value === value;
    return (
      <li
        key={option.value}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={isSelected}
        // Mouse down, not click: a click lands after the blur has closed the list.
        onMouseDown={(e) => {
          e.preventDefault();
          pick(option);
        }}
        onMouseEnter={() => setActive(index)}
        className={`flex cursor-pointer items-center gap-2 px-2 py-2 ${isActive ? "bg-dex-yellow" : ""}`}
      >
        <MenuCursor className={isActive ? "" : isSelected ? "opacity-50" : "opacity-0"} />
        <span className="min-w-0 [overflow-wrap:anywhere]">{option.label}</span>
      </li>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && flat[active] ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openAt())}
        onKeyDown={onKeyDown}
        onBlur={close}
        className={`dropdown-box flex w-full cursor-pointer items-center text-left focus-ring-dark ${boxClassName}`}
      >
        {/* Every label is laid in the same cell, unseen, so the box is as wide
            as the widest; only the picked one shows. */}
        <span className="grid min-w-0 flex-1">
          {fit &&
            flat.map((option) => (
              <span
                key={option.value}
                aria-hidden="true"
                className="invisible col-start-1 row-start-1 whitespace-nowrap"
              >
                {option.label}
              </span>
            ))}
          <span className="col-start-1 row-start-1 truncate">{selected?.label ?? ""}</span>
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={id}
          // Pressing on the list — its scrollbar included — must not take the
          // focus, and with it the list, away from the box.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 z-20 mt-1 max-h-96 w-max min-w-full max-w-[min(20rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto border-2 border-black bg-white"
        >
          {items.map((item) =>
            isGroup(item) ? (
              <li key={item.label} role="group" aria-label={item.label}>
                <div className="px-2 pt-2 pb-1 text-[9px] uppercase text-gray-500">
                  {item.label}
                </div>
                <ul role="presentation">{item.options.map(line)}</ul>
              </li>
            ) : (
              line(item)
            ),
          )}
        </ul>
      )}
    </div>
  );
};
