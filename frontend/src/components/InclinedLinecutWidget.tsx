import React, { useState } from 'react';
import { FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { Accordion } from '@mantine/core';
import { Linecut } from '../types';
import InputSlider from './InputSlider';
import ColorPickerPopup from './ColorPickerPopup';

interface InclinedLinecutWidgetProps {
  linecutType: string;
  imageWidth: number;
  imageHeight: number;
  linecuts: Linecut[];
  updateInclinedLinecutPosition: (id: number, x: number, y: number) => void;
  updateInclinedLinecutAngle: (id: number, angle: number) => void;
  updateInclinedLinecutWidth: (id: number, width: number) => void;
  updateInclinedLinecutColor: (id: number, side: 'left' | 'right', color: string) => void;
  deleteInclinedLinecut: (id: number) => void;
  toggleInclinedLinecutVisibility: (id: number) => void;
}

const InclinedLinecutWidget: React.FC<InclinedLinecutWidgetProps> = ({
  linecutType,
  imageWidth,
  imageHeight,
  linecuts,
  updateInclinedLinecutPosition,
  updateInclinedLinecutAngle,
  updateInclinedLinecutWidth,
  updateInclinedLinecutColor,
  deleteInclinedLinecut,
  toggleInclinedLinecutVisibility,
}) => {
  const colorPickerRef = React.useRef<HTMLDivElement>(null);
  const [colorPicker, setColorPicker] = useState<{
    id: number;
    side: 'left' | 'right';
    visible: boolean;
    originalColor: string;
    currentColor: string;
    position: { top: number; left: number };
  } | null>(null);

  const handleOpenColorPicker = (linecut: Linecut, side: 'left' | 'right', event: React.MouseEvent) => {
    if (colorPicker?.id === linecut.id && colorPicker?.side === side && colorPicker?.visible) {
      setColorPicker(null);
    } else {
      const originalColor = side === 'left' ? linecut.leftColor : linecut.rightColor;
      setColorPicker({
        id: linecut.id,
        side,
        visible: true,
        originalColor,
        currentColor: originalColor,
        position: { top: event.clientY + 10, left: event.clientX },
      });
    }
  };

  return (
    <Accordion
      multiple={false}
      defaultValue={linecutType ? `${linecutType}-linecuts` : undefined}
      chevronPosition="right"
      classNames={{
        chevron: 'text-xl font-bold',
        label: 'text-2xl font-bold',
        content: 'p-0',
      }}
      className="w-full relative"
    >
      <Accordion.Item value={`${linecutType}-linecuts`} className="w-full">
        <Accordion.Control className="pl-0">
          <span id={`${linecutType}-linecuts-title`}>{linecutType} Linecuts</span>
        </Accordion.Control>
        <Accordion.Panel>
          <div className="max-h-[600px] overflow-y-auto overflow-x-hidden w-full">
            {linecuts.map((linecut) => (
              <div
                key={linecut.id}
                className="mb-5 pt-7 pb-5 pl-2 pr-3 relative shadow-lg border-2 min-h-[400px] w-full"
                role="region"
                aria-labelledby={`linecut-${linecut.id}-title`}
              >
                {/* Linecut Title and Controls */}
                <div className="flex items-center justify-between w-full mb-4">
                  <h3 className="text-xl font-medium" id={`linecut-${linecut.id}-title`}>
                    Linecut {linecut.id}
                  </h3>
                  <div className="flex items-center ml-4">
                    {/* Color pickers */}
                    <div className="group relative">
                      <div
                        className="h-3 w-12 mr-4 cursor-pointer"
                        style={{ backgroundColor: linecut.leftColor }}
                        onClick={(e) => handleOpenColorPicker(linecut, 'left', e)}
                        role="button"
                        aria-label={`Change left color for linecut ${linecut.id}`}
                        tabIndex={0}
                      />
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                        Click to change left color
                      </span>
                    </div>
                    <div className="group relative">
                      <div
                        className="h-3 w-12 mr-2 cursor-pointer"
                        style={{ backgroundColor: linecut.rightColor }}
                        onClick={(e) => handleOpenColorPicker(linecut, 'right', e)}
                        role="button"
                        aria-label={`Change right color for linecut ${linecut.id}`}
                        tabIndex={0}
                      />
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                        Click to change right color
                      </span>
                    </div>

                    {/* Visibility toggle */}
                    <div className="group relative">
                      <button
                        className="text-blue-500 hover:text-blue-700 ml-1 flex items-center pointer-events-auto"
                        onClick={() => toggleInclinedLinecutVisibility(linecut.id)}
                        aria-label={`${linecut.hidden ? "Show" : "Hide"} linecut ${linecut.id}`}
                        aria-pressed={!linecut.hidden}
                      >
                        {linecut.hidden ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                      </button>
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                        {linecut.hidden ? "Show" : "Hide"}
                      </span>
                    </div>

                    {/* Delete button */}
                    <div className="group relative ml-4">
                      <button
                        className="w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white rounded"
                        onClick={() => deleteInclinedLinecut(linecut.id)}
                        aria-label={`Delete linecut ${linecut.id}`}
                      >
                        <FaTrash size={14} />
                      </button>
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                        Delete
                      </span>
                    </div>
                  </div>
                </div>

                {/* Width Slider */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold mb-2">
                    <label htmlFor={`width-${linecut.id}`}>Width (pixels)</label>
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={1}
                        max={100}
                        value={linecut.width}
                        step={0.1}
                        onChange={(value) => updateInclinedLinecutWidth(linecut.id, value)}
                        marks={[1, 100]}
                        styles="w-full"
                        disabled={linecut.hidden}
                        aria-labelledby={`width-${linecut.id}`}
                      />
                    </div>
                    <input
                      id={`width-${linecut.id}`}
                      type="number"
                      value={linecut.width}
                      min={1}
                      max={100}
                      step={0.1}
                      onChange={(e) => updateInclinedLinecutWidth(linecut.id, parseFloat(e.target.value) || 1)}
                      className="border rounded w-20 text-center"
                      disabled={linecut.hidden}
                    />
                  </div>
                </div>

                {/* X Position Slider */}
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">
                    <label htmlFor={`position-x-${linecut.id}`}>X Position (pixels)</label>
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={0}
                        max={imageWidth - 1}
                        value={linecut.position}
                        step={1}
                        onChange={(value) => updateInclinedLinecutPosition(linecut.id, value, linecut.positionY ?? 0)}
                        marks={[0, imageWidth - 1]}
                        styles="w-full"
                        disabled={linecut.hidden}
                        aria-labelledby={`position-x-${linecut.id}`}
                      />
                    </div>
                    <input
                      id={`position-x-${linecut.id}`}
                      type="number"
                      value={linecut.position}
                      min={0}
                      max={imageWidth - 1}
                      step={1}
                      onChange={(e) => updateInclinedLinecutPosition(linecut.id, parseInt(e.target.value) || 0, linecut.positionY ?? 0)}
                      className="border rounded w-20 text-center"
                      disabled={linecut.hidden}
                    />
                  </div>
                </div>

                {/* Y Position Slider */}
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">
                    <label htmlFor={`position-y-${linecut.id}`}>Y Position (pixels)</label>
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={0}
                        max={imageHeight - 1}
                        value={linecut.positionY ?? 0}
                        step={1}
                        onChange={(value) => updateInclinedLinecutPosition(linecut.id, linecut.position, value)}
                        marks={[0, imageHeight - 1]}
                        styles="w-full"
                        disabled={linecut.hidden}
                        aria-labelledby={`position-y-${linecut.id}`}
                      />
                    </div>
                    <input
                      id={`position-y-${linecut.id}`}
                      type="number"
                      value={linecut.positionY ?? 0}
                      min={0}
                      max={imageHeight - 1}
                      step={1}
                      onChange={(e) => updateInclinedLinecutPosition(linecut.id, linecut.position, parseInt(e.target.value) || 0)}
                      className="border rounded w-20 text-center"
                      disabled={linecut.hidden}
                    />
                  </div>
                </div>

                {/* Angle Slider */}
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-2">
                    <label htmlFor={`angle-${linecut.id}`}>Angle (degrees)</label>
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={-180}
                        max={180}
                        value={linecut.angle ?? 0}
                        step={1}
                        onChange={(value) => updateInclinedLinecutAngle(linecut.id, value)}
                        marks={[-180, 0, 180]}
                        styles="w-full"
                        disabled={linecut.hidden}
                        aria-labelledby={`angle-${linecut.id}`}
                      />
                    </div>
                    <input
                      id={`angle-${linecut.id}`}
                      type="number"
                      value={linecut.angle ?? 0}
                      min={-180}
                      max={180}
                      step={1}
                      onChange={(e) => updateInclinedLinecutAngle(linecut.id, parseFloat(e.target.value) || 0)}
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

      {/* Color Picker Popup */}
      {colorPicker?.visible && (
        <ColorPickerPopup
          ref={colorPickerRef}
          colorPicker={colorPicker}
          onColorChange={(id, side, color) => updateInclinedLinecutColor(id, side, color)}
          onAccept={() => setColorPicker(null)}
          onCancel={() => setColorPicker(null)}
        />
      )}
    </Accordion>
  );
};

export default InclinedLinecutWidget;
