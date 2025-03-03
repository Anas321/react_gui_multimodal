// import React, { useEffect, useRef, useState, useMemo } from 'react';
// import Plot from 'react-plotly.js';
// import { InclinedLinecut } from '../types';
// import { calculateInclinedLineEndpoints } from '../utils/calculateInclinedLinecutEndpoints';

// interface InclinedLinecutFigProps {
//     linecuts: InclinedLinecut[];
//     imageWidth: number;
//     imageHeight: number;
//     inclinedLinecutData1: { id: number; data: number[] }[] | undefined;
//     inclinedLinecutData2: { id: number; data: number[] }[] | undefined;
//     zoomedXPixelRange: [number, number] | null;
//     zoomedYPixelRange: [number, number] | null;
// }

// interface Dimensions {
//     width: number | undefined;
//     height: number | undefined;
// }

// const InclinedLinecutFig: React.FC<InclinedLinecutFigProps> = ({
//     linecuts,
//     imageWidth,
//     imageHeight,
//     inclinedLinecutData1,
//     inclinedLinecutData2,
//     zoomedXPixelRange,
//     zoomedYPixelRange,
// }) => {
//     const containerRef = useRef<HTMLDivElement>(null);
//     const [dimensions, setDimensions] = useState<Dimensions>({
//         width: undefined,
//         height: undefined,
//     });

//     // Update dimensions when container size changes
//     useEffect(() => {
//         const resizeObserver = new ResizeObserver((entries) => {
//             if (entries[0]) {
//                 const { width, height } = entries[0].contentRect;
//                 setDimensions({
//                     width: Math.floor(width),
//                     height: Math.floor(height),
//                 });
//             }
//         });

//         if (containerRef.current) {
//             resizeObserver.observe(containerRef.current);
//         }

//         return () => resizeObserver.disconnect();
//     }, []);

//     // Compute path distance with better precision
//     const computePathDistance = (lineLength: number): number[] => {
//         return Array.from({ length: Math.ceil(lineLength) }, (_, i) => i);
//     };

//     // Memoize plot data
//     const plotData = useMemo(() => {
//         return linecuts
//             .filter((linecut) => !linecut.hidden)
//             .flatMap((linecut) => {
//                 // Find corresponding data
//                 const data1 = inclinedLinecutData1?.find(d => d.id === linecut.id)?.data;
//                 const data2 = inclinedLinecutData2?.find(d => d.id === linecut.id)?.data;

//                 // If no data is available, skip this linecut
//                 if (!data1 || !data2) return [];

//                 const endpoints = calculateInclinedLineEndpoints({
//                     linecut: linecut,
//                     imageWidth: imageWidth,
//                     imageHeight: imageHeight,
//                 });

//                 if (!endpoints) return [];
//                 const { x0, y0, x1, y1 } = endpoints;

//                 // Calculate the total distance and unit vector
//                 const dx = x1 - x0;
//                 const dy = y1 - y0;
//                 const length = Math.sqrt(dx * dx + dy * dy);

//                 // If we have zero length, return empty array
//                 if (length === 0) return [];

//                 const pathDistance = computePathDistance(length);

//                 return [
//                     {
//                         x: pathDistance,
//                         y: data1,
//                         type: 'scatter' as const,
//                         mode: 'lines' as const,
//                         name: `Left Linecut ${linecut.id}`,
//                         line: {
//                             color: linecut.leftColor,
//                             width: 2,
//                         },
//                         hovertemplate: 'Distance: %{x:.1f}<br>Intensity: %{y:.1f}<extra></extra>'
//                     },
//                     {
//                         x: pathDistance,
//                         y: data2,
//                         type: 'scatter' as const,
//                         mode: 'lines' as const,
//                         name: `Right Linecut ${linecut.id}`,
//                         line: {
//                             color: linecut.rightColor,
//                             width: 2,
//                         },
//                         hovertemplate: 'Distance: %{x:.1f}<br>Intensity: %{y:.1f}<extra></extra>'
//                     },
//                 ];
//             });
//     }, [linecuts, inclinedLinecutData1, inclinedLinecutData2, imageWidth, imageHeight]);

//     const isLinecutInRange = (
//         linecut: InclinedLinecut,
//         xRange: [number, number] | null,
//         yRange: [number, number] | null
//     ): boolean => {
//         // If either range is null, consider linecut not in range
//         if (!xRange || !yRange) return false;

//         const [yStart, yEnd] = yRange;
//         const position = linecut.yPosition;

//         // A linecut is in range if its y-position falls within the y-range
//         return position <= yStart && position >= yEnd;
//     };

//     // Update the layout useMemo to match HorizontalLinecutFig
//     const layout = useMemo(() => {
//         const defaultRange = {
//             xaxis: {
//                 title: { text: "Distance Along Line (pixels)", font: { size: 25 } },
//                 tickfont: { size: 25 },
//                 autorange: true,
//             },
//         };

//         // Check for linecuts in range considering both x and y ranges
//         const hasLinecutInRange = linecuts
//             .filter(linecut => !linecut.hidden)
//             .some(linecut => isLinecutInRange(linecut, zoomedXPixelRange, zoomedYPixelRange));

//         const xAxisConfig = (zoomedXPixelRange && hasLinecutInRange)
//             ? {
//                 ...defaultRange.xaxis,
//                 range: zoomedXPixelRange,
//                 autorange: false,
//             }
//             : defaultRange.xaxis;

