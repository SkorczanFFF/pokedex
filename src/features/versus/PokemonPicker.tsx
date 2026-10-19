import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { allPokemonNamesQuery } from "@/api/queries";
import { DANGER, INPUT } from "@/components/buttons";
import { MenuCursor } from "@/components/menu";
import { resourceIdFromUrl } from "@/domain/resource";
import { matchNames } from "@/domain/search";
import { useEra } from "@/era/context";
import { humanize } from "@/i18n/labels";

/**
 * A name box with the dex under it, from Bulbasaur on, read from the name index
 * the search already keeps for the session and bounded by the era. Typing
 * narrows it.
 */
export const PokemonPicker = ({
  label,
  placeholder,
  value,
  onPick,
}: {
  label: string;
  placeholder: string;
  /** The slug in the URL, or null for an empty slot. */
  value: string | null;
  onPick: (name: string | null) => void;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const inputId = useId();
  const listId = useId();
  const [text, setText] = useState(value ? humanize(value) : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // The URL is the source of truth; typing is only a draft until a pick.
  useEffect(() => {
    setText(value ? humanize(value) : "");
  }, [value]);

  const { data: names = [] } = useQuery(allPokemonNamesQuery);

  const term = text.trim().toLowerCase().replace(/\s+/g, "-");
  // The index comes in dex order, forms after the national dex, so no sort.
  const matches = open ? matchNames(names, term, era) : [];

  // Keeps the line the keyboard is on in view of a list a thousand long.
  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`${listId}-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  const pick = (name: string) => {
    onPick(name);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        setActive((i) => Math.min(i + 1, matches.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (matches[active]) pick(matches[active].name);
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={inputId} className="mb-2 block text-xs">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && matches[active] ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          // Selected on focus, so a new name replaces the picked one at once.
          onFocus={(e) => {
            setOpen(true);
            setActive(0);
            e.target.select();
          }}
          onBlur={() => {
            setOpen(false);
            setText(value ? humanize(value) : "");
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`${INPUT} w-full min-w-0`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onPick(null)}
            aria-label={t("versus.clear")}
            className={DANGER}
          >
            X
          </button>
        )}
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-10 mt-1 max-h-64 overflow-x-hidden overflow-y-auto border-2 border-black bg-white text-xs"
        >
          {matches.length === 0 ? (
            <li className="px-2 py-2 text-gray-500">{t("versus.noMatches")}</li>
          ) : (
            matches.map((match, index) => (
              <li
                key={match.name}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                // Mouse down, not click: a click lands after the blur has closed the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(match.name);
                }}
                onMouseEnter={() => setActive(index)}
                className={`flex cursor-pointer items-center gap-2 px-2 py-2 capitalize ${
                  index === active ? "bg-dex-yellow" : ""
                }`}
              >
                <MenuCursor className={index === active ? "" : "opacity-0"} />
                {/* A floor, not a width: up to #999 the names line up, and a
                    form's #10xxx pushes its own name rather than covering it. */}
                <span className="min-w-12 shrink-0 text-gray-400">
                  #{resourceIdFromUrl(match.url)}
                </span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{match.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
