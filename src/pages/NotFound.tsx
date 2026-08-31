import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Red's original battle back sprite: 32×32, four shades, 256 bytes, lifted from
 * the pokered disassembly (`gfx/player/redb.png`). Self-hosted rather than
 * hotlinked because PokéAPI serves no trainer sprites at all — only Pokémon,
 * items, badges and types — so there is no endpoint to build this URL from.
 * Scaled up with `image-rendering: pixelated` so it stays chunky, not blurred.
 */
const TRAINER_SPRITE = "/trainer-back.png";

const ITEM =
  "group flex items-center gap-2 text-sm cursor-pointer hover:text-[#E12025] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

const CURSOR =
  "opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100";

/** Gen 1 status panel: name and level on one line, HP bar under it. */
const StatusBox = ({
  name,
  level,
  hp,
}: {
  name: string;
  level: string;
  hp: number;
}) => (
  <div className="border-2 border-black bg-white px-2 py-1 md:px-3 md:py-2">
    <div className="flex items-baseline gap-4 text-[10px] md:text-xs">
      <span>{name}</span>
      <span className="ml-auto">:L{level}</span>
    </div>
    <div className="mt-2 flex items-center gap-2">
      <span className="text-[8px] md:text-[10px]">HP:</span>
      <div className="h-2 w-20 border-2 border-black md:w-28">
        <div className="h-full bg-[#356DB2]" style={{ width: `${hp}%` }} />
      </div>
    </div>
  </div>
);

export const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      {/* Battlefield, laid out like the Game Boy did it: the opponent's panel
          top left facing its sprite top right, yours mirrored underneath. */}
      <div className="border-4 border-black bg-white p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <StatusBox name="404" level="404" hp={0} />
          <span
            aria-hidden="true"
            className="glitch flex h-20 w-20 items-center justify-center text-2xl md:h-28 md:w-28 md:text-4xl"
          >
            404
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <img
            src={TRAINER_SPRITE}
            alt=""
            className="h-20 w-20 [image-rendering:pixelated] md:h-28 md:w-28"
          />
          {/* :L200 against :L404 — the status panels carry the joke. */}
          <StatusBox name="ASH" level="200" hp={100} />
        </div>
      </div>

      <div className="mt-4 border-4 border-black bg-white p-4 md:p-6">
        <h1 className="text-sm leading-relaxed md:text-base">
          {t("notFound.wild")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed md:text-base">
          {t("notFound.missingPage")}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-12">
          <Link to="/" className={ITEM}>
            <span aria-hidden="true" className={CURSOR}>
              {">"}
            </span>
            {t("notFound.pokedex")}
          </Link>
          <button type="button" onClick={() => navigate(-1)} className={ITEM}>
            <span aria-hidden="true" className={CURSOR}>
              {">"}
            </span>
            {t("notFound.run")}
          </button>
        </div>
      </div>
    </div>
  );
};
