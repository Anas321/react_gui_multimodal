// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { FaEye, FaEyeSlash, FaTrash } from "react-icons/fa"; // Icons for visibility toggle
// import { Linecut } from "../types";
// import InputSlider from "./InputSlider";
// // import { InputSlider } from "bluesky-web";
// import { Accordion } from "@mantine/core";
// import ColorPickerPopup from "./ColorPickerPopup";

// interface HorizontalLinecutWidgetProps {
//   linecutType: string | null;
//   linecuts: Linecut[];
//   qYVector: number[];
//   updateHorizontalLinecutPosition: (id: number, position: number) => void;
//   updateHorizontalLinecutWidth: (id: number, width: number) => void;
//   updateHorizontalLinecutColor: (id: number, side: "left" | "right", color: string) => void;
//   deleteHorizontalLinecut: (id: number) => void;
//   toggleHorizontalLinecutVisibility: (id: number) => void;
// }

// const HorizontalLinecutWidget: React.FC<HorizontalLinecutWidgetProps> = ({
//   linecutType,
//   // imageHeight,
//   linecuts,
//   qYVector,
//   updateHorizontalLinecutPosition,
//   updateHorizontalLinecutWidth,
//   updateHorizontalLinecutColor,
//   deleteHorizontalLinecut,
//   toggleHorizontalLinecutVisibility,
// }) => {
//   const colorPickerRef = useRef<HTMLDivElement>(null);
//   const [colorPicker, setColorPicker] = useState<{
//     id: number;
//     side: "left" | "right";
//     visible: boolean;
//     originalColor: string; // Store the original color when opening the picker
//     currentColor: string; // Track the current color during picking
//     position: { top: number; left: number }; // Position for the color picker
//   } | null>(null);

//   const minQYValue = parseFloat(Math.min(...qYVector).toFixed(1));
//   const maxQYValue = parseFloat(Math.max(...qYVector).toFixed(1));

//   // console.log("minQYValue", minQYValue);
//   // console.log("maxQYValue", maxQYValue);


//   const handleCancelColor = useCallback(() => {
//     if (colorPicker) {
//       updateHorizontalLinecutColor(
//         colorPicker.id,
//         colorPicker.side,
//         colorPicker.originalColor
//       );
//       setColorPicker(null);
//     }
//   }, [colorPicker, updateHorizontalLinecutColor]);


//   const handleColorChange = (id: number, side: "left" | "right", color: string) => {
//     // Update the current color in the picker state
//     if (colorPicker) {
//       setColorPicker({
//         ...colorPicker,
//         currentColor: color,
//       });
//     }
//     // Update the color preview
//     updateHorizontalLinecutColor(id, side, color);
//   };

//   const handleOpenColorPicker = (linecut: Linecut, side: "left" | "right", event: React.MouseEvent) => {
//     // Check if the color picker is already open for this linecut and side
//     if (colorPicker?.id === linecut.id && colorPicker?.side === side && colorPicker?.visible) {
//       // If it is, close it and save the current color
//       setColorPicker(null);
//     } else {
//       // If it's not open, or open for a different linecut/side, open it with the new settings
//       const originalColor = side === "left" ? linecut.leftColor : linecut.rightColor;
//       setColorPicker({
//         id: linecut.id,
//         side,
//         visible: true,
//         originalColor,
//         currentColor: originalColor,
//         position: { top: event.clientY + 10, left: event.clientX },
//       });
//     }
//   };


//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         colorPicker?.visible &&
//         colorPickerRef.current &&
//         !colorPickerRef.current.contains(event.target as Node)
//       ) {
//         handleCancelColor();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [colorPicker, handleCancelColor]);



//   return (
//     <Accordion
//       multiple={false}
//       defaultValue={linecutType ? `${linecutType}-linecuts` : undefined}
//       chevronPosition="right"
//       classNames={{
//         chevron: "text-xl font-bold",
//         label: "text-2xl font-bold",
//         content: "p-0",
//       }}
//       className="w-full relative"
//     >
//       <Accordion.Item value={`${linecutType}-linecuts`} className="w-full">
//         <Accordion.Control className="pl-0">{linecutType} Linecuts</Accordion.Control>
//         <Accordion.Panel>
//           <div className="max-h-[400px] overflow-y-auto overflow-x-hidden w-full">
//             {linecuts.map((linecut) => (
//               <div
//                 key={linecut.id}
//                 // className="mb-5 pt-7 pb-5 pl-2 pr-3 relative shadow-lg border-2 h-[280px] w-full"
//                 className="mb-5 pt-7 pb-5 pl-2 pr-3 relative shadow-lg border rounded-lg"
//                 role="region"
//                 aria-labelledby={`linecut-${linecut.id}`}
//               >

