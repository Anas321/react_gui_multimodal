// import React, { useEffect, useRef, useState } from "react";
// import Plot from "react-plotly.js";
// import { Linecut } from "../types";

// interface HorizontalLinecutFigProps {
//   linecuts: Linecut[];
//   imageData1: number[][];
//   imageData2: number[][];
//   zoomedPixelRange: [number, number] | null;
// }

// // Add interface for dimensions
// interface Dimensions {
//   width: number | undefined;
//   height: number | undefined;
// }

// const HorizontalLinecutFig: React.FC<HorizontalLinecutFigProps> = ({
//   linecuts,
//   imageData1,
//   imageData2,
//   zoomedPixelRange,
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);

//   // Move layout into a memoized value that updates when zoomedPixelRange changes
//   const layout = React.useMemo(() => ({
//     width: undefined, // Let ResizeObserver handle this
//     height: undefined, // Let ResizeObserver handle this
//     xaxis: {
//       title: { text: "Pixel Index", font: { size: 25 } },
//       tickfont: { size: 25 },
//       range: zoomedPixelRange || undefined, // Directly use zoomedPixelRange
//     },
//     yaxis: {
//       title: { text: "Intensity", font: { size: 25 } },
//       tickfont: { size: 25 },
//     },
//     legend: {
//       font: { size: 25 },
//     },
//     font: { size: 25 },
//     showlegend: true,
//   }), [zoomedPixelRange]);

//   // Separate state for dimensions only
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
//           width: Math.floor(width), // Ensure we're using numbers
//           height: Math.floor(height),
//         });
//       }
//     });

//     if (containerRef.current) {
//       resizeObserver.observe(containerRef.current);
//     }

//     return () => resizeObserver.disconnect();
//   }, []);

//   const computeAveragedIntensity = (
//     imageData: number[][],
//     position: number,
//     width: number
//   ) => {
//     const halfWidth = width / 2;
//     const startRow = Math.max(0, Math.floor(position - halfWidth));
//     const endRow = Math.min(imageData.length - 1, Math.ceil(position + halfWidth));

//     const averagedIntensity = Array.from(
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

//     return averagedIntensity;
//   };

//   // Memoize the plot data to prevent unnecessary recalculations
//   const plotData = React.useMemo(() =>
//     linecuts
//       .filter((linecut) => !linecut.hidden)
//       .flatMap((linecut) => {
//         const averagedDataLeft = computeAveragedIntensity(
//           imageData1,
//           linecut.position,
//           linecut.width ?? 1
//         );

//         const averagedDataRight = computeAveragedIntensity(
//           imageData2,
//           linecut.position,
//           linecut.width ?? 1
//         );

//         return [
//           {
//             x: Array.from({ length: averagedDataLeft.length }, (_, i) => i),
//             y: averagedDataLeft,
//             type: "scatter" as const,
//             mode: "lines" as const,
//             name: `Left Linecut ${linecut.id}`,
//             line: {
//               color: linecut.leftColor,
//               width: 2,
//             },
//           },
//           {
//             x: Array.from({ length: averagedDataRight.length }, (_, i) => i),
//             y: averagedDataRight,
//             type: "scatter" as const,
//             mode: "lines" as const,
//             name: `Right Linecut ${linecut.id}`,
//             line: {
//               color: linecut.rightColor,
//               width: 2,
//             },
//           },
//         ];
//       }),
//     [linecuts, imageData1, imageData2]
//   );

//   return (
//     <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow">
//       <Plot
//         data={plotData}
//         layout={{
//           ...layout,
//           ...dimensions,
//         }}
//         config={{
//           scrollZoom: true,
//           responsive: true,
//           displayModeBar: true,
//           displaylogo: false,
//           modeBarButtons: [
//             [
//               'pan2d',  // Add pan button
//               'zoom2d', // Add zoom button
//               'zoomIn2d',
//               'zoomOut2d',
//               'autoScale2d',
//               'resetScale2d',
//               'toImage',
//             ],
//           ],
//           modeBarButtonsToRemove: [], // Keep all default buttons
//           showTips: true,  // Show tooltips when hovering over mode bar buttons
//         }}
//         useResizeHandler
//         style={{ width: "100%", height: "100%" }}
//       />
//     </div>
//   );
// };

// export default HorizontalLinecutFig;


import React, { useEffect, useRef, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { Linecut } from "../types";

interface HorizontalLinecutFigProps {
  linecuts: Linecut[];
  imageData1: number[][];
  imageData2: number[][];
  zoomedPixelRange: [number, number] | null;
}

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

const HorizontalLinecutFig: React.FC<HorizontalLinecutFigProps> = ({
  linecuts,
  imageData1,
  imageData2,
  zoomedPixelRange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: undefined,
    height: undefined,
  });
  const [dragMode, setDragMode] = useState('zoom');

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
  const computeAveragedIntensity = (
    imageData: number[][],
    position: number,
    width: number
  ) => {
    const halfWidth = width / 2;
    const startRow = Math.max(0, Math.floor(position - halfWidth));
    const endRow = Math.min(imageData.length - 1, Math.ceil(position + halfWidth));

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
  };

  // Memoize the plot data with proper downsampling
  const plotData = useMemo(() => {
    const visibleLinecuts = linecuts.filter(linecut => !linecut.hidden);

    return visibleLinecuts.flatMap(linecut => {
      // Calculate full resolution intensities
      const averagedDataLeft = computeAveragedIntensity(
        imageData1,
        linecut.position,
        linecut.width ?? 1
      );
      const averagedDataRight = computeAveragedIntensity(
        imageData2,
        linecut.position,
        linecut.width ?? 1
      );

      // Generate x-values at full resolution
      const xValues = Array.from(
        { length: averagedDataLeft.length },
        (_, i) => i
      );

      return [
        {
          x: xValues,
          y: averagedDataLeft,
          type: "scatter" as const,
          mode: "lines" as const,
          name: `Left Linecut ${linecut.id}`,
          line: {
            color: linecut.leftColor,
            width: 2,
          },
        },
        {
          x: xValues,
          y: averagedDataRight,
          type: "scatter" as const,
          mode: "lines" as const,
          name: `Right Linecut ${linecut.id}`,
          line: {
            color: linecut.rightColor,
            width: 2,
          },
        },
      ];
    });
  }, [linecuts, imageData1, imageData2]);

  // Memoize layout to include zoomed range
  const layout = useMemo(() => {
    // Set default ranges for the plot
    const defaultRange = {
      xaxis: {
        title: { text: "Pixel Index", font: { size: 25 } },
        tickfont: { size: 25 },
        autorange: true,
      },
    };

    // If we have a zoomed range, override the default
    const zoomedRange = zoomedPixelRange ? {
      xaxis: {
        ...defaultRange.xaxis,
        range: zoomedPixelRange,
        autorange: false,
      },
    } : defaultRange;

    return {
      width: dimensions.width,
      height: dimensions.height,
      dragmode: dragMode,
      ...zoomedRange,
      yaxis: {
        title: { text: "Intensity", font: { size: 25 } },
        tickfont: { size: 25 },
        autorange: true,
      },
      legend: {
        font: { size: 25 },
      },
      font: { size: 25 },
      showlegend: true,
    };
  }, [dimensions, zoomedPixelRange, dragMode]);

  const handleRelayout = (relayoutData: any) => {
    // Update drag mode if changed
    if (relayoutData.dragmode) {
      setDragMode(relayoutData.dragmode);
    }
  };

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
        onRelayout={handleRelayout}
      />
    </div>
  );
};

export default HorizontalLinecutFig;
