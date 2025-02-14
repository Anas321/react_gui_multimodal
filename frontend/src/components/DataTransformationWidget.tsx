import React from 'react';
import { Switch, RangeSlider, Select } from '@mantine/core';

interface DataTransformationWidgetProps {
  isLogScale: boolean;
  setIsLogScale: (value: boolean) => void;
  lowerPercentile: number;
  setLowerPercentile: (value: number) => void;
  upperPercentile: number;
  setUpperPercentile: (value: number) => void;
  normalization: string;
  setNormalization: (value: string) => void;
  imageColormap: string;
  setImageColormap: (value: string) => void;
  differenceColormap: string;
  setDifferenceColormap: (value: string) => void;
  normalizationMode: string;
  setNormalizationMode: (value: string) => void;
}

const SEQUENTIAL_COLORMAP_OPTIONS = [
    // Sequential
    { value: 'Viridis', label: 'Viridis' },
    { value: 'RdBu', label: 'Red-Blue' },
    { value: 'Jet', label: 'Jet' },
    { value: 'Greys', label: 'Greys' },
    { value: 'Blackbody', label: 'Blackbody' },
    { value: 'Portland', label: 'Portland' },
    { value: 'Plasma', label: 'Plasma' },
    { value: 'Rainbow', label: 'Rainbow' },
    { value: 'Cividis', label: 'Cividis' },
    { value: 'Electric', label: 'Electric' },
    { value: 'Earth', label: 'Earth' },
    { value: 'Hot', label: 'Hot' },
    { value: 'Picnic', label: 'Picnic' },
    { value: 'Bluered', label: 'Blue-Red' },
    { value: 'YlOrRd', label: 'Yellow-Orange-Red' },
    { value: 'YlGnBu', label: 'Yellow-Green-Blue' },
    { value: 'Blues', label: 'Blues' },
    { value: 'Greens', label: 'Greens' },
    { value: 'Reds', label: 'Reds' },

];


const DataTransformationWidget: React.FC<DataTransformationWidgetProps> = ({
  isLogScale,
  setIsLogScale,
  lowerPercentile,
  setLowerPercentile,
  upperPercentile,
  setUpperPercentile,
  normalization,
  setNormalization,
  imageColormap,
  setImageColormap,
  differenceColormap,
  setDifferenceColormap,
  normalizationMode,
  setNormalizationMode,
}) => {
  return (
    <div className="p-4">

      {/* Normalization Mode Dropdown */}
      <div className="mt-8 mb-8">
        <span className="text-3xl mb-4 block">Transformation Mode</span>
        <Select
            value={normalizationMode}
            onChange={(value) => setNormalizationMode(value || 'together')}
            data={[
                { value: 'together', label: 'Transform both images together' },
                { value: 'individual', label: 'Transform each image individually' },
            ]}
            className="text-2xl"
            size="xl"
            styles={{
                input: {
                    fontSize: '1.75rem',
                    height: '3rem'
                },
                dropdown: {
                    fontSize: '1.75rem',
                },
                option: {
                    fontSize: '1.75rem'
                },
                label: {
                    fontSize: '1.75rem'
                }
            }}
        />
      </div>


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

        {/* Normalization Dropdown */}
        <div className="mt-8 mb-8">
            <span className="text-3xl mb-4 block">Normalization</span>
            <Select
                value={normalization}
                onChange={(value) => setNormalization(value || 'none')}
                data={[
                    { value: 'none', label: 'None' },
                    { value: 'minmax', label: 'Min-Max' },
                    { value: 'mean', label: 'Mean' },
                ]}
                className="text-2xl"
                size="xl"
                styles={{
                    // Style for the main input/button that shows the selected value
                    input: {
                        fontSize: '1.75rem',  // Text size of the selected value (rem: Root Element)
                        height: '3rem'        // Height of the input box
                    },
                    // Style for the dropdown container that appears when clicked
                    dropdown: {
                        fontSize: '1.75rem',   // Text size for the entire dropdown menu
                    },
                    // Style for individual options in the dropdown list
                    option: {
                        fontSize: '1.75rem'   // Text size for each selectable option
                    },
                    // Style for any labels associated with the select component
                    label: {
                        fontSize: '1.75rem'   // Text size for labels (if used)
                    }
                }}
            />
        </div>


        {/* Colormap Selection Dropdowns */}
        <div className="mt-8 mb-8">
          <span className="text-3xl mb-4 block">Image Colormap</span>
          <Select
            value={imageColormap}
            onChange={(value) => setImageColormap(value || 'Viridis')}
            data={SEQUENTIAL_COLORMAP_OPTIONS}
            className="text-2xl"
            size="xl"
            maxDropdownHeight={400}
            styles={{
              input: {
                fontSize: '1.75rem',
                height: '3rem'
              },
              dropdown: {
                fontSize: '1.75rem',
              },
              option: {
                fontSize: '1.75rem'
              },
              label: {
                fontSize: '1.75rem'
              }
            }}
          />
        </div>

        <div className="mt-8 mb-8">
          <span className="text-3xl mb-4 block">Difference Colormap</span>
          <Select
            value={differenceColormap}
            onChange={(value) => setDifferenceColormap(value || 'RdBu')}
            data={SEQUENTIAL_COLORMAP_OPTIONS}
            className="text-2xl"
            size="xl"
            maxDropdownHeight={400}
            styles={{
              input: {
                fontSize: '1.75rem',
                height: '3rem'
              },
              dropdown: {
                fontSize: '1.75rem'
              },
              option: {
                fontSize: '1.75rem'
              },
              label: {
                fontSize: '1.75rem'
              }
            }}
          />
        </div>




      </div>
    </div>
  );
};

export default DataTransformationWidget;