//                   {/* Linecut Title with Color Pickers */}
//                   <div className="flex items-center justify-between w-full mb-4">
//                     <h3 className="text-xl font-semibold">
//                       Linecut {linecut.id}
//                       </h3>
//                     <div className="flex items-center ml-4">
//                       {/* Left color bar with tooltip */}
//                       <div className="group relative">
//                         <div
//                           className="h-3 w-12 mr-4 cursor-pointer"
//                           style={{ backgroundColor: linecut.leftColor }}
//                           onClick={(e) => handleOpenColorPicker(linecut, "left", e)}
//                         ></div>
//                         <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
//                           Click to change color
//                         </span>
//                       </div>
//                       {/* Right color bar with tooltip */}
//                       <div className="group relative">
//                         <div
//                           className="h-3 w-12 mr-2 cursor-pointer"
//                           style={{ backgroundColor: linecut.rightColor }}
//                           onClick={(e) => handleOpenColorPicker(linecut, "right", e)}
//                         ></div>
//                         <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
//                           Click to change color
//                         </span>
//                       </div>
//                       {/* Visibility Toggle with Tooltip */}
//                       <div className="group relative">
//                         <button
//                           className="text-blue-500 hover:text-blue-700 ml-1 flex items-center pointer-events-auto"
//                           onClick={() => toggleHorizontalLinecutVisibility(linecut.id)}
//                           aria-label={`Toggle Visibility of Linecut ${linecut.id}`}
//                         >
//                           {linecut.hidden ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
//                         </button>
//                         {/* Tooltip */}
//                         <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
//                         {linecut.hidden ? "Show" : "Hide"}
//                         </span>
//                       </div>
//                     {/* Delete button with tooltip */}
//                     <div className="group relative ml-4" style={{ transform: 'translateY(1px)' }}>
//                       <button
//                         className="w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white rounded"
//                         onClick={() => deleteHorizontalLinecut(linecut.id)}
//                         aria-label={`Delete Linecut ${linecut.id}`}
//                       >
//                         <FaTrash size={14} />
//                       </button>
//                       <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
//                         Delete
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Slider and Input Box for Linecut Width */}
//                 <div className="mb-6">
//                   <h4 className="text-xl mb-2">Width (nm⁻¹)</h4>
//                   <div className="flex items-center gap-4">
//                     <div className="flex-1">
//                       <InputSlider
//                         min={0}
//                         max={10}
//                         value={linecut.width || 0}
//                         step={0.1}
//                         onChange={(value) => updateHorizontalLinecutWidth(linecut.id, value)}
//                         marks={[0, 10]}
//                         styles="w-full"
//                         disabled={linecut.hidden}
//                       />
//                     </div>
//                     <input
//                       type="number"
//                       value={linecut.width || 0}
//                       min={0}
//                       max={10}
//                       step={0.1}
//                       onChange={(e) =>
//                         updateHorizontalLinecutWidth(linecut.id, parseFloat(e.target.value) || 0)
//                       }
//                       className="border rounded w-20 text-center"
//                       disabled={linecut.hidden}
//                     />
//                   </div>
//                 </div>

//                 {/* Slider and Input Box for Linecut Position */}
//                 <div className="mb-4">
//                   <h4 className="text-xl mb-2">q<sub>y</sub> value (nm⁻¹)</h4>
//                   <div className="flex items-center gap-4">
//                     <div className="flex-1">
//                       <InputSlider
//                         min={minQYValue}
//                         max={maxQYValue}
//                         value={parseFloat(linecut.position.toFixed(1))}
//                         step={0.1}
//                         onChange={(value) => updateHorizontalLinecutPosition(linecut.id, value)}
//                         marks={[minQYValue, maxQYValue]}
//                         styles="w-full"
//                         disabled={linecut.hidden}
//                       />
//                     </div>
//                     <input
//                       type="number"
//                       value={linecut.position.toFixed(1)}
//                       min={minQYValue}
//                       max={maxQYValue}
//                       step={0.1}
//                       onChange={(e) =>
//                         updateHorizontalLinecutPosition(linecut.id, parseInt(e.target.value) || 0)
//                       }
//                       className="border rounded w-20 text-center"
//                       disabled={linecut.hidden}
//                     />
//                   </div>
//                 </div>

