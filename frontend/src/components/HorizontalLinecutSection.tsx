import React, { useState } from "react";
import { SketchPicker, ColorResult } from "react-color";
import { MdClose } from "react-icons/md"; // Icon for deletion
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Icons for visibility toggle
import { Linecut } from "../types";
import InputSlider from "./InputSlider";
import { Accordion } from "@mantine/core";

interface HorizontalLinecutSectionProps {
  linecutType: string | null;
  imageHeight: number;
  linecuts: Linecut[];
  updateHorizontalLinecutPosition: (id: number, position: number) => void;
  updateHorizontalLinecutWidth: (id: number, width: number) => void;
  updateHorizontalLinecutColor: (id: number, side: "left" | "right", color: string) => void;
  deleteHorizontalLinecut: (id: number) => void;
  toggleHorizontalLinecutVisibility: (id: number) => void;
}

const HorizontalLinecutSection: React.FC<HorizontalLinecutSectionProps> = ({
  linecutType,
  imageHeight,
  linecuts,
  updateHorizontalLinecutPosition,
  updateHorizontalLinecutWidth,
  updateHorizontalLinecutColor,
  deleteHorizontalLinecut,
  toggleHorizontalLinecutVisibility,
}) => {
  const [colorPicker, setColorPicker] = useState<{
    id: number;
    side: "left" | "right";
    visible: boolean;
    originalColor: string; // Store the original color when opening the picker
    currentColor: string; // Track the current color during picking
  } | null>(null);

  const handleColorChange = (id: number, side: "left" | "right", color: string) => {
    // Update the current color in the picker state
    if (colorPicker) {
      setColorPicker({
        ...colorPicker,
        currentColor: color,
      });
    }
    // Update the color preview
    updateHorizontalLinecutColor(id, side, color);
  };

  const handleOpenColorPicker = (linecut: Linecut, side: "left" | "right") => {
    const originalColor = side === "left" ? linecut.leftColor : linecut.rightColor;
    setColorPicker({
      id: linecut.id,
      side,
      visible: true,
      originalColor,
      currentColor: originalColor,
    });
  };

  const handleCancelColor = () => {
    if (colorPicker) {
      // Revert to the original color
      updateHorizontalLinecutColor(
        colorPicker.id,
        colorPicker.side,
        colorPicker.originalColor
      );
      setColorPicker(null);
    }
  };

  return (
    <Accordion
      multiple={false}
      defaultValue={linecutType ? `${linecutType}-linecuts` : undefined}
      chevronPosition="right"
      classNames={{
        chevron: "text-xl font-bold",
        label: "text-2xl font-bold",
      }}
    >
      <Accordion.Item value={`${linecutType}-linecuts`}>
        <Accordion.Control>{linecutType} Linecuts</Accordion.Control>
        <Accordion.Panel>
          <div className="max-h-96 overflow-y-auto overflow-x-hidden pl-4 pt-6">
            {linecuts.map((linecut) => (
              <div
                key={linecut.id}
                className="mb-5 pt-10 pb-5 pl-2 pr-3 relative shadow-lg border-2 h-[290px]"
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

                {/* Linecut Title with Color Pickers */}
                <div className="flex items-center mb-4">
                  <h3 className="text-xl font-medium">Linecut {linecut.id}</h3>
                  <div className="flex items-center ml-4">
                    <div
                      className="h-3 w-12 mr-2 cursor-pointer"
                      style={{ backgroundColor: linecut.leftColor }}
                      onClick={() => handleOpenColorPicker(linecut, "left")}
                      title="Click to change color"
                    ></div>
                    <div
                      className="h-3 w-12 cursor-pointer"
                      style={{ backgroundColor: linecut.rightColor }}
                      onClick={() => handleOpenColorPicker(linecut, "right")}
                      title="Click to change color"
                    ></div>
                  </div>
                </div>

                {/* Color Picker Popup */}
                {colorPicker?.visible && colorPicker.id === linecut.id && (
                  <div className="absolute z-50 bg-white p-4 shadow-lg rounded">
                    <SketchPicker
                      color={colorPicker.currentColor}
                      onChange={(color: ColorResult) =>
                        handleColorChange(linecut.id, colorPicker.side, color.hex)
                      }
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded"
                        onClick={() => setColorPicker(null)}
                      >
                        Accept
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-400 text-white rounded"
                        onClick={handleCancelColor}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Slider and Input Box for Linecut Width */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold mb-2">Width (pixels)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={1}
                        max={100}
                        value={linecut.width || 1}
                        step={0.1}
                        onChange={(value) => updateHorizontalLinecutWidth(linecut.id, value)}
                        marks={[1, 100]}
                        styles="w-full"
                        disabled={linecut.hidden}
                      />
                    </div>
                    <input
                      type="number"
                      value={linecut.width || 1}
                      min={1}
                      max={100}
                      step={0.1}
                      onChange={(e) =>
                        updateHorizontalLinecutWidth(linecut.id, parseFloat(e.target.value) || 1)
                      }
                      className="border rounded w-20 text-center"
                      disabled={linecut.hidden}
                    />
                  </div>
                </div>

                {/* Slider and Input Box for Linecut Position */}
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Position (pixels)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={0}
                        max={imageHeight - 1}
                        value={linecut.position}
                        step={1}
                        onChange={(value) => updateHorizontalLinecutPosition(linecut.id, value)}
                        marks={[0, imageHeight - 1]}
                        styles="w-full"
                        disabled={linecut.hidden}
                      />
                    </div>
                    <input
                      type="number"
                      value={linecut.position}
                      min={0}
                      max={imageHeight - 1}
                      step={1}
                      onChange={(e) =>
                        updateHorizontalLinecutPosition(linecut.id, parseInt(e.target.value) || 0)
                      }
                      className="border rounded w-20 text-center"
                      disabled={linecut.hidden}
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default HorizontalLinecutSection;
