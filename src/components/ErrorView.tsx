import { useTranslation } from "react-i18next";

function ErrorView({ errorType }: { errorType: "list" | "details" }) {
  const { t } = useTranslation();

  return (
    <div role="alert" className="flex justify-center items-center py-16">
      <div className="text-[#E12025] text-center">
        <p className="text-xl font-semibold">{t(`error.${errorType}`)}</p>
        <p className="mt-2">{t("error.retry")}</p>
      </div>
    </div>
  );
}

export default ErrorView;
