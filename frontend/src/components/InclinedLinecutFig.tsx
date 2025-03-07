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






// import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
// import Plot from 'react-plotly.js';
// import { InclinedLinecut } from '../types';

// interface InclinedLinecutFigProps {
//   linecuts: InclinedLinecut[];
//   inclinedLinecutData1: { id: number; data: number[] }[] | undefined;
//   inclinedLinecutData2: { id: number; data: number[] }[] | undefined;
//   calculateQPathDistance: (qXPosition: number, qYPosition: number, angle: number, numPoints: number) => number[];
//   zoomedXQRange: [number, number] | null;
//   zoomedYQRange: [number, number] | null;
//   units: string;
// }

// interface Dimensions {
//   width: number | undefined;
//   height: number | undefined;
// }

// const InclinedLinecutFig: React.FC<InclinedLinecutFigProps> = ({
//   linecuts,
//   inclinedLinecutData1,
//   inclinedLinecutData2,
//   calculateQPathDistance,
//   zoomedXQRange,
//   zoomedYQRange,
//   units
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

//   // Check if a linecut is in the zoomed range
//   const isLinecutInRange = useCallback((
//     linecut: InclinedLinecut,
//     xRange: [number, number] | null,
//     yRange: [number, number] | null
//   ): boolean => {
//     // If either range is null, consider linecut not in range
//     if (!xRange || !yRange) return false;

//     // Check if linecut position is within the ranges
//     const [xMin, xMax] = xRange;
//     const [yMin, yMax] = yRange;

//     return (
//       linecut.qXPosition >= xMin &&
//       linecut.qXPosition <= xMax &&
//       linecut.qYPosition >= yMin &&
//       linecut.qYPosition <= yMax
//     );
//   }, []);

//   // Check for NaN values in the data and replace them with 0
//   const checkForNans = (data: number[]): number[] => {
//     if (!data) return [];
//     return data.map(value => isNaN(value) ? 0 : value);
//   };

//   // Memoize plot data
//   const plotData = useMemo(() => {
//     return linecuts
//       .filter((linecut) => !linecut.hidden)
//       .flatMap((linecut) => {
//         // Find corresponding data
//         let data1 = inclinedLinecutData1?.find(d => d.id === linecut.id)?.data;
//         let data2 = inclinedLinecutData2?.find(d => d.id === linecut.id)?.data;

//         // If no data is available, skip this linecut
//         if (!data1 || !data2) return [];

//         data1 = checkForNans(data1);
//         data2 = checkForNans(data2);

//         // Calculate path distance in q-space for x-axis
//         const pathDistance = calculateQPathDistance(
//           linecut.qXPosition,
//           linecut.qYPosition,
//           linecut.angle,
//           data1.length
//         );

//         // Format the position for the legend
//         const positionLabel = `(q<sub>x</sub>=${linecut.qXPosition.toFixed(1)}, q<sub>y</sub>=${linecut.qYPosition.toFixed(1)}, θ=${linecut.angle.toFixed(0)}°)`;

//         return [
//           {
//             x: pathDistance,
//             y: data1,
//             type: 'scatter' as const,
//             mode: 'lines' as const,
//             name: `Left Linecut ${linecut.id} ${positionLabel}`,
//             line: {
//               color: linecut.leftColor,
//               width: 2,
//             },
//             hovertemplate: `Distance: %{x:.2f} ${units}<br>Intensity: %{y:.1f}<extra></extra>`
//           },
//           {
//             x: pathDistance,
//             y: data2,
//             type: 'scatter' as const,
//             mode: 'lines' as const,
//             name: `Right Linecut ${linecut.id} ${positionLabel}`,
//             line: {
//               color: linecut.rightColor,
//               width: 2,
//             },
//             hovertemplate: `Distance: %{x:.2f} ${units}<br>Intensity: %{y:.1f}<extra></extra>`
//           },
//         ];
//       });
//   }, [linecuts, inclinedLinecutData1, inclinedLinecutData2, calculateQPathDistance, units]);

//   // Create layout for the plot
//   const layout = useMemo(() => {
//     // Check if any visible linecuts are in the zoomed range
//     const hasLinecutInRange = linecuts
//       .filter(linecut => !linecut.hidden)
//       .some(linecut => isLinecutInRange(linecut, zoomedXQRange, zoomedYQRange));

//     // Base x-axis configuration
//     const xAxisConfig = {
//       title: {
//         text: `Distance Along Line (${units})`,
//         font: { size: 25 }
//       },
//       tickfont: { size: 25 },
//       autorange: true,
//       // Add range if zoomed and contains linecuts
//       ...(hasLinecutInRange && zoomedXQRange && {
//         range: zoomedXQRange,
//         autorange: false,
//       })
//     };

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
//   }, [dimensions, zoomedXQRange, zoomedYQRange, linecuts, units, isLinecutInRange]);

