import React, { useState } from "react";

type InputSliderProps = {
  /** Slider label */
  label?: string;
  /** Lowest possible value */
  min: number;
  /** Greatest possible value */
  max: number;
  /** Current value of slider */
  value: number;
  /** Unit type */
  units?: string;
  /** Shorthand Units that appear on ticks */
  shorthandUnits?: string;
  /** An array representing where vertical tick marks should be */
  marks?: number[];
  /** The spacing between snap points for the slider thumb, defaults to 1 */
  step?: number;
  /** Should the input bar be filled up with blue color up to the thumb? */
  showFill?: boolean;
  /** How big should the text and tick marks be? */
  size?: "small" | "medium" | "large";
  /** A function that is called with the newest value */
  onChange?: (value: number) => void;
  /** Tailwind ClassNames applied to parent container */
  styles?: string;
  /** Whether the slider is disabled */
  disabled?: boolean;
};

export default function InputSlider({
  label,
  min,
  max,
  value,
  units,
  shorthandUnits,
  marks,
  step = 1,
  showFill = false,
  size = "medium",
  onChange,
  styles = "",
  disabled = false,
  ...props
}: InputSliderProps) {
  const [currentValue, setCurrentValue] = useState(value);

  const thumbWidth = 16; // pixels

  const handleInputChange = (newValue: number) => {
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    setCurrentValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handleDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    handleInputChange(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    handleInputChange(newValue);
  };

  const generateLeftOffsetString = (mark: number) => {
    return `calc(${((mark - min) / (max - min)) * 100}% + ${
      -((mark - min) / (max - min)) * thumbWidth + thumbWidth / 2
    }px)`;
  };

  const isIndexFirstOrLast = (array: number[], index: number): boolean => {
    return array.length - 1 === index || index === 0;
  };

  return (
    <div className={`flex items-center w-full pt-6 pb-6 ${styles}`} {...props}>
      {label && <label className="font-medium text-gray-700 w-1/5">{label}</label>}
      <div className="flex-grow flex items-center relative w-3/5">
        {/* Slider */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          step={step}
          onChange={handleDrag}
          disabled={disabled} // Disable slider
          className={`${showFill ? "appearance-auto" : "appearance-none"} w-full absolute z-10 hover:cursor-pointer bg-slate-400/50 h-2 rounded-lg focus:outline-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />
        {/* Thumb Input Number */}
        <div
          className="absolute z-0 -top-8 w-12 h-24"
          style={{
            left: `calc(${((value - min) / (max - min)) * 100}% + ${
              -((value - min) / (max - min)) * thumbWidth + thumbWidth / 2
            }px)`,
          }}
        >
          <div className="relative ">
            <div className="absolute w-[0] h-4 top-1 bg-gray-400"></div>
            <div className="absolute -translate-x-1/2 left-2 -y-translate-full -top-0">
              <input
                type="number"
                value={value}
                disabled={disabled} // Disable input
                className={`w-16 text-center text-xs appearance-none bg-transparent ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        {/* TickMarks (optional) */}
        {marks && (
          <div className="absolute z-0 w-full">
            {marks.map((mark, index) => (
              <div
                key={index.toString()}
                className="absolute -top-2 w-[1px] h-4 bg-gray-400"
                style={{ left: generateLeftOffsetString(mark) }}
              >
                {isIndexFirstOrLast(marks, index) && (
                  <p className="absolute text-center text-xs top-2 -translate-x-1/2 translate-y-full whitespace-nowrap">
                    {mark} {shorthandUnits}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
