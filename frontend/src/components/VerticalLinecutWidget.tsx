import React, { useState } from "react";
import { SketchPicker, ColorResult } from "react-color";
import { MdClose } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Linecut } from "../types";
import InputSlider from "./InputSlider";
import { Accordion } from "@mantine/core";

interface VerticalLinecutSectionProps {
  linecutType: string | null;
  imageWidth: number;
  linecuts: Linecut[];
  updateVerticalLinecutPosition: (id: number, position: number) => void;
  updateVerticalLinecutWidth: (id: number, width: number) => void;
  updateVerticalLinecutColor: (id: number, side: "left" | "right", color: string) => void;
  deleteVerticalLinecut: (id: number) => void;
  toggleVerticalLinecutVisibility: (id: number) => void;
}

const VerticalLinecutSection: React.FC<VerticalLinecutSectionProps> = ({
  linecutType,
  imageWidth,
  linecuts,
  updateVerticalLinecutPosition,
  updateVerticalLinecutWidth,
  updateVerticalLinecutColor,
  deleteVerticalLinecut,
  toggleVerticalLinecutVisibility,
}) => {
  const [colorPicker, setColorPicker] = useState<{
    id: number;
    side: "left" | "right";
    visible: boolean;
    originalColor: string;
    currentColor: string;
  } | null>(null);

  // Color picker handlers (similar to HorizontalLinecutSection)
  const handleColorChange = (id: number, side: "left" | "right", color: string) => {
    if (colorPicker) {
      setColorPicker({
        ...colorPicker,
        currentColor: color,
      });
    }
    updateVerticalLinecutColor(id, side, color);
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
      updateVerticalLinecutColor(
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
                    onClick={() => deleteVerticalLinecut(linecut.id)}
                    aria-label={`Delete Linecut ${linecut.id}`}
                  >
                    <MdClose size={16} />
                  </button>
                  <span className="absolute bottom-full mb-0 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    Delete
                  </span>
                </div>

                {/* Visibility Toggle */}
                <div className="absolute top-0 right-0 group">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => toggleVerticalLinecutVisibility(linecut.id)}
                    aria-label={`Toggle Visibility of Linecut ${linecut.id}`}
                  >
                    {linecut.hidden ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                  <span className="absolute top-0 right-full mr-2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    {linecut.hidden ? "Show" : "Hide"}
                  </span>
                </div>

                {/* Title and Color Pickers */}
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

                {/* Width Control */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold mb-2">Width (pixels)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={1}
                        max={100}
                        value={linecut.width || 1}
                        step={0.1}
                        onChange={(value) => updateVerticalLinecutWidth(linecut.id, value)}
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
                        updateVerticalLinecutWidth(linecut.id, parseFloat(e.target.value) || 1)
                      }
                      className="border rounded w-20 text-center"
                      disabled={linecut.hidden}
                    />
                  </div>
                </div>

                {/* Position Control */}
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">Position (pixels)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={0}
                        max={imageWidth - 1}
                        value={linecut.position}
                        step={1}
                        onChange={(value) => updateVerticalLinecutPosition(linecut.id, value)}
                        marks={[0, imageWidth - 1]}
                        styles="w-full"
                        disabled={linecut.hidden}
                      />
                    </div>
                    <input
                      type="number"
                      value={linecut.position}
                      min={0}
                      max={imageWidth - 1}
                      step={1}
                      onChange={(e) =>
                        updateVerticalLinecutPosition(linecut.id, parseInt(e.target.value) || 0)
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

export default VerticalLinecutSection;
