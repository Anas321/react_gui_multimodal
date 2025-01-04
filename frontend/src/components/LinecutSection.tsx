// LinecutSection.tsx
import React from 'react';
import { Slider, MultiSelect } from '@mantine/core';

interface LinecutSectionProps {
  linecutType: string | null;
  position: number; // Position of the linecut
  setPosition: React.Dispatch<React.SetStateAction<number>>; // To update position
  imageHeight: number; // Height of the image
  linecuts: { id: number; position: number; color: string }[]; // List of linecuts
  selectedLinecuts: string[]; // Selected linecuts in MultiSelect
  setSelectedLinecuts: React.Dispatch<React.SetStateAction<string[]>>; // To update selected linecuts
  updateLinecutPosition: (id: number, position: number) => void; // Function to update linecut position
}

const LinecutSection: React.FC<LinecutSectionProps> = ({
  linecutType,
  position,
  setPosition,
  imageHeight,
  linecuts,
  selectedLinecuts,
  setSelectedLinecuts,
  updateLinecutPosition,
 }) => {
  if (!linecutType) return null;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded shadow">
      <h2 className="text-2xl font-bold">{linecutType} Linecut</h2>
      {(linecutType === 'Horizontal' || linecutType === 'Vertical') && (
        <>
        <Slider
          label={`Adjust ${linecutType} position`}
          min={0}
          max={imageHeight - 1}
          step={1}
          value={position}
          onChange={(value) => {

            console.log("Slider value:", value); // Check the slider value

            setPosition(value); // Update local position

            const activeLinecut = linecuts.find((linecut) =>
              selectedLinecuts.includes(String(linecut.id))
            );

            console.log("Active Linecut:", activeLinecut); // Check the selected linecut
            console.log("Selected Linecuts:", selectedLinecuts);
            console.log("Linecuts:", linecuts);


            if (activeLinecut) {
              updateLinecutPosition(activeLinecut.id, value); // Update position in the parent state
            }
          }}
          marks={[
            { value: 0, label: '0' },
            { value: imageHeight, label: `${imageHeight}` },
          ]}
          className="mt-6 mb-6"
        />
        <MultiSelect
          data={linecuts.map((linecut) => ({
            value: String(linecut.id),
            label: `Linecut ${linecut.id}`,
          }))}
          value={selectedLinecuts}
          onChange={setSelectedLinecuts}
          placeholder="Select linecuts"
          mt="2rem"
        />
      </>
      )}
    </div>
  );
};

export default LinecutSection;
