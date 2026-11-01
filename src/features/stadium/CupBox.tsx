import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { pokemonPath } from "@/app/routes";
import { TEXT_LINK } from "@/components/buttons";
import { GbSection } from "@/components/layout";
import { Bullets } from "@/components/prose";
import { BALLS, STADIUM_TEAM, type Cup } from "@/domain/stadium";
import { useMoveLabel } from "@/i18n/labels";

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="contents">
    <dt className="text-gray-500">{label}</dt>
    <dd>{children}</dd>
  </div>
);

/** One cup: the rules that are numbers as rows, the ones that are sentences under them. */
export const CupBox = ({ cup, notes }: { cup: Cup; notes: readonly string[] }) => {
  const { t } = useTranslation();
  const moveLabel = useMoveLabel();
  const ball = (slug: (typeof BALLS)[number]) => t(`stadium.balls.${slug}`);
  const { classLevels } = cup;

  return (
    <GbSection heading={t(`stadium.cups.${cup.id}`)}>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        {cup.levels && (
          <Row label={t("stadium.row.level")}>
            {cup.levels.min === cup.levels.max
              ? cup.levels.min
              : `${cup.levels.min}–${cup.levels.max}`}
          </Row>
        )}
        {cup.levelTotal && (
          <Row label={t("stadium.row.total")}>
            {t("stadium.totalValue", { total: cup.levelTotal, battle: STADIUM_TEAM.battle })}
          </Row>
        )}
        {cup.size && (
          <Row label={t("stadium.row.size")}>
            {t("stadium.sizeValue", {
              height: cup.size.height / 10,
              weight: cup.size.weight / 10,
            })}
          </Row>
        )}
        {cup.classes && (
          <Row label={t("stadium.row.classes")}>
            {classLevels ? (
              <ul>
                {BALLS.map((slug) => (
                  <li key={slug}>
                    {t("stadium.classLevel", { ball: ball(slug), level: classLevels[slug] })}
                  </li>
                ))}
              </ul>
            ) : cup.classes === 1 ? (
              t("stadium.oneClass")
            ) : (
              BALLS.map(ball).join(", ")
            )}
          </Row>
        )}
        {cup.banned && (
          <Row label={t("stadium.row.banned")}>
            {cup.banned.length === 0
              ? t("stadium.nobody")
              : cup.banned.map((slug, i) => (
                  <Fragment key={slug}>
                    {i > 0 && ", "}
                    {/* Spelled as the dex page heads it; `humanize` drops Ho-Oh's hyphen. */}
                    <Link to={pokemonPath(slug)} className={`${TEXT_LINK} capitalize`}>
                      {slug}
                    </Link>
                  </Fragment>
                ))}
          </Row>
        )}
        {cup.bannedMoves && (
          <Row label={t("stadium.row.moves")}>{cup.bannedMoves.map(moveLabel).join(", ")}</Row>
        )}
        {cup.eligible && (
          <Row label={t("stadium.row.eligible")}>
            {t("stadium.eligibleValue", { count: cup.eligible })}
          </Row>
        )}
        {cup.foes && (
          <Row label={t("stadium.row.foes")}>
            {t(cup.foes.matchesYours ? "stadium.foesMatch" : "stadium.foesLevel", {
              level: cup.foes.level,
            })}
          </Row>
        )}
      </dl>
      {notes.length > 0 && <Bullets items={notes} />}
    </GbSection>
  );
};
