// import React, { useEffect, useRef, useState, useMemo } from "react";
// import Plot from "react-plotly.js";
// import { Linecut } from "../types";

// interface HorizontalLinecutFigProps {
//   linecuts: Linecut[];
//   imageData1: number[][];
//   imageData2: number[][];
//   zoomedXPixelRange: [number, number] | null;
//   zoomedYPixelRange: [number, number] | null;  // Add y-range parameter
// }

// interface Dimensions {
//   width: number | undefined;
//   height: number | undefined;
// }

// const HorizontalLinecutFig: React.FC<HorizontalLinecutFigProps> = ({
//   linecuts,
//   imageData1,
//   imageData2,
//   zoomedXPixelRange,
//   zoomedYPixelRange,
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
//   const computeAveragedIntensity = (
//     imageData: number[][],
//     position: number,
//     width: number
//   ) => {
//     const halfWidth = width / 2;
//     const startRow = Math.max(0, Math.round(position - halfWidth));
//     const endRow = Math.min(imageData.length - 1, Math.ceil(position + halfWidth));

//     // console.log("startRow", startRow);
//     // console.log("endRow", endRow);

//     return Array.from(
//       { length: imageData[0].length },
//       (_, colIndex) => {
//         let sum = 0;
//         let count = 0;

//         for (let row = startRow; row <= endRow; row++) {
//           sum += imageData[row][colIndex];
//           count++;
//         }

//         return sum / count;
//       }
//     );
//   };

//   // Memoize the plot data with proper downsampling
//   const plotData = useMemo(() => {
//     const visibleLinecuts = linecuts.filter(linecut => !linecut.hidden);

//     return visibleLinecuts.flatMap(linecut => {
//       // Calculate full resolution intensities
//       const averagedDataLeft = computeAveragedIntensity(
//         imageData1,
//         linecut.position,
//         linecut.width
//       );
//       const averagedDataRight = computeAveragedIntensity(
//         imageData2,
//         linecut.position,
//         linecut.width
//       );

//       // Generate x-values at full resolution
//       const xValues = Array.from(
//         { length: averagedDataLeft.length },
//         (_, i) => i
//       );

//       return [
//         {
//           x: xValues,
//           y: averagedDataLeft,
//           type: "scatter" as const,
//           mode: "lines" as const,
//           name: `Left Linecut ${linecut.id}`,
//           line: {
//             color: linecut.leftColor,
//             width: 2,
//           },
//         },
//         {
//           x: xValues,
//           y: averagedDataRight,
//           type: "scatter" as const,
//           mode: "lines" as const,
//           name: `Right Linecut ${linecut.id}`,
//           line: {
//             color: linecut.rightColor,
//             width: 2,
//           },
//         },
//       ];
//     });
//   }, [linecuts, imageData1, imageData2]);


//   // // Memoize layout to include zoomed range
//   // const layout = useMemo(() => {
//   //   // Set default ranges for the plot
//   //   const defaultRange = {
//   //     xaxis: {
//   //       title: { text: "Pixel Index", font: { size: 25 } },
//   //       tickfont: { size: 25 },
//   //       autorange: true,
//   //     },
//   //   };

//   //   // If we have a zoomed range, override the default
//   //   const zoomedRange = zoomedXPixelRange ? {
//   //     xaxis: {
//   //       ...defaultRange.xaxis,
//   //       range: zoomedXPixelRange,
//   //       autorange: false,
//   //     },
//   //   } : defaultRange;

//   //   return {
//   //     width: dimensions.width,
//   //     height: dimensions.height,
//   //     ...zoomedRange,
//   //     yaxis: {
//   //       title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
//   //       tickfont: { size: 25 },
//   //       autorange: true,
//   //     },
//   //     margin: {
//   //       l: 110
//   //     },
//   //     legend: {
//   //       font: { size: 25 },
//   //     },
//   //     font: { size: 25 },
//   //     showlegend: true,
//   //   };
//   // }, [dimensions, zoomedXPixelRange]);


//   const isLinecutInRange = (
//     linecut: Linecut,
//     xRange: [number, number] | null,
//     yRange: [number, number] | null  // Add yRange parameter
//   ): boolean => {
//     // If either range is null, consider linecut not in range
//     if (!xRange || !yRange) return false;

//     const [yStart, yEnd] = yRange;
//     const position = linecut.position;

//     // A linecut is in range if its y-position (linecut.position) falls within the y-range
//     return position <= yStart && position >= yEnd;
//   };

//   // Then update the layout useMemo to pass both ranges:
//   const layout = useMemo(() => {

//     const defaultRange = {
//       xaxis: {
//         title: { text: "Pixel Index", font: { size: 25 } },
//         tickfont: { size: 25 },
//         autorange: true,
//       },
//     };

//     // Check for linecuts in range considering both x and y ranges
//     const hasLinecutInRange = linecuts
//       .filter(linecut => !linecut.hidden)
//       .some(linecut => isLinecutInRange(linecut, zoomedXPixelRange, zoomedYPixelRange));

//     const xAxisConfig = (zoomedXPixelRange && hasLinecutInRange)
//       ? {
//           ...defaultRange.xaxis,
//           range: zoomedXPixelRange,
//           autorange: false,
//         }
//       : defaultRange.xaxis;

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
//   }, [dimensions, zoomedXPixelRange, zoomedYPixelRange, linecuts]);


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
  qXVector: number[];  // Q-values for horizontal axis (required)
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
  qXVector,
  units = "nm⁻¹",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: undefined,
    height: undefined,
  });

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
    const halfWidth = width / 2;
    const startRow = Math.max(0, Math.round(pixelPosition - halfWidth));
    const endRow = Math.min(imageData.length - 1, Math.ceil(pixelPosition + halfWidth));

    return Array.from(
      { length: imageData[0].length },
      (_, colIndex) => {
        let sum = 0;
        let count = 0;

        for (let row = startRow; row <= endRow; row++) {
          sum += imageData[row][colIndex];
          count++;
        }

        return sum / count;
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
      const positionLabel = `(q=${linecut.position.toFixed(2)} ${units})`;

      return [
        {
          x: qXVector,  // Always use qXVector for the x-axis
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
          x: qXVector,  // Always use qXVector for the x-axis
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
          text: `q (${units})`,
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

    if (zoomedXPixelRange && hasLinecutInRange) {
      // Convert pixel indices to q-values for the x-axis range
      const qRange: [number, number] = [
        qXVector[Math.min(zoomedXPixelRange[0], qXVector.length - 1)],
        qXVector[Math.min(zoomedXPixelRange[1], qXVector.length - 1)]
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
