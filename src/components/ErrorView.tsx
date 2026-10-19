import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

/** A page that could not be fetched: what was being fetched, and that trying again may help. */
function ErrorView({ message }: { message: string }) {
  const { t } = useTranslation();

  return (
    <div role="alert" className="flex justify-center items-center py-16">
      <div className="text-dex-red text-center">
        <p className="text-xl font-semibold">{message}</p>
        <p className="mt-2">{t("error.retry")}</p>
      </div>
    </div>
  );
}

/** One line in red, where a part of a page that already works could not be fetched. */
export const InlineError = ({ children }: { children: ReactNode }) => (
  <p role="alert" className="text-xs text-dex-red">
    {children}
  </p>
);

export default ErrorView;