//         return {
//             width: dimensions.width,
//             height: dimensions.height,
//             xaxis: xAxisConfig,
//             yaxis: {
//                 title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
//                 tickfont: { size: 25 },
//                 autorange: true,
//             },
//             margin: { l: 110 },
//             legend: { font: { size: 25 } },
//             font: { size: 25 },
//             showlegend: true,
//         };
//     }, [dimensions, zoomedXPixelRange, zoomedYPixelRange, linecuts]);

//     return (
//         <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow min-h-[500px]">
//             <Plot
//                 data={plotData}
//                 layout={layout}
//                 config={{
//                     scrollZoom: true,
//                     responsive: true,
//                     displayModeBar: true,
//                     displaylogo: false,
//                     modeBarButtons: [
//                         ['pan2d', 'zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'toImage'],
//                     ],
//                     showTips: true,
//                     toImageButtonOptions: {
//                         format: 'svg',
//                         filename: 'inclined_linecut_plot',
//                         height: 1080,
//                         width: 1920,
//                         scale: 1
//                     }
//                 }}
//                 useResizeHandler
//                 style={{ width: '100%', height: '100%' }}
//             />
//         </div>
//     );
// };

// export default InclinedLinecutFig;


import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { InclinedLinecut } from '../types';

interface InclinedLinecutFigProps {
  linecuts: InclinedLinecut[];
  inclinedLinecutData1: { id: number; data: number[] }[] | undefined;
  inclinedLinecutData2: { id: number; data: number[] }[] | undefined;
  calculateQPathDistance: (qXPosition: number, qYPosition: number, angle: number, numPoints: number) => number[];
  zoomedXQRange: [number, number] | null;
  zoomedYQRange: [number, number] | null;
  units: string;
}

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

const InclinedLinecutFig: React.FC<InclinedLinecutFigProps> = ({
  linecuts,
  inclinedLinecutData1,
  inclinedLinecutData2,
  calculateQPathDistance,
  zoomedXQRange,
  zoomedYQRange,
  units
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

  // Check if a linecut is in the zoomed range
  const isLinecutInRange = useCallback((
    linecut: InclinedLinecut,
    xRange: [number, number] | null,
    yRange: [number, number] | null
  ): boolean => {
    // If either range is null, consider linecut not in range
    if (!xRange || !yRange) return false;

    // Check if linecut position is within the ranges
    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;

    return (
      linecut.qXPosition >= xMin &&
      linecut.qXPosition <= xMax &&
      linecut.qYPosition >= yMin &&
      linecut.qYPosition <= yMax
    );
  }, []);

  // Memoize plot data
  const plotData = useMemo(() => {
    return linecuts
      .filter((linecut) => !linecut.hidden)
      .flatMap((linecut) => {
        // Find corresponding data
        const data1 = inclinedLinecutData1?.find(d => d.id === linecut.id)?.data;
        const data2 = inclinedLinecutData2?.find(d => d.id === linecut.id)?.data;

        // If no data is available, skip this linecut
        if (!data1 || !data2) return [];

        // Calculate path distance in q-space for x-axis
        const pathDistance = calculateQPathDistance(
          linecut.qXPosition,
          linecut.qYPosition,
          linecut.angle,
          data1.length
        );

        // Format the position for the legend
        const positionLabel = `(q${String.fromCharCode(8339)}=${linecut.qXPosition.toFixed(2)}, q${String.fromCharCode(8340)}=${linecut.qYPosition.toFixed(2)}, θ=${linecut.angle.toFixed(0)}°)`;

        return [
          {
            x: pathDistance,
            y: data1,
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: `Left Linecut ${linecut.id} ${positionLabel}`,
            line: {
              color: linecut.leftColor,
              width: 2,
            },
            hovertemplate: `Distance: %{x:.2f} ${units}<br>Intensity: %{y:.1f}<extra></extra>`
          },
          {
            x: pathDistance,
            y: data2,
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: `Right Linecut ${linecut.id} ${positionLabel}`,
            line: {
              color: linecut.rightColor,
              width: 2,
            },
            hovertemplate: `Distance: %{x:.2f} ${units}<br>Intensity: %{y:.1f}<extra></extra>`
          },
        ];
      });
  }, [linecuts, inclinedLinecutData1, inclinedLinecutData2, calculateQPathDistance, units]);

  // Create layout for the plot
  const layout = useMemo(() => {
    // Check if any visible linecuts are in the zoomed range
    const hasLinecutInRange = linecuts
      .filter(linecut => !linecut.hidden)
      .some(linecut => isLinecutInRange(linecut, zoomedXQRange, zoomedYQRange));

    // Base x-axis configuration
    const xAxisConfig = {
      title: {
        text: `Distance Along Line (${units})`,
        font: { size: 25 }
      },
      tickfont: { size: 25 },
      autorange: true,
      // Add range if zoomed and contains linecuts
      ...(hasLinecutInRange && zoomedXQRange && {
        range: zoomedXQRange,
        autorange: false,
      })
    };

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
  }, [dimensions, zoomedXQRange, zoomedYQRange, linecuts, units, isLinecutInRange]);

  return (
    <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow min-h-[500px]">
      <Plot
        data={plotData}
        layout={layout}
        config={{
          scrollZoom: true,
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtons: [
            ['pan2d', 'zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'toImage'],
          ],
          showTips: true,
          toImageButtonOptions: {
            format: 'svg',
            filename: 'inclined_linecut_plot',
            height: 1080,
            width: 1920,
            scale: 1
          }
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default InclinedLinecutFig;
