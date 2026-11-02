import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { GbBox, GbSection } from "@/components/layout";
import { MenuCursor } from "@/components/menu";
import { WithSigns } from "@/components/PixelSigns";
import { Bullets } from "@/components/prose";
import { CASTLE_PRIZES, CASTLE_ROSTER, STADIUM_GIFTS, type StadiumGame } from "@/domain/stadium";
import { humanize, useMoveLabel } from "@/i18n/labels";
import { DexLink } from "./DexLink";

/** Every stop on the castle, region by region where there are two, and what the rival hands over. */
export const CastleRoster = ({ game }: { game: StadiumGame }) => {
  const { t } = useTranslation();
  const wings = CASTLE_ROSTER[game];
  const prizes = CASTLE_PRIZES[game];

  return (
    <>
      {wings.map((wing) => (
        <div key={wing.region}>
          {wings.length > 1 && <h3 className="mb-2 text-gray-500">{humanize(wing.region)}</h3>}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[10px]">
            {wing.stops.map((stop) => (
              <div key={stop.at} className="contents">
                <dt className="text-gray-500">
                  {t(`stadium.castle.at.${stop.at}`, { defaultValue: humanize(stop.at) })}
                </dt>
                <dd>
                  {stop.fought.map((name, i) => (
                    <Fragment key={name}>
                      {i > 0 && ", "}
                      <WithSigns text={name} />
                    </Fragment>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      {prizes.length > 0 && (
        <p>
          {t("stadium.castle.prize")}{" "}
          {prizes.map((prize, i) => (
            <Fragment key={prize.pokemon}>
              {i > 0 && ", "}
              <DexLink slug={prize.pokemon} /> {t("stadium.level", { level: prize.level })}
            </Fragment>
          ))}
        </p>
      )}
    </>
  );
};

/** What the game opens along the way, and the Pokémon it hands over. */
export const PrizesBox = ({ game }: { game: StadiumGame }) => {
  const { t } = useTranslation();
  const moveLabel = useMoveLabel();
  const unlocks: readonly string[] = t(`stadium.unlocks.${game}`, { returnObjects: true });

  return (
    <GbSection heading={t("stadium.sections.prizes")}>
      <Bullets items={unlocks} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
        {STADIUM_GIFTS[game].map((gift) => (
          <div key={gift.pokemon} className="contents">
            <dt>
              <DexLink slug={gift.pokemon} />
            </dt>
            <dd>
              {gift.level ? `${t("stadium.level", { level: gift.level })} · ` : ""}
              {moveLabel(gift.move)}
              <p className="mt-1 text-gray-500">{t(`stadium.gifts.${gift.pokemon}`)}</p>
            </dd>
          </div>
        ))}
      </dl>
    </GbSection>
  );
};

/** The game's modes outside the cups, a sentence each. */
export const ModesBox = ({ game }: { game: StadiumGame }) => {
  const { t } = useTranslation();
  const modes: readonly { name: string; text: string }[] = t(`stadium.modes.${game}`, {
    returnObjects: true,
  });

  return (
    <GbSection heading={t("stadium.sections.modes")}>
      <dl className="space-y-3">
        {modes.map((mode) => (
          <div key={mode.name}>
            <dt className="text-gray-500">{mode.name}</dt>
            <dd className="mt-1">{mode.text}</dd>
          </div>
        ))}
      </dl>
    </GbSection>
  );
};

/** How the game's battles differ from the handheld ones, closed until opened. */
export const MechanicsBox = ({ game }: { game: StadiumGame }) => {
  const { t } = useTranslation();
  const changes: readonly string[] = t(`stadium.mechanics.${game}`, { returnObjects: true });

  return (
    <GbBox>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 focus-ring-dark [&::-webkit-details-marker]:hidden">
          <MenuCursor className="opacity-50 transition-transform group-open:rotate-90" />
          <h2 className="text-sm">{t("stadium.sections.mechanics")}</h2>
        </summary>
        <div className="mt-4 text-xs leading-relaxed">
          <Bullets items={changes} />
        </div>
      </details>
    </GbBox>
  );
};
