import React from "react";
import { Slider } from "@mantine/core";
import { MdClose } from "react-icons/md"; // Icon for deletion
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Icons for visibility toggle
import { Linecut } from "../types";
import InputSlider from "./InputSlider";

interface LinecutSectionProps {
  linecutType: string | null;
  imageHeight: number; // Height of the image
  linecuts: Linecut[]; // List of linecuts
  updateLinecutPosition: (id: number, position: number) => void; // Function to update linecut position
  updateLinecutWidth: (id: number, width: number) => void; // Function to update linecut width
  deleteHorizontalLinecut: (id: number) => void; // Function to delete a linecut
  toggleHorizontalLinecutVisibility: (id: number) => void; // Function to toggle visibility of a linecut
  leftImageColorPalette: string[]; // Color palette for the left image
  rightImageColorPalette: string[]; // Color palette for the right image
}

const LinecutSection: React.FC<LinecutSectionProps> = ({
  linecutType,
  imageHeight,
  linecuts,
  updateLinecutPosition,
  updateLinecutWidth,
  deleteHorizontalLinecut,
  toggleHorizontalLinecutVisibility,
  leftImageColorPalette,
  rightImageColorPalette,
}) => {
  if (!linecutType) return null;

  return (
    <div className="mt-4 pl-1 bg-gray-100 rounded shadow">
      <h2 className="text-2xl mb-4 font-bold">{linecutType} Linecuts</h2>

      {/* Scrollable Linecuts Section */}
      <div className="max-h-96 overflow-y-auto overflow-x-hidden pl-4 pt-6">
        {linecuts.map((linecut) => (
          <div
            key={linecut.id}
            className="mb-8 pt-10 pb-5 pl-2 pr-3 relative shadow-lg h-[290px]"
          >
            {/* Delete Button */}
            <div className="absolute top-0 left-0 group">
              <button
                className="w-6 h-6 flex items-center justify-center bg-gray-200 text-black-600 hover:bg-red-500 hover:text-white shadow-md rounded"
                onClick={() => deleteHorizontalLinecut(linecut.id)}
                aria-label={`Delete Linecut ${linecut.id}`}
              >
                <MdClose size={16} />
              </button>
              {/* Tooltip */}
              <span className="absolute bottom-full mb-0 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                Delete
              </span>
            </div>

            {/* Visibility Toggle with Tooltip */}
            <div className="absolute top-0 right-0 group">
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => toggleHorizontalLinecutVisibility(linecut.id)}
                aria-label={`Toggle Visibility of Linecut ${linecut.id}`}
              >
                {linecut.hidden ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
              {/* Tooltip */}
              <span className="absolute top-0 right-full mr-2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                {linecut.hidden ? "Show" : "Hide"}
              </span>
            </div>

            {/* Linecut Title with Two Colored Lines */}
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-medium">Linecut {linecut.id}</h3>
              <div className="flex items-center ml-4">
                <div
                  className="h-1 w-12 mr-2"
                  style={{
                    backgroundColor:
                      leftImageColorPalette[
                        (linecut.id - 1) % leftImageColorPalette.length
                      ],
                  }}
                ></div>
                <div
                  className="h-1 w-12"
                  style={{
                    backgroundColor:
                      rightImageColorPalette[
                        (linecut.id - 1) % rightImageColorPalette.length
                      ],
                  }}
                ></div>
              </div>
            </div>

            {/* Slider to Adjust Linecut Width */}
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-2">Width (pixels)</h4>
              <InputSlider
                min={1}
                max={20}
                value={linecut.width || 1} // Default to 1 if width is undefined
                step={0.1}
                onChange={(value) => updateLinecutWidth(linecut.id, value)}
                marks={[1, 20]}
                styles="w-full"
              />
            </div>
            {/* <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Width (in pixels)</h4>
              <Slider
                label={(value) => `${value}`}
                min={1}
                max={20}
                step={0.1}
                value={linecut.width || 1} // Default to 1 if width is undefined
                onChange={(value) => updateLinecutWidth(linecut.id, value)}
                marks={[
                  { value: 1, label: "1" },
                  { value: 20, label: "20" },
                ]}
                color="blue"
                styles={{
                  markLabel: {
                    color: "black",
                  },
                }}
                disabled={linecut.hidden} // Disable if linecut is hidden
                className="mt-2"
              />
            </div> */}

            {/* Slider to Adjust Linecut Position */}
            <div className="mb-4">
              <h4 className="text-md font-semibold mb-2">Position (pixels)</h4>
              <InputSlider
                min={0}
                max={imageHeight - 1}
                value={linecut.position}
                step={1}
                onChange={(value) => updateLinecutPosition(linecut.id, value)}
                marks={[0, imageHeight - 1]}
                styles="w-full"
              />
            </div>
            {/* <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Position (in pixels)</h4>
              <Slider
                label={(value) => `${value.toFixed(1)}`} // Show one decimal place
                min={0}
                max={imageHeight - 1}
                step={1}
                value={linecut.position}
                onChange={(value) => updateLinecutPosition(linecut.id, value)}
                marks={[
                  { value: 0, label: "0" },
                  { value: imageHeight - 1, label: `${imageHeight - 1}` },
                ]}
                color="blue"
                styles={{
                  markLabel: {
                    color: "black",
                  },
                }}
                disabled={linecut.hidden} // Disable if linecut is hidden
                className="mt-2"
              />
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LinecutSection;
