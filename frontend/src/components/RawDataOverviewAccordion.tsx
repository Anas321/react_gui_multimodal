import React from 'react';
import { NumberInput, Text, Select, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';

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
  isLoading?: boolean;
  isFetchingData?: boolean; // Add specific state for fetching data
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
  isLoading = false,
  isFetchingData = false, // Default to false if not provided
}) => {
  // Type-safe handlers for NumberInput
  const handleLeftIndexChange = (value: string | number) => {
    setLeftImageIndex(value === '' ? '' : Number(value));
  };

  const handleRightIndexChange = (value: string | number) => {
    setRightImageIndex(value === '' ? '' : Number(value));
  };

  // Validate that indices are within range
  if (numOfFiles !== null) {
    // Check that indices are numbers and within range
    if (
      typeof leftImageIndex === 'number' && leftImageIndex >= numOfFiles ||
      typeof rightImageIndex === 'number' && rightImageIndex >= numOfFiles
    ) {
      notifications.show({
        title: 'Invalid Input',
        message: `Image indices must be less than ${numOfFiles}`,
        color: 'red',
      });
      return;
    }
  }

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
          Select the indices of the left and right images to compare.
        </Text>

        <div className="flex flex-col space-y-4">
          <NumberInput
            value={leftImageIndex}
            onChange={(value) => handleLeftIndexChange(value)}
            label="Left Image Index"
            placeholder="0"
            min={0}
            max={numOfFiles !== null ? numOfFiles - 1 : undefined}
            className="w-full"
            styles={{
              input: { fontSize: '1.25rem', height: '2.5rem' },
              label: { fontSize: '1.25rem', marginBottom: '0.5rem' }
            }}
          />

          <NumberInput
            value={rightImageIndex}
            onChange={(value) => handleRightIndexChange(value)}
            label="Right Image Index"
            placeholder="1"
            min={0}
            max={numOfFiles !== null ? numOfFiles - 1 : undefined}
            className="w-full"
            styles={{
              input: { fontSize: '1.25rem', height: '2.5rem' },
              label: { fontSize: '1.25rem', marginBottom: '0.5rem' }
            }}
          />

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


          {/* Centered and Larger Fetch Data Button - Using isFetchingData instead of isLoading */}
          <div className="flex justify-center">
            <Button
              onClick={fetchSpectrumData}
              loading={isFetchingData} // Only show loading for data fetching, not image selection
              color="blue"
              size="xl"
              className="w-3/4 py-3 text-lg font-semibold"
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
