// import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
// import Plot from "react-plotly.js";
// import { Linecut } from "../types";

// interface VerticalLinecutFigProps {
//   linecuts: Linecut[];
//   imageData1: number[][];
//   imageData2: number[][];
//   zoomedXPixelRange: [number, number] | null;
//   zoomedYPixelRange: [number, number] | null;
//   qYVector: number[];  // Q-values for vertical axis
//   units?: string;      // Units for q-values (e.g., "nm⁻¹", "Å⁻¹")
// }

// interface Dimensions {
//   width: number | undefined;
//   height: number | undefined;
// }

// // Define interface for axis configuration
// interface AxisConfig {
//   title: {
//     text: string;
//     font: { size: number }
//     standoff?: number;
//   };
//   tickfont: { size: number };
//   autorange: boolean;
//   range?: [number, number]; // Optional range for zooming
// }

// const VerticalLinecutFig: React.FC<VerticalLinecutFigProps> = ({
//   linecuts,
//   imageData1,
//   imageData2,
//   zoomedXPixelRange,
//   zoomedYPixelRange,
//   qYVector,
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

//   // Compute averaged intensity for a vertical linecut
//   const computeAveragedIntensity = useCallback((
//     imageData: number[][],
//     pixelPosition: number,
//     width: number
//   ) => {
//     const halfWidth = width / 2;
//     const startCol = Math.max(0, Math.round(pixelPosition - halfWidth));
//     const endCol = Math.min(imageData[0].length - 1, Math.ceil(pixelPosition + halfWidth));

//     return Array.from(
//       { length: imageData.length },
//       (_, rowIndex) => {
//         let sum = 0;
//         let count = 0;

//         for (let col = startCol; col <= endCol; col++) {
//           if (col >= 0 && col < imageData[rowIndex].length &&
//               !Number.isNaN(imageData[rowIndex][col])) {
//             sum += imageData[rowIndex][col];
//             count++;
//           }
//         }

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

//     // For vertical linecuts, we check if the linecut's x-position falls within the x-range
//     const [xStart, xEnd] = xRange;
//     return linecut.pixelPosition >= xStart && linecut.pixelPosition <= xEnd;
//   }, []);

//   // Memoize plot data - SWAPPED: q-values on X-axis and intensity on Y-axis
//   const plotData = useMemo(() =>
//     linecuts
//       .filter((linecut) => !linecut.hidden)
//       .flatMap((linecut) => {
//         const averagedDataLeft = computeAveragedIntensity(
//           imageData1,
//           linecut.pixelPosition,
//           linecut.width ?? 1
//         );

//         const averagedDataRight = computeAveragedIntensity(
//           imageData2,
//           linecut.pixelPosition,
//           linecut.width ?? 1
//         );

//         // Format the position label with q-value
//         const positionLabel = `(q<sub>x</sub>=${linecut.position.toFixed(1)} ${units})`;

//         return [
//           {
//             x: qYVector, // Put q-values on the x-axis
//             y: averagedDataLeft, // Put intensity values on the y-axis
//             type: "scatter" as const,
//             mode: "lines" as const,
//             name: `Left Linecut ${linecut.id} ${positionLabel}`,
//             line: {
//               color: linecut.leftColor,
//               width: 2,
//             },
//           },
//           {
//             x: qYVector, // Put q-values on the x-axis
//             y: averagedDataRight, // Put intensity values on the y-axis
//             type: "scatter" as const,
//             mode: "lines" as const,
//             name: `Right Linecut ${linecut.id} ${positionLabel}`,
//             line: {
//               color: linecut.rightColor,
//               width: 2,
//             },
//           },
//         ];
//       }),
//     [linecuts, imageData1, imageData2, qYVector, units, computeAveragedIntensity]
//   );

//   // Update layout with swapped axis configurations
//   const layout = useMemo(() => {
//     // Check for linecuts in range
//     const hasLinecutInRange = linecuts
//       .filter(linecut => !linecut.hidden)
//       .some(linecut => isLinecutInRange(linecut, zoomedXPixelRange, zoomedYPixelRange));

//     // Default x-axis configuration for q-values
//     const defaultXAxis: AxisConfig = {
//       title: {
//         text: `q<sub>y</sub> (${units})`,
//         font: { size: 25 }
//       },
//       tickfont: { size: 25 },
//       autorange: true,
//     };

//     // Set x-axis range for zooming in q-space
//     let xAxisConfig: AxisConfig = { ...defaultXAxis };

//     if (zoomedYPixelRange && hasLinecutInRange && qYVector.length) {
//       // Convert pixel indices to q-values for the x-axis range
//       const qRange: [number, number] = [
//         qYVector[Math.min(zoomedYPixelRange[0], qYVector.length - 1)],
//         qYVector[Math.min(zoomedYPixelRange[1], qYVector.length - 1)]
//       ];

//       xAxisConfig = {
//         ...defaultXAxis,
//         range: qRange,
//         autorange: false,
//       };
//     }

//     // Default y-axis configuration for intensity values
//     const yAxisConfig: AxisConfig = {
//       title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
//       tickfont: { size: 25 },
//       autorange: true,
//     };

//     return {
//       width: dimensions.width,
//       height: dimensions.height,
//       xaxis: xAxisConfig,
//       yaxis: yAxisConfig,
//       margin: { l: 110 },
//       legend: { font: { size: 25 } },
//       font: { size: 25 },
//       showlegend: true,
//     };
//   }, [dimensions, zoomedYPixelRange, zoomedXPixelRange, linecuts, qYVector, units, isLinecutInRange]);

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

// export default VerticalLinecutFig;




