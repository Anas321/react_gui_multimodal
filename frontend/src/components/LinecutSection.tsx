// LinecutSection.tsx
import React, { useEffect } from 'react';
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

  // Find the currently active linecut
  const activeLinecut = linecuts.find((linecut) =>
    selectedLinecuts.includes(String(linecut.id))
  );

  // Update slider position whenever the active linecut changes
  useEffect(() => {
    if (activeLinecut) {
      setPosition(activeLinecut.position);
    }
  }, [activeLinecut, setPosition]);

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded shadow">
      <h2 className="text-2xl font-bold">{linecutType} Linecut</h2>
      {(linecutType === 'Horizontal' || linecutType === 'Vertical') && (
        <>
          {/* Slider to adjust linecut position */}
          <Slider
            label={`Adjust ${linecutType} position`}
            min={0}
            max={imageHeight - 1}
            step={1}
            value={position}
            onChange={(value) => {
              setPosition(value); // Update local position
              if (activeLinecut) {
                updateLinecutPosition(activeLinecut.id, value); // Update position in the parent state
              }
            }}
            marks={[
              { value: 0, label: '0' },
              { value: imageHeight - 1, label: `${imageHeight - 1}` },
            ]}
            className="mt-6 mb-6"
          />

          {/* MultiSelect for choosing linecuts */}
          {/* <MultiSelect
            data={linecuts.map((linecut) => ({
              value: String(linecut.id),
              label: `Linecut ${linecut.id}`,
            }))}
            value={selectedLinecuts}
            onChange={(values) => {
              // Identify the removed linecuts
              const removedLinecuts = horizontalLinecuts.filter(
                (linecut) => !values.includes(String(linecut.id))
              );

              // Remove the deselected linecuts from the states
              removedLinecuts.forEach((linecut) => {
                setHorizontalLinecuts((prev) =>
                  prev.filter((lc) => lc.id !== linecut.id)
                );
                setLinecutData1((prev) =>
                  prev.filter((data) => data.id !== linecut.id)
                );
                setLinecutData2((prev) =>
                  prev.filter((data) => data.id !== linecut.id)
                );
              });

              // Update selected linecuts
              setSelectedLinecuts(values);
            }}
            placeholder="Select linecuts"
            mt="2rem"
          /> */}

          <MultiSelect
            data={Array.from(
              new Map(
                linecuts.map((linecut) => [
                  linecut.id,
                  { value: String(linecut.id), label: `Linecut ${linecut.id}` },
                ])
              ).values()
            )}
            value={selectedLinecuts}
            onChange={(values) => {
              setSelectedLinecuts(values);
              const selectedId = values.length ? Number(values[values.length - 1]) : null;
              const selectedLinecut = linecuts.find((linecut) => linecut.id === selectedId);
              if (selectedLinecut) {
                setPosition(selectedLinecut.position); // Sync slider position with the newly selected linecut
              }
            }}
            placeholder="Select linecuts"
            mt="2rem"
          />
        </>
      )}
    </div>
  );
};

export default LinecutSection;