//   return (
//     <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow min-h-[500px]">
//       <Plot
//         data={plotData}
//         layout={layout}
//         config={{
//           scrollZoom: true,
//           responsive: true,
//           displayModeBar: true,
//           displaylogo: false,
//           modeBarButtons: [
//             ['pan2d', 'zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'toImage'],
//           ],
//           showTips: true,
//           toImageButtonOptions: {
//             format: 'svg',
//             filename: 'inclined_linecut_plot',
//             height: 1080,
//             width: 1920,
//             scale: 1
//           }
//         }}
//         useResizeHandler
//         style={{ width: '100%', height: '100%' }}
//       />
//     </div>
//   );
// };

// export default InclinedLinecutFig;





import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { InclinedLinecut } from '../types';
import { calculateInclinedLineEndpoints } from '../utils/calculateInclinedLinecutEndpoints';

interface InclinedLinecutFigProps {
  linecuts: InclinedLinecut[];
  inclinedLinecutData1: { id: number; data: number[] }[] | undefined;
  inclinedLinecutData2: { id: number; data: number[] }[] | undefined;
  beamCenterX: number;
  beamCenterY: number;
  zoomedXQRange: [number, number] | null;
  qXVector: number[];
  qYVector: number[];
  units: string;
}

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

const InclinedLinecutFig: React.FC<InclinedLinecutFigProps> = ({
  linecuts = [],
  inclinedLinecutData1 = [],
  inclinedLinecutData2 = [],
  beamCenterX,
  beamCenterY,
  zoomedXQRange,
  qXVector = [],
  qYVector = [],
  units = 'nm⁻¹'
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

  // Find the beam center pixel coordinates
  const getBeamCenterPixel = useCallback(() => {
    // Find closest indices to beam center q values
    let beamX = 0;
    let beamY = 0;

    if (qXVector && qXVector.length > 0) {
      let minDiffX = Math.abs(qXVector[0] - beamCenterX);
      for (let i = 1; i < qXVector.length; i++) {
        const diff = Math.abs(qXVector[i] - beamCenterX);
        if (diff < minDiffX) {
          minDiffX = diff;
          beamX = i;
        }
      }
    }

    if (qYVector && qYVector.length > 0) {
      let minDiffY = Math.abs(qYVector[0] - beamCenterY);
      for (let i = 1; i < qYVector.length; i++) {
        const diff = Math.abs(qYVector[i] - beamCenterY);
        if (diff < minDiffY) {
          minDiffY = diff;
          beamY = i;
        }
      }
    }

    return [beamX, beamY];
  }, [beamCenterX, beamCenterY, qXVector, qYVector]);

  // Calculate radial q-values from beam center
  const calculateRadialQValues = useCallback((linecut, dataLength) => {
    if (!qXVector || !qYVector || qXVector.length === 0 || qYVector.length === 0 || !dataLength) {
      return Array(dataLength).fill(0).map((_, i) => (i - Math.floor(dataLength / 2)) * 0.01);
    }

    // Use the image dimensions from the q-vectors
    const pixelWidth = qXVector.length;
    const pixelHeight = qYVector.length;

    try {
      // Get beam center in pixel coordinates
      const [beamPixelX, beamPixelY] = getBeamCenterPixel();

      // Create a linecut object that passes through the beam center
      const beamCenterLinecut: InclinedLinecut = {
        ...linecut,
        xPosition: beamPixelX,
        yPosition: beamPixelY
      };

      // Calculate endpoints using the existing function
      const endpoints = calculateInclinedLineEndpoints({
        linecut: beamCenterLinecut,
        imageWidth: pixelWidth,
        imageHeight: pixelHeight,
        beam_center_x,
      });

      if (!endpoints) {
        throw new Error("Failed to calculate endpoints");
      }

      const { x0, y0, x1, y1 } = endpoints;

      // Calculate total line length
      const dx = x1 - x0;
      const dy = y1 - y0;
      const pixelLength = Math.sqrt(dx * dx + dy * dy);

      // Calculate the step size for even sampling
      const stepSize = pixelLength / (dataLength - 1);

      // Create array for q-values
      const qValues = new Array(dataLength);

      // Calculate direction vector
      const angleRad = (linecut.angle * Math.PI) / 180;
      const dirX = Math.cos(angleRad);
      const dirY = -Math.sin(angleRad);

      // For each point along the line
      for (let i = 0; i < dataLength; i++) {
        // Calculate position along the line in pixel space
        // Start from one endpoint and move toward the other
        const t = i * stepSize / pixelLength;
        const pixelX = Math.round(x0 + t * dx);
        const pixelY = Math.round(y0 + t * dy);

        // Ensure pixel coordinates are within bounds
        const validX = Math.min(Math.max(0, pixelX), pixelWidth - 1);
        const validY = Math.min(Math.max(0, pixelY), pixelHeight - 1);

        // Convert pixel coordinates to q-values
        const qX = qXVector[validX];
        const qY = qYVector[validY];

        // Calculate q distance from beam center (magnitude of q vector)
        const dqX = qX - beamCenterX;
        const dqY = qY - beamCenterY;
        const qMagnitude = Math.sqrt(dqX * dqX + dqY * dqY);

        // Determine sign based on which side of beam center we're on
        const dotProduct = dqX * dirX + dqY * dirY;
        const sign = Math.sign(dotProduct);

        // Store signed q value (negative = left of beam center, positive = right)
        qValues[i] = sign * qMagnitude;
      }

      return qValues;
    } catch (error) {
      console.error("Error calculating radial Q values:", error);
      // Return fallback array centered at 0
      return Array(dataLength).fill(0).map((_, i) => (i - Math.floor(dataLength / 2)) * 0.01);
    }
  }, [qXVector, qYVector, getBeamCenterPixel, beamCenterX, beamCenterY]);

  // Check for NaN values in the data and replace them with 0
  const checkForNans = (data: number[]): number[] => {
    if (!data) return [];
    return data.map(value => isNaN(value) ? 0 : value);
  };

  // Memoize plot data
  const plotData = useMemo(() => {
    return (linecuts || [])
      .filter((linecut) => linecut && !linecut.hidden)
      .flatMap((linecut) => {
        // Find corresponding data
        const data1Item = (inclinedLinecutData1 || []).find(d => d && d.id === linecut.id);
        const data2Item = (inclinedLinecutData2 || []).find(d => d && d.id === linecut.id);

        let data1 = data1Item?.data || [];
        let data2 = data2Item?.data || [];

        // If no data is available, skip this linecut
        if (!data1.length || !data2.length) return [];

        // Process any NaN values
        data1 = checkForNans(data1);
        data2 = checkForNans(data2);

        // Calculate radial q values for this linecut
        const radialQ = calculateRadialQValues(linecut, data1.length);

        // Format for the legend
        const angleLabel = `θ=${linecut.angle?.toFixed(0) ?? 0}°`;

        return [
          {
            x: radialQ,
            y: data1,
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: `Left Linecut ${linecut.id} (${angleLabel})`,
            line: {
              color: linecut.leftColor || '#ff0000',
              width: 2,
            },
            hovertemplate: `q: %{x:.2f} ${units}<br>Intensity: %{y:.1f}<extra></extra>`
          },
          {
            x: radialQ,
            y: data2,
            type: 'scatter' as const,
            mode: 'lines' as const,
            name: `Right Linecut ${linecut.id} (${angleLabel})`,
            line: {
              color: linecut.rightColor || '#0000ff',
              width: 2,
            },
            hovertemplate: `q: %{x:.2f} ${units}<br>Intensity: %{y:.1f}<extra></extra>`
          },
        ];
      });
  }, [linecuts, inclinedLinecutData1, inclinedLinecutData2, calculateRadialQValues, units]);

  // Create layout for the plot
  const layout = useMemo(() => {
    return {
      width: dimensions.width,
      height: dimensions.height,
      xaxis: {
        title: {
          text: `Radial q (${units})`,
          font: { size: 25 }
        },
        tickfont: { size: 25 },
        autorange: true,
        // Zero line to highlight the beam center position
        zeroline: true,
        zerolinewidth: 2,
        zerolinecolor: 'rgba(0,0,0,0.5)',
        // Add range if zoomed
        ...(zoomedXQRange && {
          range: zoomedXQRange,
          autorange: false,
        })
      },
      yaxis: {
        title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
        tickfont: { size: 25 },
        autorange: true,
      },
      margin: { l: 110 },
      legend: { font: { size: 25 } },
      font: { size: 25 },
      showlegend: true,
      annotations: [
        {
          x: 0,
          y: 1.1, // Position above the plot
          xref: 'x',
          yref: 'paper',
          text: 'Beam Center',
          showarrow: true,
          arrowhead: 2,
          arrowsize: 1,
          arrowwidth: 2,
          arrowcolor: 'rgba(0,0,0,0.5)',
          ax: 0,
          ay: -30
        }
      ]
    };
  }, [dimensions, zoomedXQRange, units]);

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
