import React from 'react';
import { Text, Select, Button } from '@mantine/core';

// Define display options type
export type DisplayOption = 'both' | 'max' | 'avg';

interface RawDataOverviewAccordionProps {
  leftImageIndex: number | "";
  rightImageIndex: number | "";
  setLeftImageIndex: (value: number | "") => void;
  setRightImageIndex: (value: number | "") => void;
  numOfFiles: number | null;
  displayOption?: DisplayOption;
  setDisplayOption?: (option: DisplayOption) => void;
  fetchSpectrumData?: () => Promise<void>;
  isFetchingData?: boolean;
  imageNames?: string[];
}

const RawDataOverviewAccordion: React.FC<RawDataOverviewAccordionProps> = ({
  leftImageIndex,
  rightImageIndex,
  setLeftImageIndex,
  setRightImageIndex,
  numOfFiles,
  displayOption = 'both',
  setDisplayOption = () => {},
  fetchSpectrumData = async () => {},
  isFetchingData = false,
  imageNames = [],
}) => {
  // Create select options from image names array
  const imageOptions = imageNames.map((name, index) => ({
    value: index.toString(),
    label: `${index}: ${name}`
  }));

  // Handlers for Select components
  const handleLeftImageChange = (value: string | null) => {
    if (value === null) {
      setLeftImageIndex('');
    } else {
      setLeftImageIndex(Number(value));
    }
  };

  const handleRightImageChange = (value: string | null) => {
    if (value === null) {
      setRightImageIndex('');
    } else {
      setRightImageIndex(Number(value));
    }
  };

  // Get current values for the select components
  const leftSelectValue = typeof leftImageIndex === 'number' ? leftImageIndex.toString() : '';
  const rightSelectValue = typeof rightImageIndex === 'number' ? rightImageIndex.toString() : '';

  return (
    <div className="p-2">
      <div>
        {/* Total files text */}
        {numOfFiles !== null && (
        <div className="flex justify-start">
            <Text className="text-xl">
            Number of images: {numOfFiles}
            </Text>
        </div>
        )}
        <div className="flex justify-between items-center mt-4 mb-3">
          <Text className="text-xl">Image Selection</Text>
        </div>

        <Text className="text-md text-gray-600 mb-6">
          Select the images to compare from the dropdown menus or click on the data point directly in the figure.
        </Text>

        <div className="flex flex-col space-y-4">
          <div>
            <Select
              value={leftSelectValue}
              onChange={handleLeftImageChange}
              label="Left Image"
              placeholder="Select left image"
              data={imageOptions}
              searchable
              className="w-full"
              styles={{
                input: { fontSize: '1.25rem', height: '2.5rem' },
                label: { fontSize: '1.25rem', marginBottom: '0.5rem' },
                dropdown: { fontSize: '1.125rem' },
                option: { fontSize: '1.125rem' }
              }}
            />
          </div>

          <div>
            <Select
              value={rightSelectValue}
              onChange={handleRightImageChange}
              label="Right Image"
              placeholder="Select right image"
              data={imageOptions}
              searchable
              className="w-full"
              styles={{
                input: { fontSize: '1.25rem', height: '2.5rem' },
                label: { fontSize: '1.25rem', marginBottom: '0.5rem' },
                dropdown: { fontSize: '1.125rem' },
                option: { fontSize: '1.125rem' }
              }}
            />
          </div>

          {/* Display Options Dropdown */}
          <Select
            label="Display Mode"
            placeholder="Select display mode"
            value={displayOption}
            onChange={(value) => setDisplayOption(value as DisplayOption)}
            data={[
              { value: 'both', label: 'Both Max & Avg Intensities' },
              { value: 'max', label: 'Max Intensity Only' },
              { value: 'avg', label: 'Avg Intensity Only' },
            ]}
            styles={{
              input: { fontSize: '1.25rem', height: '2.5rem' },
              label: { fontSize: '1.25rem', marginBottom: '0.5rem' },
              dropdown: { fontSize: '1.25rem' },
              option: { fontSize: '1.25rem' }
            }}
          />

          {/* Centered and Larger Fetch Data Button */}
          <div className="flex justify-center">
            <Button
              onClick={fetchSpectrumData}
              loading={isFetchingData}
              color="blue"
              size="xl"
              className="w-12/12 px-12 py-3 bg-blue-500 text-white text-[1.75rem] font-semibold rounded-lg shadow hover:bg-blue-600 transition mx-auto block"
              style={{ marginTop: '8px' }}
            >
              Fetch Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawDataOverviewAccordion;
