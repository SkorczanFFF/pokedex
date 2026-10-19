import { useTranslation } from "react-i18next";
import { versusPath } from "@/app/routes";
import { AdAction, AdBox, StadiumTitle } from "@/components/AdBox";
import { crystalAnimated } from "@/domain/resource";
import { humanize } from "@/i18n/labels";

/** Both Gen I, so Crystal drew them both. */
const YOURS = { name: "meowth", id: 52 };
const FOE = { name: "jigglypuff", id: 39 };

/**
 * A small ad for the Versus page, under the name the navbar gives it. Mortal
 * Kombat is in the layout — mirrored life bars, a big VS, FIGHT! — drawn as a
 * Gold / Silver text box, with Crystal's own animated Meowth and Jigglypuff
 * squared up at either end. Opens that matchup ready.
 */
export const VersusAd = () => {
  const { t } = useTranslation();

  return (
    <AdBox
      to={versusPath({ a: YOURS.name, b: FOE.name })}
      label={t("types.versusAd")}
    >
      {/* Mirrored to face Jigglypuff; the GIFs' white is the box's white. */}
      <Fighter id={YOURS.id} flipped />
      <span className="min-w-0 flex-1 text-center">
        <StadiumTitle>{t("versus.link")}</StadiumTitle>
        <span className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <LifeBar name={YOURS.name} />
          <span
            aria-hidden="true"
            className="-skew-x-12 text-xl text-dex-red [filter:drop-shadow(2px_2px_0_#000)] md:text-2xl"
          >
            VS
          </span>
          <LifeBar name={FOE.name} flipped />
        </span>
        {/* Quoted, so the same in every language: the battle menu's first
            line, and the word Mortal Kombat's announcer opens a round on. */}
        <AdAction>FIGHT!</AdAction>
      </span>
      <Fighter id={FOE.id} />
    </AdBox>
  );
};

/** The fighter's name over a full HP bar; the foe's fills from the right. */
const LifeBar = ({ name, flipped = false }: { name: string; flipped?: boolean }) => (
  <span className={`flex min-w-0 flex-col gap-0.5 ${flipped ? "items-end" : "items-start"}`}>
    <span className="max-w-full truncate text-[8px] uppercase">
      {humanize(name)}
    </span>
    <span aria-hidden="true" className="block h-1.5 w-full border border-black">
      <span className="block h-full bg-dex-blue" />
    </span>
  </span>
);

/** Crystal's sprite at its own 56px, stepping in when the ad is hovered. */
const Fighter = ({ id, flipped = false }: { id: number; flipped?: boolean }) => (
  <img
    src={crystalAnimated(id)}
    alt=""
    className={`h-14 w-14 shrink-0 [image-rendering:pixelated] transition-transform ${
      flipped
        ? "-scale-x-100 motion-safe:group-hover:translate-x-1"
        : "motion-safe:group-hover:-translate-x-1"
    }`}
  />
);
