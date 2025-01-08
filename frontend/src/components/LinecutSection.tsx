// import React from 'react';
// import { Slider, MultiSelect } from '@mantine/core';

// interface LinecutSectionProps {
//   linecutType: string | null;
//   imageHeight: number; // Height of the image
//   linecuts: { id: number; position: number; color: string }[]; // List of linecuts
//   updateLinecutPosition: (id: number, position: number) => void; // Function to update linecut position
//   leftImageColorPalette: string[]; // Color palette for the left image
//   rightImageColorPalette: string[];
// }

// const LinecutSection: React.FC<LinecutSectionProps> = ({
//   linecutType,
//   imageHeight,
//   linecuts,
//   updateLinecutPosition,
//   leftImageColorPalette,
//   rightImageColorPalette,
// }) => {
//   if (!linecutType) return null;

//   return (
//     <div className="mt-4 p-4 bg-gray-100 rounded shadow">
//       <h2 className="text-2xl font-bold mb-4">{linecutType} Linecuts</h2>

//       {/* Render a slider for each linecut */}
//       {linecuts.map((linecut) => (
//         <div key={linecut.id} className="mb-6">
//           <h3 className="text-xl font-medium">Linecut {linecut.id}</h3>
//           <Slider
//             label={`Adjust position`}
//             min={0}
//             max={imageHeight - 1}
//             step={1}
//             value={linecut.position}
//             onChange={(value) => {
//               updateLinecutPosition(linecut.id, value); // Update position in parent state
//             }}
//             marks={[
//               { value: 0, label: '0' },
//               { value: imageHeight - 1, label: `${imageHeight - 1}` },
//             ]}
//             className="mt-2"
//             color={leftImageColorPalette[(linecut.id - 1) % leftImageColorPalette.length]} // Use the color from the palette
//             styles={{
//               thumb: {
//                 borderColor:
//                   rightImageColorPalette[(linecut.id - 1) % rightImageColorPalette.length], // Match the color of the thumb
//               },
//             }}
//           />
//         </div>
//       ))}
//     </div>
//   );
// };

// export default LinecutSection;


import React from "react";
import { Slider, Button } from "@mantine/core";
import { Linecut } from '../types';


interface LinecutSectionProps {
  linecutType: string | null;
  imageHeight: number; // Height of the image
  linecuts: Linecut[]; // List of linecuts
  updateLinecutPosition: (id: number, position: number) => void; // Function to update linecut position
  deleteHorizontalLinecut: (id: number) => void; // Function to delete a linecut
  toggleHorizontalLinecutVisibility: (id: number) => void; // Function to toggle visibility of a linecut
  leftImageColorPalette: string[]; // Color palette for the left image
  rightImageColorPalette: string[];
}

const LinecutSection: React.FC<LinecutSectionProps> = ({
  linecutType,
  imageHeight,
  linecuts,
  updateLinecutPosition,
  deleteHorizontalLinecut,
  toggleHorizontalLinecutVisibility,
  leftImageColorPalette,
  rightImageColorPalette,
}) => {
  if (!linecutType) return null;

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded shadow">
      <h2 className="text-2xl mb-4 font-bold">{linecutType} Linecuts</h2>

      {/* Render a slider and buttons for each linecut */}
      {linecuts.map((linecut) => (
        <div key={linecut.id} className="mb-6">
          {/* Title for the linecut */}
          <h3 className="text-xl font-medium">Linecut {linecut.id}</h3>

          {/* Slider to adjust the linecut position */}
          <Slider
            label={`Adjust position`}
            min={0}
            max={imageHeight - 1}
            step={1}
            value={linecut.position}
            onChange={(value) => {
              updateLinecutPosition(linecut.id, value); // Update position in parent state
            }}
            marks={[
              { value: 0, label: "0" },
              { value: imageHeight - 1, label: `${imageHeight - 1}` },
            ]}
            className="mt-2"
            color={leftImageColorPalette[(linecut.id - 1) % leftImageColorPalette.length]} // Use the color from the palette
            styles={{
              thumb: {
                borderColor:
                  rightImageColorPalette[(linecut.id - 1) % rightImageColorPalette.length], // Match the color of the thumb
              },
            }}
          />

          {/* Buttons below the slider */}
          <div className="flex justify-between mt-7">
            {/* Delete Button */}
            <Button
              color="red"
              onClick={() => deleteHorizontalLinecut(linecut.id)} // Call the delete function
            >
              Delete
            </Button>

            {/* Hide Button */}
            <Button
              color={linecut.hidden ? "gray" : "blue"}
              onClick={() => toggleHorizontalLinecutVisibility(linecut.id)} // Call the toggle visibility function
            >
              {linecut.hidden ? "Show" : "Hide"} {/* Toggle text based on visibility */}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LinecutSection;
