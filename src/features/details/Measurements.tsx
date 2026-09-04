import { useTranslation } from "react-i18next";

/** Height and weight. PokéAPI ships both in tenths, hence the /10. */
export const Measurements = ({
  height,
  weight,
}: {
  height: number;
  weight: number;
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h2 className="text-lg mb-2">{t("details.height")}</h2>
        <p className="text-xs">
          {t("details.heightValue", { value: height / 10 })}
        </p>
      </div>
      <div>
        <h2 className="text-lg mb-2">{t("details.weight")}</h2>
        <p className="text-xs">
          {t("details.weightValue", { value: weight / 10 })}
        </p>
      </div>
    </div>
  );
};
