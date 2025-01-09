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
  showFill?: boolean
  /** How big should the text and tick marks be? */
  size?: 'small' | 'medium' | 'large'
  /** A function that is called with the newest value */
  onChange?: (value: number) => void;
  /** Tailwind ClassNames applied to parent container */
  styles?: string;
};

export default function InputSlider({
  label,
  min,
  max,
  value,
  units,
  shorthandUnits,
  marks,
  step=1,
  showFill=false,
  size='medium',
  onChange,
  styles = "",
  ...props
}: InputSliderProps) {
    const [currentValue, setCurrentValue] = useState(value);

    const tickMarkSizes = {
        small: '',
        medium: '',
        large: ''
    };

    const thumbInputSizes = {
        small: '',
        medium: '',
        large: ''
    }

    const thumbWidth = 16; //pixels

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
        var newValue = Number(e.target.value);
        handleInputChange(newValue);
    };

    if (marks) {
        for ( let i = 0; i < marks?.length; i++) {
            let val = marks[i];
            let cssStyle = `calc(${((val - min) / (max - min)) * 100}% + ${(-((val - min) / (max - min))*8) + thumbWidth/2}px)`
            console.log(cssStyle);
        }
    }

    type TickMarkProps = {
        mark: number,
        key: string,
        displayValue?: boolean
    }
    const TickMark = ({mark, key, displayValue=true}: TickMarkProps) => {
        return (
            <div
                key={key}
                className="absolute -top-2 w-[1px] h-4 bg-gray-400"
                style={{ left: generateLeftOffsetString(mark) }}
            >
                { displayValue && <p className="absolute text-center text-xs top-2 -translate-x-1/2 translate-y-full whitespace-nowrap">{mark} {shorthandUnits}</p>}
            </div>
        )
    }

    const generateLeftOffsetString = (mark: number) => {
        return `calc(${((mark - min) / (max - min)) * 100}% + ${(-((mark - min) / (max - min))*thumbWidth) + thumbWidth/2}px)`;
    };

    const isIndexFirstOrLast = (array:Number[], index: number): boolean => {
        return (array.length - 1 === index || index === 0) ? true : false;
    };

    return (
        <div className={`flex items-center w-full pt-6 pb-6 ${styles}`} {...props}>
            {label && <label className="font-medium text-gray-700 w-1/5">{label}</label>}
            <div className="flex-grow flex items-center relative w-3/5">
            {/** Slider */}
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                step={step}
                onChange={handleDrag}
                className={`${showFill ? 'appearance-auto' : 'appearance-none'} w-full absolute z-10 appearance-nonee hover:cursor-pointer bg-slate-400/50 h-2 rounded-lg focus:outline-none`}
            />
            {/** Thumb Input Number */}
            <div className="absolute z-0 -top-8 w-12 h-24" style={{left: `calc(${((value - min) / (max - min)) * 100}% + ${(-((value - min) / (max - min))*thumbWidth) + thumbWidth/2}px)`}}>
                <div className="relative ">
                    <div className="absolute w-[0] h-4 top-1 bg-gray-400"></div>
                    <div className="absolute -translate-x-1/2 left-2 -y-translate-full -top-0">
                        <input
                            type="number"
                            value={value}
                            className="w-16 text-center text-xs appearance-none bg-transparent"
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>
            {/** TickMarks (optional) */}
            {marks && (
                <div className="absolute z-0 w-full">
                {marks.map((mark, index) => (
                    <TickMark mark={mark} key={index.toString()} displayValue={isIndexFirstOrLast(marks, index)}/>
                ))}
                </div>
            )}
            {/** Min Tickmark with value label */}
            {!marks || !marks.includes(min) && <TickMark mark={min} displayValue={true} key={min.toString()}/>}
            {/** Max Tickmark with value label */}
            {!marks || !marks.includes(max) && <TickMark mark={max} displayValue={true} key={max.toString()}/>}
            </div>
            {/* <div className="w-1/5 text-gray-700 text-center">
                {value} {units}
            </div> */}
        </div>
    );
}
