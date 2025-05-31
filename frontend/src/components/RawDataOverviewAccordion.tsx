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
            <Text className="text-base">
            Number of images: {numOfFiles}
            </Text>
        </div>
        )}
        <div className="flex justify-between items-center mb-1">
          <Text className="text-base font-sm">Image Selection</Text>
        </div>

        <Text className="text-xs text-gray-600 mb-3">
          Select the images to compare from the dropdown menus or click on the data point directly in the figure.
        </Text>

        <div className="flex flex-col space-y-2">
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
                input: { fontSize: '0.875rem', height: '2rem' },
                label: { fontSize: '0.875rem', marginBottom: '0.25rem' },
                dropdown: { fontSize: '0.875rem' },
                option: { fontSize: '0.875rem' }
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
                input: { fontSize: '0.875rem', height: '2rem' },
                label: { fontSize: '0.875rem', marginBottom: '0.25rem' },
                dropdown: { fontSize: '0.875rem' },
                option: { fontSize: '0.875rem' }
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
              input: { fontSize: '0.875rem', height: '2rem' },
              label: { fontSize: '0.875rem', marginBottom: '0.25rem' },
              dropdown: { fontSize: '0.875rem' },
              option: { fontSize: '0.875rem' }
            }}
          />

          {/* Centered and Larger Fetch Data Button */}
          <div className="flex justify-center">
            <Button
              onClick={fetchSpectrumData}
              loading={isFetchingData}
              color="blue"
              size="sm"
              className="w-full py-1 text-sm font-medium rounded-md"
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
