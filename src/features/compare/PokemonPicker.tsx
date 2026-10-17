import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getAllPokemonNames } from "@/api/pokemon";
import { resourceIdFromUrl } from "@/domain/resource";
import { useEra } from "@/era/context";
import { humanize } from "@/i18n/labels";

/** Enough to tell the forms of one Pokémon apart without a scroll. */
const MATCHES = 8;

/**
 * A name box with a list under it, read from the name index the search already
 * keeps for the session and bounded by the era.
 */
export const PokemonPicker = ({
  label,
  value,
  onPick,
}: {
  label: string;
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

  const { data: names = [] } = useQuery({
    queryKey: ["allPokemonNames"],
    queryFn: getAllPokemonNames,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const term = text.trim().toLowerCase().replace(/\s+/g, "-");
  const matches =
    open && term
      ? names
          .filter(
            (entry) =>
              entry.name.includes(term) &&
              resourceIdFromUrl(entry.url) <= era.maxDexId,
          )
          .sort(
            (x, y) =>
              Number(y.name.startsWith(term)) - Number(x.name.startsWith(term)) ||
              resourceIdFromUrl(x.url) - resourceIdFromUrl(y.url),
          )
          .slice(0, MATCHES)
      : [];

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

  const expanded = open && term.length > 0;

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
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            expanded && matches[active] ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setText(value ? humanize(value) : "");
          }}
          onKeyDown={onKeyDown}
          placeholder={t("compare.pickPlaceholder")}
          className="h-9 w-full min-w-0 border-2 bg-white px-2 text-sm"
        />
        {value && (
          <button
            type="button"
            onClick={() => onPick(null)}
            aria-label={t("compare.clear")}
            className="h-9 px-3 bg-[#E12025] text-sm text-white cursor-pointer hover:bg-red-700"
          >
            X
          </button>
        )}
      </div>
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-10 mt-1 max-h-64 overflow-y-auto border-2 border-black bg-white text-xs"
        >
          {matches.length === 0 ? (
            <li className="px-2 py-2 text-gray-500">{t("compare.noMatches")}</li>
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
                  index === active ? "bg-[#FECB09]" : ""
                }`}
              >
                <span aria-hidden="true" className={index === active ? "" : "opacity-0"}>
                  {">"}
                </span>
                {match.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
