// import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
// import Plot from "react-plotly.js";
// import { Linecut } from "../types";

// interface HorizontalLinecutFigProps {
//   linecuts: Linecut[];
//   imageData1: number[][];
//   imageData2: number[][];
//   zoomedXPixelRange: [number, number] | null;
//   zoomedYPixelRange: [number, number] | null;
//   qXVector: number[];  // Q-values for horizontal axis (required)
//   units?: string;      // Units for q-values (e.g., "nm⁻¹", "Å⁻¹")
// }

// interface Dimensions {
//   width: number | undefined;
//   height: number | undefined;
// }

// // Define interface for xaxis configuration
// interface AxisConfig {
//   title: {
//     text: string;
//     font: { size: number }
//   };
//   tickfont: { size: number };
//   autorange: boolean;
//   range?: [number, number]; // Optional range for zooming
// }

// const HorizontalLinecutFig: React.FC<HorizontalLinecutFigProps> = ({
//   linecuts,
//   imageData1,
//   imageData2,
//   zoomedXPixelRange,
//   zoomedYPixelRange,
//   qXVector,
//   units = "nm⁻¹",
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [dimensions, setDimensions] = useState<Dimensions>({
//     width: undefined,
//     height: undefined,
//   });

//   // Update dimensions when container size changes
//   useEffect(() => {
//     const resizeObserver = new ResizeObserver((entries) => {
//       if (entries[0]) {
//         const { width, height } = entries[0].contentRect;
//         setDimensions({
//           width: Math.floor(width),
//           height: Math.floor(height),
//         });
//       }
//     });

//     if (containerRef.current) {
//       resizeObserver.observe(containerRef.current);
//     }

//     return () => resizeObserver.disconnect();
//   }, []);

//   // Compute averaged intensity for a linecut
//   const computeAveragedIntensity = useCallback((
//     imageData: number[][],
//     pixelPosition: number,
//     width: number
//   ) => {
//     const halfWidth = width / 2;
//     const startRow = Math.max(0, Math.round(pixelPosition - halfWidth));
//     const endRow = Math.min(imageData.length - 1, Math.ceil(pixelPosition + halfWidth));

//     return Array.from(
//       { length: imageData[0].length },
//       (_, colIndex) => {
//         let sum = 0;
//         let count = 0;

//         for (let row = startRow; row <= endRow; row++) {
//           // Check if the value is not NaN before adding it to the sum
//           if (!Number.isNaN(imageData[row][colIndex])) {
//             sum += imageData[row][colIndex];
//             count++;
//           }
//         }

//         // If all values were NaN, return 0 instead of NaN
//         return count > 0 ? sum / count : 0;
//       }
//     );
//   }, []);

//   // Determine if the linecut is in the zoomed range
//   const isLinecutInRange = useCallback((
//     linecut: Linecut,
//     xRange: [number, number] | null,
//     yRange: [number, number] | null
//   ): boolean => {
//     if (!xRange || !yRange) return false;

//     const [yStart, yEnd] = yRange;
//     return linecut.pixelPosition <= yStart && linecut.pixelPosition >= yEnd;
//   }, []);

//   // Memoize the plot data
//   const plotData = useMemo(() => {
//     const visibleLinecuts = linecuts.filter(linecut => !linecut.hidden);

//     return visibleLinecuts.flatMap(linecut => {
//       // Calculate intensities using the pixel position for data sampling
//       const averagedDataLeft = computeAveragedIntensity(
//         imageData1,
//         linecut.pixelPosition,
//         linecut.width
//       );

//       const averagedDataRight = computeAveragedIntensity(
//         imageData2,
//         linecut.pixelPosition,
//         linecut.width
//       );

//       // Format the position label with q-value
//       const positionLabel = `(q<sub>y</sub>=${linecut.position.toFixed(1)} ${units})`;

//       return [
//         {
//           x: qXVector,  // Always use qXVector for the x-axis
//           y: averagedDataLeft,
//           type: "scatter" as const,
//           mode: "lines" as const,
//           name: `Left Linecut ${linecut.id} ${positionLabel}`,
//           line: {
//             color: linecut.leftColor,
//             width: 2,
//           },
//         },
//         {
//           x: qXVector,  // Always use qXVector for the x-axis
//           y: averagedDataRight,
//           type: "scatter" as const,
//           mode: "lines" as const,
//           name: `Right Linecut ${linecut.id} ${positionLabel}`,
//           line: {
//             color: linecut.rightColor,
//             width: 2,
//           },
//         },
//       ];
//     });
//   }, [linecuts, imageData1, imageData2, qXVector, units, computeAveragedIntensity]);

//   // Update layout
//   const layout = useMemo(() => {
//     const defaultRange: { xaxis: AxisConfig } = {
//       xaxis: {
//         title: {
//           text: `q<sub>x</sub> (${units})`,
//           font: { size: 25 }
//         },
//         tickfont: { size: 25 },
//         autorange: true,
//       },
//     };

//     // Check for linecuts in range
//     const hasLinecutInRange = linecuts
//       .filter(linecut => !linecut.hidden)
//       .some(linecut => isLinecutInRange(linecut, zoomedXPixelRange, zoomedYPixelRange));

//     // Set x-axis range for zooming
//     let xAxisConfig: AxisConfig = { ...defaultRange.xaxis };

//     if (zoomedXPixelRange && hasLinecutInRange) {
//       // Convert pixel indices to q-values for the x-axis range
//       const qRange: [number, number] = [
//         qXVector[Math.min(zoomedXPixelRange[0], qXVector.length - 1)],
//         qXVector[Math.min(zoomedXPixelRange[1], qXVector.length - 1)]
//       ];

//       xAxisConfig = {
//         ...defaultRange.xaxis,
//         range: qRange,
//         autorange: false,
//       };
//     }

//     return {
//       width: dimensions.width,
//       height: dimensions.height,
//       xaxis: xAxisConfig,
//       yaxis: {
//         title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
//         tickfont: { size: 25 },
//         autorange: true,
//       },
//       margin: { l: 110 },
//       legend: { font: { size: 25 } },
//       font: { size: 25 },
//       showlegend: true,
//     };
//   }, [dimensions, zoomedXPixelRange, zoomedYPixelRange, linecuts, qXVector, units, isLinecutInRange]);

//   return (
//     <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow">
//       <Plot
//         data={plotData}
//         layout={layout}
//         config={{
//           scrollZoom: true,
//           responsive: true,
//           displayModeBar: true,
//           displaylogo: false,
//           modeBarButtons: [
//             [
//               'pan2d',
//               'zoom2d',
//               'zoomIn2d',
//               'zoomOut2d',
//               'autoScale2d',
//               'resetScale2d',
//               'toImage',
//             ],
//           ],
//           showTips: true,
//         }}
//         useResizeHandler
//         style={{ width: "100%", height: "100%" }}
//       />
//     </div>
//   );
// };

// export default HorizontalLinecutFig;


import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import { Linecut } from "../types";

interface HorizontalLinecutFigProps {
  linecuts: Linecut[];
  imageData1: number[][];
  imageData2: number[][];
  zoomedXPixelRange: [number, number] | null;
  zoomedYPixelRange: [number, number] | null;
  qXMatrix: number[][];  // Changed to qXMatrix instead of qXVector
  units?: string;      // Units for q-values (e.g., "nm⁻¹", "Å⁻¹")
}

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

// Define interface for xaxis configuration
interface AxisConfig {
  title: {
    text: string;
    font: { size: number }
  };
  tickfont: { size: number };
  autorange: boolean;
  range?: [number, number]; // Optional range for zooming
}

const HorizontalLinecutFig: React.FC<HorizontalLinecutFigProps> = ({
  linecuts,
  imageData1,
  imageData2,
  zoomedXPixelRange,
  zoomedYPixelRange,
  qXMatrix,
  units = "nm⁻¹",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: undefined,
    height: undefined,
  });

  // Extract qXVector from the matrix for plotting
  const qXVector = useMemo(() => {
    if (!qXMatrix || !qXMatrix.length || !qXMatrix[0]) {
      return [];
    }

    // Use a middle row from the matrix for the vector
    const middleRow = Math.floor(qXMatrix.length / 2);
    return qXMatrix[middleRow] || [];
  }, [qXMatrix]);

  // Update dimensions when container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Compute averaged intensity for a linecut
  const computeAveragedIntensity = useCallback((
    imageData: number[][],
    pixelPosition: number,
    width: number
  ) => {
    if (!imageData || !imageData.length) return [];

    const halfWidth = width / 2;
    const startRow = Math.max(0, Math.round(pixelPosition - halfWidth));
    const endRow = Math.min(imageData.length - 1, Math.ceil(pixelPosition + halfWidth));

    return Array.from(
      { length: imageData[0]?.length || 0 },
      (_, colIndex) => {
        let sum = 0;
        let count = 0;

        for (let row = startRow; row <= endRow; row++) {
          // Check if the value is not NaN before adding it to the sum
          if (imageData[row] && !Number.isNaN(imageData[row][colIndex])) {
            sum += imageData[row][colIndex];
            count++;
          }
        }

        // If all values were NaN, return 0 instead of NaN
        return count > 0 ? sum / count : 0;
      }
    );
  }, []);

  // Determine if the linecut is in the zoomed range
  const isLinecutInRange = useCallback((
    linecut: Linecut,
    xRange: [number, number] | null,
    yRange: [number, number] | null
  ): boolean => {
    if (!xRange || !yRange) return false;

    const [yStart, yEnd] = yRange;
    return linecut.pixelPosition <= yStart && linecut.pixelPosition >= yEnd;
  }, []);

  // Memoize the plot data
  const plotData = useMemo(() => {
    if (!qXVector.length) return [];

    const visibleLinecuts = linecuts.filter(linecut => !linecut.hidden);

    return visibleLinecuts.flatMap(linecut => {
      // Calculate intensities using the pixel position for data sampling
      const averagedDataLeft = computeAveragedIntensity(
        imageData1,
        linecut.pixelPosition,
        linecut.width
      );

      const averagedDataRight = computeAveragedIntensity(
        imageData2,
        linecut.pixelPosition,
        linecut.width
      );

      // Format the position label with q-value
      const positionLabel = `(q<sub>y</sub>=${linecut.position.toFixed(1)} ${units})`;

      return [
        {
          x: qXVector,  // Use extracted qXVector for the x-axis
          y: averagedDataLeft,
          type: "scatter" as const,
          mode: "lines" as const,
          name: `Left Linecut ${linecut.id} ${positionLabel}`,
          line: {
            color: linecut.leftColor,
            width: 2,
          },
        },
        {
          x: qXVector,  // Use extracted qXVector for the x-axis
          y: averagedDataRight,
          type: "scatter" as const,
          mode: "lines" as const,
          name: `Right Linecut ${linecut.id} ${positionLabel}`,
          line: {
            color: linecut.rightColor,
            width: 2,
          },
        },
      ];
    });
  }, [linecuts, imageData1, imageData2, qXVector, units, computeAveragedIntensity]);

  // Update layout
  const layout = useMemo(() => {
    const defaultRange: { xaxis: AxisConfig } = {
      xaxis: {
        title: {
          text: `q<sub>x</sub> (${units})`,
          font: { size: 25 }
        },
        tickfont: { size: 25 },
        autorange: true,
      },
    };

    // Check for linecuts in range
    const hasLinecutInRange = linecuts
      .filter(linecut => !linecut.hidden)
      .some(linecut => isLinecutInRange(linecut, zoomedXPixelRange, zoomedYPixelRange));

    // Set x-axis range for zooming
    let xAxisConfig: AxisConfig = { ...defaultRange.xaxis };

    if (zoomedXPixelRange && hasLinecutInRange && qXVector.length > 0) {
      // Convert pixel indices to q-values for the x-axis range
      const safeStartIndex = Math.min(zoomedXPixelRange[0], qXVector.length - 1);
      const safeEndIndex = Math.min(zoomedXPixelRange[1], qXVector.length - 1);

      const qRange: [number, number] = [
        qXVector[safeStartIndex],
        qXVector[safeEndIndex]
      ];

      xAxisConfig = {
        ...defaultRange.xaxis,
        range: qRange,
        autorange: false,
      };
    }

    return {
      width: dimensions.width,
      height: dimensions.height,
      xaxis: xAxisConfig,
      yaxis: {
        title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
        tickfont: { size: 25 },
        autorange: true,
      },
      margin: { l: 110 },
      legend: { font: { size: 25 } },
      font: { size: 25 },
      showlegend: true,
    };
  }, [dimensions, zoomedXPixelRange, zoomedYPixelRange, linecuts, qXVector, units, isLinecutInRange]);

  // Show an empty placeholder if there's no data
  if (!qXVector.length) {
    return (
      <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow flex items-center justify-center min-h-[300px]">
        <p className="text-xl text-gray-500">No q-vector data available for plotting</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow">
      <Plot
        data={plotData}
        layout={layout}
        config={{
          scrollZoom: true,
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtons: [
            [
              'pan2d',
              'zoom2d',
              'zoomIn2d',
              'zoomOut2d',
              'autoScale2d',
              'resetScale2d',
              'toImage',
            ],
          ],
          showTips: true,
        }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default HorizontalLinecutFig;
