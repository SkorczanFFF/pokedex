import { useTranslation } from "react-i18next";
import { useStatLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

/**
 * Top of the bar's scale. Blissey's 255 HP would otherwise run past the track,
 * so the fill is clamped rather than the track widened for one outlier.
 */
const SCALE_MAX = 160;

export const StatList = ({ stats }: { stats: Pokemon["stats"] }) => {
  const { t } = useTranslation();
  const statLabel = useStatLabel();

  return (
    <div>
      <h2 className="text-lg mb-3">{t("details.stats")}</h2>
      <div className="space-y-3">
        {stats.map((stat) => {
          const filled = Math.min((stat.base_stat / SCALE_MAX) * 100, 100);

          return (
            <div
              key={stat.stat.name}
              className="flex items-center gap-2 flex-col md:flex-row"
            >
              <span className="w-full md:w-32 text-xs">
                {statLabel(stat.stat.name)}:
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
                  {stat.base_stat}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center text-[10px] leading-none text-black"
                  style={{ clipPath: `inset(0 0 0 ${filled}%)` }}
                >
                  {stat.base_stat}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
