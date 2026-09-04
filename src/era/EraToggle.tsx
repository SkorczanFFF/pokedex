import { useTranslation } from "react-i18next";
import { useEra } from "./context";

/**
 * One button rather than a pair like the language switch: retro is a mode you
 * turn on, and the navbar has no room for two labels in a pixel font. Pressed
 * state carries which way it is, so the label never has to change.
 */
const EraToggle = () => {
  const { t } = useTranslation();
  const { name, setEra } = useEra();
  const isRetro = name === "retro";
  const description = t(isRetro ? "era.disable" : "era.enable");

  return (
    <button
      type="button"
      onClick={() => setEra(isRetro ? "modern" : "retro")}
      aria-pressed={isRetro}
      aria-label={description}
      title={description}
      // The dashed frame is what separates it from EN | PL beside it: those
      // pick a language, this one changes what the whole dex is. Without it the
      // three read as one group of three choices.
      className={`border border-dashed px-2 py-1 text-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        isRetro
          ? "border-black/50 bg-[#FECB09] text-black"
          : "border-white/60 text-white hover:bg-[#c11a1e]"
      }`}
    >
      {t("era.retro")}
    </button>
  );
};

export default EraToggle;
