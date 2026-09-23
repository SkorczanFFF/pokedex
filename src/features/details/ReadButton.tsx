import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEra } from "@/era/context";
import { hush, say } from "./pokedexVoice";

/** Reads the entry aloud in the dex's own robot voice; a second press stops it. */
export const ReadButton = ({
  name,
  text,
  lang,
}: {
  name: string;
  text: string;
  lang: string;
}) => {
  const { t } = useTranslation();
  const { era } = useEra();
  const [state, setState] = useState<"idle" | "loading" | "speaking">("idle");

  // Another entry, or leaving the page, silences this one.
  useEffect(() => hush, [text]);

  const toggle = () => {
    if (state !== "idle") return hush();
    setState("loading");
    say(text, lang, era.voice, () => setState("speaking"))
      .catch((error) => console.error("Pokédex voice failed", error))
      .finally(() => setState("idle"));
  };

  return (
    <button
      onClick={toggle}
      aria-label={
        state === "idle" ? t("details.readEntry", { name }) : t("details.stopReading")
      }
      aria-busy={state === "loading"}
      className="ml-2 align-middle whitespace-nowrap text-xs px-2 py-1 bg-[#FECB09] hover:bg-[#E12025] hover:text-white cursor-pointer"
    >
      {state === "idle" && ` > ${t("details.read")}`}
      {state === "loading" && " ... "}
      {state === "speaking" && ` ■ ${t("details.stopReading")}`}
    </button>
  );
};
