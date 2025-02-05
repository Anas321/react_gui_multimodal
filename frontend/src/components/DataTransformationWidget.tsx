import React from 'react';
import { Switch, RangeSlider } from '@mantine/core';

interface DataTransformationWidgetProps {
  isLogScale: boolean;
  setIsLogScale: (value: boolean) => void;
  lowerPercentile: number;
  setLowerPercentile: (value: number) => void;
  upperPercentile: number;
  setUpperPercentile: (value: number) => void;
}

const DataTransformationWidget: React.FC<DataTransformationWidgetProps> = ({
  isLogScale,
  setIsLogScale,
  lowerPercentile,
  setLowerPercentile,
  upperPercentile,
  setUpperPercentile,
}) => {
  return (
    <div className="p-4">
      {/* Log Scale Toggle */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-3xl mb-4">Log Scale</span>
        <Switch
          checked={isLogScale}
          onChange={(event) => setIsLogScale(event.currentTarget.checked)}
          size="xl"
          className="w-20 h-12"
        />
      </div>

      {/* Percentile Range Controls */}
      <div className='mb-6'>
        <span className="text-3xl mb-6 block">Min-Max Percentile</span>

        {/* Range Slider */}
        <RangeSlider
          min={0}
          max={100}
          value={[lowerPercentile, upperPercentile]}
          onChange={([lower, upper]) => {
            setLowerPercentile(lower);
            setUpperPercentile(upper);
          }}
          className="w-full mb-16"
          minRange={0.1}
          step={0.01}
          size="lg"
          label={(value) => `${value}%`}
          marks={[
            { value: 0, label: '0' },
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 75, label: '75' },
            { value: 100, label: '100' }
          ]}
          classNames={{
            markLabel: 'text-2xl font-medium text-black',
            mark: 'w-0.5 h-4 bg-black rounded',
            markWrapper: 'mt-1',
            label: 'bg-black-500 text-white px-2 py-1 rounded text-xl',
            thumb: 'border-2 border-blue-500',
          }}
        />

        {/* Input boxes for percentile values */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl">Min % :</span>
          <input
            type="number"
            value={lowerPercentile}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value >= 0 && value < upperPercentile) {
                setLowerPercentile(value);
              }
            }}
            className="w-28 p-2 border border-gray-300 rounded text-center text-2xl"
            step="0.01"
            min="0"
            max={upperPercentile}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-3xl">Max % :</span>
          <input
            type="number"
            value={upperPercentile}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value <= 100 && value >= lowerPercentile) {
                setUpperPercentile(value);
              }
            }}
            className="w-28 p-2 border border-gray-300 rounded text-center text-2xl"
            step="0.01"
            min={lowerPercentile}
            max="100"
          />
        </div>
      </div>
    </div>
  );
};

export default DataTransformationWidget;
