import { statsInEra } from "@/domain/pokemonView";
import { barPercent, statValue } from "@/domain/stats";
import { useEra } from "@/app/era/context";
import { useStatLabel } from "@/i18n/labels";
import type { Pokemon } from "@/types/pokemon";
import { SideHeading } from "./SideHeading";

const width = (value: number) => `${barPercent(value)}%`;

/** Base stats back to back: yours grow left in blue, the opponent's right in red. */
export const StatDuel = ({ yours, foe }: { yours: Pokemon; foe: Pokemon }) => {
  const { era } = useEra();
  const statLabel = useStatLabel();
  const theirs = statsInEra(foe, era);
  const rows = statsInEra(yours, era).map((stat) => ({
    name: stat.name,
    a: stat.value,
    b: statValue(theirs, stat.name),
  }));

  return (
    <div>
      {/* The same two headings the Moves tab opens its halves with. */}
      <div className="mb-4 flex justify-between gap-4">
        <SideHeading side="a" name={yours.name} />
        <SideHeading side="b" name={foe.name} className="text-right" />
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
              <div className="flex h-4 justify-end bg-dex-bg">
                <div className="h-full bg-dex-blue" style={{ width: width(row.a) }} />
              </div>
              <div className="flex h-4 bg-dex-bg">
                <div className="h-full bg-dex-red" style={{ width: width(row.b) }} />
              </div>
              <span className={row.b < row.a ? "text-gray-400" : ""}>{row.b}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
