import type { ReactNode } from "react";
import { Arrow } from "./Arrow";

/**
 * A number box with a stepper of its own. The browser's spinner appears only
 * under the pointer, is a few pixels tall, and at this font's line height
 * loses the top of its upper arrow under the frame. Two real buttons, framed
 * like the box, are something to press. The field stays a number input, so
 * the keyboard's arrows still step it and `onChange` sees what was typed, as
 * a string, exactly as a bare input would hand it over.
 *
 * `className` frames the whole thing — height, border, text; the input inside
 * fills what the stepper leaves.
 */
export const NumberField = ({
  id,
  value,
  min,
  max,
  step = 1,
  onChange,
  onBlur,
  className = "",
  inputClassName = "px-2",
}: {
  id?: string;
  value: string | number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (raw: string) => void;
  onBlur?: () => void;
  className?: string;
  inputClassName?: string;
}) => {
  const stepBy = (delta: number) => {
    const current = Number(value);
    let next = (value === "" || !Number.isFinite(current) ? 0 : current) + delta * step;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(String(next));
  };

  return (
    <div
      className={`flex has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-black ${className}`}
    >
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`number-plain min-w-0 flex-1 bg-transparent outline-none ${inputClassName}`}
      />
      {/* Not in the tab order and not announced, as the browser's own spinner
          is not: the input already takes the arrow keys. */}
      <span aria-hidden="true" className="flex w-6 shrink-0 flex-col border-l-2 border-black">
        <StepButton onClick={() => stepBy(1)} className="border-b-2 border-black">
          <Arrow className="rotate-180" />
        </StepButton>
        <StepButton onClick={() => stepBy(-1)}>
          <Arrow />
        </StepButton>
      </span>
    </div>
  );
};

const StepButton = ({
  onClick,
  className = "",
  children,
}: {
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) => (
  <button
    type="button"
    tabIndex={-1}
    onClick={onClick}
    // Keeps the focus, and the caret, in the field while the arrows are pressed.
    onMouseDown={(e) => e.preventDefault()}
    className={`flex flex-1 cursor-pointer select-none items-center justify-center text-[10px] leading-none hover:bg-dex-yellow active:bg-dex-red active:text-white ${className}`}
  >
    {children}
  </button>
);