//               </div>
//             ))}
//           </div>
//         </Accordion.Panel>
//       </Accordion.Item>


//           {/* Color Picker Popup */}
//           {colorPicker?.visible && (
//             <ColorPickerPopup
//               ref={colorPickerRef}
//               colorPicker={colorPicker}
//               onColorChange={handleColorChange}
//               onAccept={() => setColorPicker(null)}
//               onCancel={handleCancelColor}
//             />
//           )}

//     </Accordion>
//   );
// };

// export default HorizontalLinecutWidget;



import React, { useEffect, useRef, useState, useCallback } from "react";
import { FaEye, FaEyeSlash, FaTrash } from "react-icons/fa"; // Icons for visibility toggle
import { Linecut } from "../types";
import InputSlider from "./InputSlider";
import { Accordion } from "@mantine/core";
import ColorPickerPopup from "./ColorPickerPopup";

interface HorizontalLinecutWidgetProps {
  linecutType: string | null;
  linecuts: Linecut[];
  qYMatrix: number[][]; // Changed from qYVector to qYMatrix
  updateHorizontalLinecutPosition: (id: number, position: number) => void;
  updateHorizontalLinecutWidth: (id: number, width: number) => void;
  updateHorizontalLinecutColor: (id: number, side: "left" | "right", color: string) => void;
  deleteHorizontalLinecut: (id: number) => void;
  toggleHorizontalLinecutVisibility: (id: number) => void;
}