import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import { Linecut } from "../types";

interface VerticalLinecutFigProps {
  linecuts: Linecut[];
  imageData1: number[][];
  imageData2: number[][];
  zoomedXPixelRange: [number, number] | null;
  zoomedYPixelRange: [number, number] | null;
  qYMatrix: number[][];  // Changed from qYVector to qYMatrix
  units?: string;      // Units for q-values (e.g., "nm⁻¹", "Å⁻¹")
}

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

// Define interface for axis configuration
interface AxisConfig {
  title: {
    text: string;
    font: { size: number }
    standoff?: number;
  };
  tickfont: { size: number };
  autorange: boolean;
  range?: [number, number]; // Optional range for zooming
}

const VerticalLinecutFig: React.FC<VerticalLinecutFigProps> = ({
  linecuts,
  imageData1,
  imageData2,
  zoomedXPixelRange,
  zoomedYPixelRange,
  qYMatrix,
  units = "nm⁻¹",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: undefined,
    height: undefined,
  });

  // Extract qYVector from the matrix for plotting
  const qYVector = useMemo(() => {
    if (!qYMatrix || !qYMatrix.length) {
      return [];
    }

    // Extract the first column of the matrix to get the y-axis values
    return qYMatrix.map(row => row?.[0] || 0);
  }, [qYMatrix]);

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

  // Compute averaged intensity for a vertical linecut
  const computeAveragedIntensity = useCallback((
    imageData: number[][],
    pixelPosition: number,
    width: number
  ) => {
    if (!imageData || !imageData.length || !imageData[0]) return [];

    const halfWidth = width / 2;
    const startCol = Math.max(0, Math.round(pixelPosition - halfWidth));
    const endCol = Math.min((imageData[0]?.length || 0) - 1, Math.ceil(pixelPosition + halfWidth));

    return Array.from(
      { length: imageData.length },
      (_, rowIndex) => {
        let sum = 0;
        let count = 0;

        for (let col = startCol; col <= endCol; col++) {
          if (imageData[rowIndex] && col >= 0 && col < imageData[rowIndex].length &&
              !Number.isNaN(imageData[rowIndex][col])) {
            sum += imageData[rowIndex][col];
            count++;
          }
        }

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

    // For vertical linecuts, we check if the linecut's x-position falls within the x-range
    const [xStart, xEnd] = xRange;
    return linecut.pixelPosition >= xStart && linecut.pixelPosition <= xEnd;
  }, []);

  // Memoize plot data - SWAPPED: q-values on X-axis and intensity on Y-axis
  const plotData = useMemo(() => {
    if (!qYVector.length) return [];

    return linecuts
      .filter((linecut) => !linecut.hidden)
      .flatMap((linecut) => {
        const averagedDataLeft = computeAveragedIntensity(
          imageData1,
          linecut.pixelPosition,
          linecut.width ?? 1
        );

        const averagedDataRight = computeAveragedIntensity(
          imageData2,
          linecut.pixelPosition,
          linecut.width ?? 1
        );

        // Format the position label with q-value
        const positionLabel = `(q<sub>x</sub>=${linecut.position.toFixed(1)} ${units})`;

        return [
          {
            x: qYVector, // Put q-values on the x-axis
            y: averagedDataLeft, // Put intensity values on the y-axis
            type: "scatter" as const,
            mode: "lines" as const,
            name: `Left Linecut ${linecut.id} ${positionLabel}`,
            line: {
              color: linecut.leftColor,
              width: 2,
            },
          },
          {
            x: qYVector, // Put q-values on the x-axis
            y: averagedDataRight, // Put intensity values on the y-axis
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
  }, [linecuts, imageData1, imageData2, qYVector, units, computeAveragedIntensity]);

  // Update layout with swapped axis configurations
  const layout = useMemo(() => {
    // Check for linecuts in range
    const hasLinecutInRange = linecuts
      .filter(linecut => !linecut.hidden)
      .some(linecut => isLinecutInRange(linecut, zoomedXPixelRange, zoomedYPixelRange));

    // Default x-axis configuration for q-values
    const defaultXAxis: AxisConfig = {
      title: {
        text: `q<sub>y</sub> (${units})`,
        font: { size: 25 }
      },
      tickfont: { size: 25 },
      autorange: true,
    };

    // Set x-axis range for zooming in q-space
    let xAxisConfig: AxisConfig = { ...defaultXAxis };

    if (zoomedYPixelRange && hasLinecutInRange && qYVector.length > 0) {
      // Convert pixel indices to q-values for the x-axis range
      const safeStartIndex = Math.min(zoomedYPixelRange[0], qYVector.length - 1);
      const safeEndIndex = Math.min(zoomedYPixelRange[1], qYVector.length - 1);

      const qRange: [number, number] = [
        qYVector[safeStartIndex],
        qYVector[safeEndIndex]
      ];

      xAxisConfig = {
        ...defaultXAxis,
        range: qRange,
        autorange: false,
      };
    }

    // Default y-axis configuration for intensity values
    const yAxisConfig: AxisConfig = {
      title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
      tickfont: { size: 25 },
      autorange: true,
    };

    return {
      width: dimensions.width,
      height: dimensions.height,
      xaxis: xAxisConfig,
      yaxis: yAxisConfig,
      margin: { l: 110 },
      legend: { font: { size: 25 } },
      font: { size: 25 },
      showlegend: true,
    };
  }, [dimensions, zoomedYPixelRange, zoomedXPixelRange, linecuts, qYVector, units, isLinecutInRange]);

  // Show an empty placeholder if there's no data
  if (!qYVector.length) {
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

export default VerticalLinecutFig;
