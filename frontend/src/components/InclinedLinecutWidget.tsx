import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { Accordion } from '@mantine/core';
import { InclinedLinecut } from '../types';
import InputSlider from './InputSlider';
import ColorPickerPopup from './ColorPickerPopup';

interface InclinedLinecutWidgetProps {
  linecutType: string;
  imageWidth: number;
  imageHeight: number;
  linecuts: InclinedLinecut[];
  updateInclinedLinecutXPosition: (id: number, x: number) => void;
  updateInclinedLinecutYPosition: (id: number, y: number) => void;
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
  updateInclinedLinecutXPosition,
  updateInclinedLinecutYPosition,
  updateInclinedLinecutAngle,
  updateInclinedLinecutWidth,
  updateInclinedLinecutColor,
  deleteInclinedLinecut,
  toggleInclinedLinecutVisibility,
}) => {
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [colorPicker, setColorPicker] = useState<{
    id: number;
    side: 'left' | 'right';
    visible: boolean;
    originalColor: string;
    currentColor: string;
    position: { top: number; left: number };
  } | null>(null);

  const handleCancelColor = useCallback(() => {
    if (colorPicker) {
      updateInclinedLinecutColor(
        colorPicker.id,
        colorPicker.side,
        colorPicker.originalColor
      );
      setColorPicker(null);
    }
  }, [colorPicker, updateInclinedLinecutColor]);

  const handleColorChange = (id: number, side: 'left' | 'right', color: string) => {
    if (colorPicker) {
      setColorPicker({
        ...colorPicker,
        currentColor: color,
      });
    }
    updateInclinedLinecutColor(id, side, color);
  };

  const handleOpenColorPicker = (linecut: InclinedLinecut, side: 'left' | 'right', event: React.MouseEvent) => {
    // If it's not open, or open for a different linecut/side, open it with the new settings
    const originalColor = side === 'left' ? linecut.leftColor : linecut.rightColor;
    setColorPicker({
      id: linecut.id,
      side,
      visible: true,
      originalColor,
      currentColor: originalColor,
      position: { top: event.clientY + 10, left: event.clientX },
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPicker?.visible &&
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        handleCancelColor();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [colorPicker, handleCancelColor]);

  return (
      <Accordion
        multiple={false}
        defaultValue={linecutType ? `${linecutType}-linecuts` : undefined}
        chevronPosition="right"
        classNames={{
          chevron: "text-xl font-bold",
          label: "text-2xl font-bold",
          content: "p-0",
        }}
        className="w-full relative"
      >
        <Accordion.Item value={`${linecutType}-linecuts`}>
          <Accordion.Control className="pl-0">
            {linecutType} Linecuts
          </Accordion.Control>
          <Accordion.Panel>
            <div className="max-h-[600px] overflow-y-auto overflow-x-hidden">
              {linecuts.map((linecut) => (
                <div
                  key={linecut.id}
                  className="mb-5 pt-7 pb-5 pl-2 pr-3 relative shadow-lg border rounded-lg"
                  role="region"
                  aria-labelledby={`linecut-${linecut.id}-title`}
                >
                  {/* Header Section */}
                  <div className="flex items-center justify-between w-full mb-4">
                    <h3 className="text-xl font-semibold">
                      Linecut {linecut.id}
                    </h3>
                    <div className="flex items-center">
                      {/* Left color bar with tooltip */}
                      <div className="group relative">
                        <div
                          className="h-3 w-12 mr-4 cursor-pointer"
                          style={{ backgroundColor: linecut.leftColor }}
                          onClick={(e) => handleOpenColorPicker(linecut, 'left', e)}
                        />
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                          Click to change color
                        </span>
                      </div>
                      {/* Right color bar with tooltip */}
                      <div className="group relative">
                        <div
                          className="h-3 w-12 mr-2 cursor-pointer"
                          style={{ backgroundColor: linecut.rightColor }}
                          onClick={(e) => handleOpenColorPicker(linecut, 'right', e)}
                        />
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                          Click to change color
                        </span>
                      </div>
                      {/* Visibility Toggle with Tooltip */}
                      <div className="group relative">
                        <button
                          className="text-blue-500 hover:text-blue-700 ml-1 flex items-center pointer-events-auto"
                          onClick={() => toggleInclinedLinecutVisibility(linecut.id)}
                          aria-label={`Toggle Visibility of Linecut ${linecut.id}`}
                        >
                          {linecut.hidden ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                        </button>
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                          {linecut.hidden ? "Show" : "Hide"}
                        </span>
                      </div>
                      {/* Delete button with tooltip */}
                      <div className="group relative ml-4" style={{ transform: 'translateY(1px)' }}>
                        <button
                          className="w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white rounded"
                          onClick={() => deleteInclinedLinecut(linecut.id)}
                          aria-label={`Delete Linecut ${linecut.id}`}
                        >
                          <FaTrash size={14} />
                        </button>
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                          Delete
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Controls Section */}
                  <div className="space-y-4">
                    {/* Width Control */}
                    <div>
                      <h4 className="text-xl mb-2">Width (pixels)</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <InputSlider
                            min={0}
                            max={100}
                            marks={[0, 100]}
                            value={linecut.width}
                            onChange={(value) => updateInclinedLinecutWidth(linecut.id, value)}
                            disabled={linecut.hidden}
                          />
                        </div>
                        <input
                          type="number"
                          value={linecut.width}
                          onChange={(e) => updateInclinedLinecutWidth(linecut.id, Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-center"
                          disabled={linecut.hidden}
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>

                    {/* X Position Control */}
                    <div>
                      <h4 className="text-xl mb-2">X Position (pixels)</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <InputSlider
                            min={0}
                            max={imageWidth - 1}
                            marks={[0, imageWidth - 1]}
                            value={linecut.xPosition}
                            onChange={(value) => updateInclinedLinecutXPosition(linecut.id, value)}
                            disabled={linecut.hidden}
                          />
                        </div>
                        <input
                          type="number"
                          value={linecut.xPosition}
                          onChange={(e) => updateInclinedLinecutXPosition(linecut.id, Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-center"
                          disabled={linecut.hidden}
                          min={0}
                          max={imageWidth - 1}
                        />
                      </div>
                    </div>

                    {/* Y Position Control */}
                    <div>
                      <h4 className="text-xl mb-2">Y Position (pixels)</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <InputSlider
                            min={0}
                            max={imageHeight - 1}
                            marks={[0, imageHeight - 1]}
                            value={linecut.yPosition}
                            onChange={(value) => updateInclinedLinecutYPosition(linecut.id, value)}
                            disabled={linecut.hidden}
                          />
                        </div>
                        <input
                          type="number"
                          value={linecut.yPosition}
                          onChange={(e) => updateInclinedLinecutYPosition(linecut.id, Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-center"
                          disabled={linecut.hidden}
                          min={0}
                          max={imageHeight - 1}
                        />
                      </div>
                    </div>

                    {/* Angle Control */}
                    <div>
                      <h4 className="text-xl mb-2">Angle (degrees)</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <InputSlider
                            min={-180}
                            max={180}
                            marks={[-180, 0, 180]}
                            value={linecut.angle}
                            onChange={(value) => updateInclinedLinecutAngle(linecut.id, value)}
                            disabled={linecut.hidden}
                          />
                        </div>
                        <input
                          type="number"
                          value={linecut.angle}
                          onChange={(e) => updateInclinedLinecutAngle(linecut.id, Number(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-center"
                          disabled={linecut.hidden}
                          min={-180}
                          max={180}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Accordion.Panel>
        </Accordion.Item>
      {/* </Accordion> */}

      {/* Color Picker Popup */}
      {colorPicker?.visible && (
        <div ref={colorPickerRef}>
          <ColorPickerPopup
            colorPicker={colorPicker}
            onColorChange={handleColorChange}
            onAccept={() => setColorPicker(null)}
            onCancel={handleCancelColor}
          />
        </div>
      )}
    </Accordion>
  );
};

export default InclinedLinecutWidget;
