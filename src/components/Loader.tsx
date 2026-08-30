import { useTranslation } from "react-i18next";

function Loader() {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center items-center min-h-screen flex-col gap-4">
      <div className="text-2xl">{t("loader.loading")}</div>
      <div className="loader"></div>
    </div>
  );
}

export default Loader;
