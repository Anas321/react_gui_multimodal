import React from 'react';
import { NumberInput, Text, Badge } from '@mantine/core';
import { notifications } from '@mantine/notifications';

interface ScatterSpectrumAccordionProps {
  leftImageIndex: number | "";
  rightImageIndex: number | "";
  setLeftImageIndex: (value: number | "") => void;
  setRightImageIndex: (value: number | "") => void;
  numOfFiles: number | null;
}

const ScatterSpectrumAccordion: React.FC<ScatterSpectrumAccordionProps> = ({
  leftImageIndex,
  rightImageIndex,
  setLeftImageIndex,
  setRightImageIndex,
  numOfFiles,
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
        <div className="p-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <Text className="text-xl">Image Selection</Text>
              {numOfFiles !== null && (
                <Badge
                  color="blue"
                  size="lg"
                  radius="sm"
                  classNames={{
                    root: 'px-3 py-1',
                    label: 'text-lg'
                  }}
                >
                  Total: {numOfFiles} files
                </Badge>
              )}
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
            </div>
          </div>
        </div>
      );
    };

export default ScatterSpectrumAccordion;
