import { statsInEra } from "@/domain/pokemonView";
import { useEra } from "@/era/context";
import { SCALE_MAX } from "@/features/details/StatList";
import { humanize, useStatLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";

const width = (value: number) => `${Math.min(value / SCALE_MAX, 1) * 100}%`;

/** Base stats back to back: yours grow left in blue, the opponent's right in red. */
export const StatDuel = ({ yours, foe }: { yours: Pokemon; foe: Pokemon }) => {
  const { era } = useEra();
  const statLabel = useStatLabel();
  const theirs = statsInEra(foe, era);
  const rows = statsInEra(yours, era).map((stat) => ({
    name: stat.name,
    a: stat.value,
    b: theirs.find((other) => other.name === stat.name)?.value ?? 0,
  }));

  return (
    <div>
      <div className="mb-4 flex justify-between text-[10px]">
        <span className="text-[#356DB2]">{humanize(yours.name)}</span>
        <span className="text-[#E12025]">{humanize(foe.name)}</span>
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.name}>
            <dt className="mb-1 text-center text-[10px] text-gray-500">
              {statLabel(row.name)}
            </dt>
            <dd className="grid grid-cols-[2.5rem_1fr_1fr_2.5rem] items-center gap-2 text-[10px]">
              <span className={`text-right ${row.a < row.b ? "text-gray-400" : ""}`}>
                {row.a}
              </span>
              <div className="flex h-4 justify-end bg-[#EAEBF2]">
                <div className="h-full bg-[#356DB2]" style={{ width: width(row.a) }} />
              </div>
              <div className="flex h-4 bg-[#EAEBF2]">
                <div className="h-full bg-[#E12025]" style={{ width: width(row.b) }} />
              </div>
              <span className={row.b < row.a ? "text-gray-400" : ""}>{row.b}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
