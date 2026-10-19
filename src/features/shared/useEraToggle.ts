import { useTranslation } from "react-i18next";
import { DEFAULT_ERA } from "@/domain/era";
import { useEra } from "@/app/era/context";

/**
 * What both retro switches share — the one in the navbar and the line in the
 * phone's menu: whether retro is on, how to flip it, and what to tell a screen
 * reader the press will do.
 */
export const useEraToggle = () => {
  const { t } = useTranslation();
  const { name, setEra } = useEra();
  const isRetro = name === "retro";

  return {
    isRetro,
    toggle: () => setEra(isRetro ? DEFAULT_ERA : "retro"),
    /** What pressing does, said before the press. */
    description: t(isRetro ? "era.disable" : "era.enable"),
    label: t("era.retro"),
  };
};
