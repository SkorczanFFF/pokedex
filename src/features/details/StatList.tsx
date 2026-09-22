import { useTranslation } from "react-i18next";
import { statsInEra } from "@/domain/pokemonView";
import { useEra } from "@/era/context";
import { useStatLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

/**
 * Top of the bar's scale. Blissey's 255 HP would otherwise run past the track,
 * so the fill is clamped rather than the track widened for one outlier.
 */
const SCALE_MAX = 160;

export const StatList = ({ pokemon }: { pokemon: Pokemon }) => {
  const { t } = useTranslation();
  const statLabel = useStatLabel();
  const { era } = useEra();

  // The numbers are the era's own, not today's dressed in a retro frame:
  // Pikachu defended at 30 rather than 40 until Gen VI, and at era I the six
  // bars become five, because Special had not been split yet.
  const stats = statsInEra(pokemon, era);

  return (
    <div>
      <h2 className="text-lg mb-3">{t("details.stats")}</h2>
      {/* One shared grid on desktop, so all bars start at the same edge. */}
      <div className="flex flex-col gap-3 md:grid md:grid-cols-[fit-content(8rem)_1fr] md:items-center md:gap-x-2">
        {stats.map((stat) => {
          const filled = Math.min((stat.value / SCALE_MAX) * 100, 100);

          return (
            <div
              key={stat.name}
              className="flex flex-col items-center gap-2 md:contents"
            >
              <span className="w-full md:w-auto text-xs">
                {statLabel(stat.name)}:
              </span>
              <div className="relative flex w-full h-5 overflow-hidden bg-[#EAEBF2]">
                <div
                  className="h-full bg-[#356DB2]"
                  style={{ width: `${filled}%` }}
                />
                {/* Drawn twice and clipped at the fill edge, so a digit landing
                    on that edge is white on the filled side and black on the
                    empty one. A blend mode cannot do this — its result follows
                    the backdrop, and difference over #356DB2 resolves to
                    #CA924D, not to white. */}
                <span
                  className="absolute inset-0 flex items-center justify-center text-[10px] leading-none text-white"
                  style={{ clipPath: `inset(0 ${100 - filled}% 0 0)` }}
                >
                  {stat.value}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center text-[10px] leading-none text-black"
                  style={{ clipPath: `inset(0 0 0 ${filled}%)` }}
                >
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
