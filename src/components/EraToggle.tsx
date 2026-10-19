import { useEraToggle } from "@/features/shared/useEraToggle";

/**
 * One button rather than a pair like the language switch: retro is a mode you
 * turn on, and the navbar has no room for two labels in a pixel font. Pressed
 * state carries which way it is, so the label never has to change.
 */
const EraToggle = () => {
  const { isRetro, toggle, description, label } = useEraToggle();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isRetro}
      aria-label={description}
      title={description}
      // The dashed frame is what separates it from EN | PL beside it: those
      // pick a language, this one changes what the whole dex is. Without it the
      // three read as one group of three choices.
      className={`border border-dashed px-2 py-1 text-xs cursor-pointer focus-ring ${
        isRetro
          ? "border-black/50 bg-dex-yellow text-black"
          : "border-white/60 text-white hover:bg-dex-red-dark"
      }`}
    >
      {label}
    </button>
  );
};

export default EraToggle;
