import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ACTION } from "@/components/buttons";
import { useEra } from "@/app/era/context";
import { hush, say } from "@/media/pokedexVoice";

/** Reads the entry aloud in the dex's voice; a second press stops it. */
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
      className={ACTION}
    >
      {state === "idle" && ` > ${t("details.read")}`}
      {state === "loading" && " ... "}
      {state === "speaking" && (
        <span className="inline-flex items-center gap-2">
          {/* The pixel font has no ■. */}
          <span aria-hidden="true" className="size-2 bg-current" />
          {t("details.stopReading")}
        </span>
      )}
    </button>
  );
};
