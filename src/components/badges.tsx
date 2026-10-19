import { useTranslation } from "react-i18next";
import type { Effectiveness } from "@/domain/matchup";
import { useDamageClassLabel, useTypeLabel } from "@/i18n/labels";
import { effectClass, printed } from "./effectiveness";
import { typeBadgeClass, type BadgeSize } from "./typeBadge";

/** A type in its own colour, labelled in the reading language. */
export const TypeBadge = ({
  type,
  size = "xs",
  className = "",
}: {
  type: string;
  size?: BadgeSize;
  className?: string;
}) => {
  const typeLabel = useTypeLabel();
  return (
    <span className={`${typeBadgeClass(type, size)} ${className}`}>{typeLabel(type)}</span>
  );
};

/** A move's damage class, grey beside the type's colour. */
export const ClassBadge = ({ damageClass }: { damageClass: string }) => {
  const damageClassLabel = useDamageClassLabel();
  return (
    <span className="bg-gray-200 px-2 py-1 text-[10px] leading-none">
      {damageClassLabel(damageClass)}
    </span>
  );
};

/**
 * Says a sentence is in English because the reading language had none: the
 * short mark for sighted readers, the full sentence for a screen reader.
 */
export const LangMarker = ({ title }: { title: string }) => {
  const { t } = useTranslation();
  return (
    <span
      title={title}
      className="ml-2 align-middle bg-gray-200 text-gray-600 text-[10px] px-1 py-[2px]"
    >
      <span aria-hidden="true">{t("details.englishEntryShort")}</span>
      <span className="sr-only">{title}</span>
    </span>
  );
};

/** A multiplier in a small box, coloured by what it does. */
export const EffectChip = ({ value }: { value: Effectiveness }) => (
  <span
    className={`inline-flex h-6 min-w-6 items-center justify-center border border-gray-300 px-1 text-[10px] ${effectClass(
      value,
      true,
    )}`}
  >
    ×{printed(value)}
  </span>
);