const HorizontalLinecutWidget: React.FC<HorizontalLinecutWidgetProps> = ({
  linecutType,
  linecuts,
  qYMatrix,
  updateHorizontalLinecutPosition,
  updateHorizontalLinecutWidth,
  updateHorizontalLinecutColor,
  deleteHorizontalLinecut,
  toggleHorizontalLinecutVisibility,
}) => {
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [colorPicker, setColorPicker] = useState<{
    id: number;
    side: "left" | "right";
    visible: boolean;
    originalColor: string; // Store the original color when opening the picker
    currentColor: string; // Track the current color during picking
    position: { top: number; left: number }; // Position for the color picker
  } | null>(null);

  // Find min and max q values from the matrix instead of vector
  const [minQYValue, maxQYValue] = React.useMemo(() => {
    if (!qYMatrix || !qYMatrix.length) {
      return [0, 1]; // Default range if matrix is empty
    }

    let minVal = Infinity;
    let maxVal = -Infinity;

    // Extract values from first column of each row
    for (let y = 0; y < qYMatrix.length; y++) {
      if (qYMatrix[y] && qYMatrix[y][0] !== undefined) {
        minVal = Math.min(minVal, qYMatrix[y][0]);
        maxVal = Math.max(maxVal, qYMatrix[y][0]);
      }
    }

    // Handle empty matrix case
    if (minVal === Infinity || maxVal === -Infinity) {
      return [0, 1];
    }

    return [
      parseFloat(minVal.toFixed(1)),
      parseFloat(maxVal.toFixed(1))
    ];
  }, [qYMatrix]);

  const handleCancelColor = useCallback(() => {
    if (colorPicker) {
      updateHorizontalLinecutColor(
        colorPicker.id,
        colorPicker.side,
        colorPicker.originalColor
      );
      setColorPicker(null);
    }
  }, [colorPicker, updateHorizontalLinecutColor]);

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

  const handleOpenColorPicker = (linecut: Linecut, side: "left" | "right", event: React.MouseEvent) => {
    // Check if the color picker is already open for this linecut and side
    if (colorPicker?.id === linecut.id && colorPicker?.side === side && colorPicker?.visible) {
      // If it is, close it and save the current color
      setColorPicker(null);
    } else {
      // If it's not open, or open for a different linecut/side, open it with the new settings
      const originalColor = side === "left" ? linecut.leftColor : linecut.rightColor;
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
      <Accordion.Item value={`${linecutType}-linecuts`} className="w-full">
        <Accordion.Control className="pl-0">{linecutType} Linecuts</Accordion.Control>
        <Accordion.Panel>
          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden w-full">
            {linecuts.map((linecut) => (
              <div
                key={linecut.id}
                className="mb-5 pt-7 pb-5 pl-2 pr-3 relative shadow-lg border rounded-lg"
                role="region"
                aria-labelledby={`linecut-${linecut.id}-title`}
              >
                {/* Linecut Title with Color Pickers */}
                <div className="flex items-center justify-between w-full mb-4">
                  <h3 className="text-xl font-semibold">
                    Linecut {linecut.id}
                  </h3>
                  <div className="flex items-center ml-4">
                    {/* Left color bar with tooltip */}
                    <div className="group relative">
                      <div
                        className="h-3 w-12 mr-4 cursor-pointer"
                        style={{ backgroundColor: linecut.leftColor }}
                        onClick={(e) => handleOpenColorPicker(linecut, "left", e)}
                      ></div>
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                        Click to change color
                      </span>
                    </div>
                    {/* Right color bar with tooltip */}
                    <div className="group relative">
                      <div
                        className="h-3 w-12 mr-2 cursor-pointer"
                        style={{ backgroundColor: linecut.rightColor }}
                        onClick={(e) => handleOpenColorPicker(linecut, "right", e)}
                      ></div>
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                        Click to change color
                      </span>
                    </div>
                    {/* Visibility Toggle with Tooltip */}
                    <div className="group relative">
                      <button
                        className="text-blue-500 hover:text-blue-700 ml-1 flex items-center pointer-events-auto"
                        onClick={() => toggleHorizontalLinecutVisibility(linecut.id)}
                        aria-label={`Toggle Visibility of Linecut ${linecut.id}`}
                      >
                        {linecut.hidden ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                      </button>
                      {/* Tooltip */}
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                        {linecut.hidden ? "Show" : "Hide"}
                      </span>
                    </div>
                    {/* Delete button with tooltip */}
                    <div className="group relative ml-4" style={{ transform: 'translateY(1px)' }}>
                      <button
                        className="w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white rounded"
                        onClick={() => deleteHorizontalLinecut(linecut.id)}
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

                {/* Slider and Input Box for Linecut Width */}
                <div className="mb-6">
                  <h4 className="text-xl mb-2">Width (nm⁻¹)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={0}
                        max={10}
                        value={linecut.width || 0}
                        step={0.1}
                        onChange={(value) => updateHorizontalLinecutWidth(linecut.id, value)}
                        marks={[0, 10]}
                        styles="w-full"
                        disabled={linecut.hidden}
                      />
                    </div>
                    <input
                      type="number"
                      value={linecut.width || 0}
                      min={0}
                      max={10}
                      step={0.1}
                      onChange={(e) =>
                        updateHorizontalLinecutWidth(linecut.id, parseFloat(e.target.value) || 0)
                      }
                      className="border rounded w-20 text-center"
                      disabled={linecut.hidden}
                    />
                  </div>
                </div>

                {/* Slider and Input Box for Linecut Position */}
                <div className="mb-4">
                  <h4 className="text-xl mb-2">q<sub>y</sub> value (nm⁻¹)</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <InputSlider
                        min={minQYValue}
                        max={maxQYValue}
                        value={parseFloat(linecut.position.toFixed(1))}
                        step={0.1}
                        onChange={(value) => updateHorizontalLinecutPosition(linecut.id, value)}
                        marks={[minQYValue, maxQYValue]}
                        styles="w-full"
                        disabled={linecut.hidden}
                      />
                    </div>
                    <input
                      type="number"
                      value={linecut.position.toFixed(1)}
                      min={minQYValue}
                      max={maxQYValue}
                      step={0.1}
                      onChange={(e) =>
                        updateHorizontalLinecutPosition(linecut.id, parseFloat(e.target.value) || 0)
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

      {/* Color Picker Popup */}
      {colorPicker?.visible && (
        <ColorPickerPopup
          ref={colorPickerRef}
          colorPicker={colorPicker}
          onColorChange={handleColorChange}
          onAccept={() => setColorPicker(null)}
          onCancel={handleCancelColor}
        />
      )}
    </Accordion>
  );
};

export default HorizontalLinecutWidget;
