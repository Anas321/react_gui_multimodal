import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { decode, ExtData } from "@msgpack/msgpack";
import { Linecut } from "../types";
import { downsampleArray } from "../utils/downsampleArray";

// Function to handle ExtType
function extractBinary(ext: ExtData | Uint8Array): Uint8Array {
  return ext instanceof Uint8Array ? ext : new Uint8Array(ext.data);
}

// Function to reconstruct Float32Array
function reconstructFloat32Array(buffer: Uint8Array, shape: [number, number]): number[][] {
  const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  return Array.from({ length: shape[0] }, (_, i) =>
    Array.from(float32Array.slice(i * shape[1], (i + 1) * shape[1]))
  );
}

// function calculateZminMax(array_1: number[][], array_2: number[][]): [number, number] {
//   let zmin = Infinity;
//   let zmax = -Infinity;

//   // Combine both arrays and iterate through them
//   [array_1, array_2].forEach((array) => {
//     array.forEach((row) => {
//       row.forEach((value) => {
//         if (value < zmin) zmin = value;
//         if (value > zmax) zmax = value;
//       });
//     });
//   });

//   return [zmin, zmax];
// }


interface ScatterSubplotProps {
  setImageHeight: (height: number) => void;
  setImageWidth: (width: number) => void;
  setImageData1: (data: number[][]) => void; // Full-resolution data for linecuts
  setImageData2: (data: number[][]) => void; // Full-resolution data for linecuts
  horizontalLinecuts: Linecut[];
  leftImageColorPalette: string[];
  rightImageColorPalette: string[];
  setZoomedPixelRange: (range: [number, number] | null) => void;
}

const ScatterSubplot: React.FC<ScatterSubplotProps> = React.memo(({
  setImageHeight,
  setImageWidth,
  setImageData1,
  setImageData2,
  horizontalLinecuts,
  setZoomedPixelRange,
}) => {
  const [plotData, setPlotData] = useState<any>(null);
  const plotContainer = useRef<HTMLDivElement>(null);
  const [fullResArray1, setFullResArray1] = useState<number[][]>([]);
  const [fullResArray2, setFullResArray2] = useState<number[][]>([]);
  const [fullResDiff, setFullResDiff] = useState<number[][]>([])
  const [isZooming, setIsZooming] = useState(false); // New state for zoom tracking
  const [downsampleFactor, setDownsampleFactor] = useState(1);

  const [downsampledArray1, setDownsampledArray1] = useState<number[][]>([]);
  const [downsampledArray2, setDownsampledArray2] = useState<number[][]>([]);
  const [downsampledDiff, setDownsampledDiff] = useState<number[][]>([]);

  const visibleLinecuts = horizontalLinecuts.filter((linecut) => !linecut.hidden);


  const [dragMode, setDragMode] = useState('zoom');

    // Add handler for mode changes
    const handleModeChange = (relayoutData: any) => {
      if (relayoutData.dragmode) {
        setDragMode(relayoutData.dragmode);
        // Force update the layout to maintain the dragmode
        setPlotData(prev => ({
          ...prev,
          layout: {
            ...prev.layout,
            dragmode: relayoutData.dragmode,
          }
        }));
      }
    };



  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/scatter-subplot")
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const decoded = decode(new Uint8Array(buffer)) as any;

        // Reconstruct full-resolution data
        const fullResArray1 = reconstructFloat32Array(extractBinary(decoded.array_1), decoded.metadata.shape_1);
        const fullResArray2 = reconstructFloat32Array(extractBinary(decoded.array_2), decoded.metadata.shape_2);
        const fullResDiff = reconstructFloat32Array(extractBinary(decoded.array_diff), decoded.metadata.shape_diff)

        // Downsample the arrays for visualization
        const factor = 4; // Downsample factor
        setDownsampleFactor(factor)

        const downsampledArray1 = downsampleArray(fullResArray1, factor);
        const downsampledArray2 = downsampleArray(fullResArray2, factor);
        const downsampledDiff = downsampleArray(fullResDiff, factor);

        // // Reconstruct downsampled data for visualization
        // const downsampledArray1 = reconstructFloat32Array(extractBinary(decoded.array_1_down), decoded.metadata.shape_1_down);
        // const downsampledArray2 = reconstructFloat32Array(extractBinary(decoded.array_2_down), decoded.metadata.shape_2_down);

        // Update dimensions
        const height = fullResArray1.length;
        const width = fullResArray1[0].length;

        setImageHeight(height); // Full-resolution dimensions for sliders/annotations
        setImageWidth(width);
        setImageData1(fullResArray1); // Store full-resolution for linecuts
        setImageData2(fullResArray2);

        setFullResArray1(fullResArray1);
        setFullResArray2(fullResArray2);
        setFullResDiff(fullResDiff)

        setDownsampledArray1(downsampledArray1);
        setDownsampledArray2(downsampledArray2);
        setDownsampledDiff(downsampledDiff)

        // Update plotly with downsampled data
        const plotlyData = decoded.metadata.plotly;
        plotlyData.data[0].z = downsampledArray1;
        plotlyData.data[1].z = downsampledArray2;
        plotlyData.data[2].z = downsampledDiff;

        // const [zmin, zmax] = calculateZminMax(fullResArray1, fullResArray2);


        // // Use createScatterSubplot to generate plot data and layout
        // const { data, layout } = createScatterSubplot({
        //   fullResArray1,
        //   fullResArray2,
        //   zmin,
        //   zmax,
        // });

        // setPlotData({ data, layout });
        setPlotData(plotlyData);
      })
      .catch((error) => console.error("Error fetching scatter subplot:", error));
  }, [setImageHeight, setImageWidth, setImageData1, setImageData2]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (!plotData || !plotData.layout) return;
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setPlotData((prev: any) => ({
          ...prev,
          layout: {
            ...prev.layout,
            width,
            height,
          },
        }));
      }
    });

    if (plotContainer.current) {
      resizeObserver.observe(plotContainer.current);
    }

    return () => resizeObserver.disconnect();
  }, [plotData]);

  // Generate dynamic annotations
  const generateHorizontalLinecutAnnotations = () => {
    const scale = isZooming ? 1 : downsampleFactor; // Scale down linecuts for downsampled data
    return visibleLinecuts.flatMap((linecut) => [
      {
        x: -200 / scale, // Position to the left of the left image
        y: linecut.position / scale,
        text: `${linecut.position.toFixed(1)}`, // Linecut position as text
        showarrow: false,
        font: { color: "black", size: 25 },
        xref: "x1",
        yref: "y",
        align: "left",
      },
      {
        x: -200 / scale, // Also position to the left of the right image
        y: linecut.position / scale,
        text: `${linecut.position.toFixed(1)}`,
        showarrow: false,
        font: { color: "black", size: 25 },
        xref: "x2",
        yref: "y",
        align: "left",
      },
    ]);
  };


  const handleRelayout = (relayoutData: any) => {
    const isAutoscale =
      "xaxis.autorange" in relayoutData ||
      "yaxis.autorange" in relayoutData;

    if (isAutoscale) {
      setIsZooming(false);
      setZoomedPixelRange(null);

      const height = downsampledArray1.length;
      setPlotData((prev) => ({
        ...prev,
        data: [
          { ...prev.data[0], z: downsampledArray1 },
          { ...prev.data[1], z: downsampledArray2 },
          { ...prev.data[2], z: downsampledDiff },
        ],
        layout: {
          ...prev.layout,
          xaxis: { ...prev.layout.xaxis, range: undefined, autorange: true },
          xaxis2: { ...prev.layout.xaxis2, range: undefined, autorange: true },
          xaxis3: { ...prev.layout.xaxis3, range: undefined, autorange: true },
          yaxis: { ...prev.layout.yaxis, range: [height, 0] },
          yaxis2: { ...prev.layout.yaxis2, range: [height, 0] },
          yaxis3: { ...prev.layout.yaxis3, range: [height, 0] },
        },
      }));
      return;
    }

    // Get the ranges directly from the relayout event
    const xStart = relayoutData["xaxis2.range[0]"];
    const xEnd = relayoutData["xaxis2.range[1]"];
    const yStart = relayoutData["yaxis2.range[0]"]; // This is the bottom value (larger in reversed axis)
    const yEnd = relayoutData["yaxis2.range[1]"];   // This is the top value (smaller in reversed axis)

    // Only process zoom if we have valid ranges
    if (xStart === undefined || xEnd === undefined || yStart === undefined || yEnd === undefined) {
      return;
    }

    // Declare variables outside the conditions
    let pixelXStart: number;
    let pixelXEnd: number;
    let pixelYBottom: number;
    let pixelYTop: number;

    // Convert to full resolution coordinates based on zoom state
    if (!isZooming) {
      pixelXStart = Math.floor(xStart * downsampleFactor);
      pixelXEnd = Math.ceil(xEnd * downsampleFactor);
      pixelYBottom = Math.floor(yStart * downsampleFactor);
      pixelYTop = Math.ceil(yEnd * downsampleFactor);
    } else {
      pixelXStart = Math.floor(xStart);
      pixelXEnd = Math.ceil(xEnd);
      pixelYBottom = Math.floor(yStart);
      pixelYTop = Math.ceil(yEnd);
    }

    setZoomedPixelRange([pixelXStart, pixelXEnd]);

    if (!isZooming) {
      setIsZooming(true);

      // Update the plot data with the full resolution arrays
      setPlotData((prev) => ({
        ...prev,
        data: [
          { ...prev.data[0], z: fullResArray1 },
          { ...prev.data[1], z: fullResArray2 },
          { ...prev.data[2], z: fullResDiff },
        ],
        layout: {
          ...prev.layout,
          xaxis: { ...prev.layout.xaxis, range: [pixelXStart, pixelXEnd] },
          xaxis2: { ...prev.layout.xaxis2, range: [pixelXStart, pixelXEnd] },
          xaxis3: { ...prev.layout.xaxis3, range: [pixelXStart, pixelXEnd] },
          yaxis: { ...prev.layout.yaxis, range: [pixelYBottom, pixelYTop] },
          yaxis2: { ...prev.layout.yaxis2, range: [pixelYBottom, pixelYTop] },
          yaxis3: { ...prev.layout.yaxis3, range: [pixelYBottom, pixelYTop] },
        },
      }));
    }
  };


  return (
    <div
      ref={plotContainer}
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    >
      {plotData ? (
        <Plot
          data={[
            ...plotData.data,
            // Render rectangles for the left image (x1, y1)
            ...visibleLinecuts.flatMap((linecut) => {
              const scale = isZooming ? 1 : downsampleFactor;

              const imageHeight = plotData.data[0].z.length;

              // Clamp the y-coordinates to the image boundaries
              const yTop = Math.max(0, (linecut.position - (linecut.width || 1) / 2) / scale);
              const yBottom = Math.min(imageHeight, (linecut.position + (linecut.width || 1) / 2) / scale);

              return [
                // Rectangle for the width
                {
                  x: [
                    0,
                    plotData.data[0].z[0].length,
                    plotData.data[0].z[0].length,
                    0,
                  ],
                  y: [
                    yTop,
                    yTop,
                    yBottom,
                    yBottom,
                  ],
                  mode: "lines",
                  fill: "toself",
                  fillcolor: linecut.leftColor,
                  line: { color: linecut.leftColor },
                  opacity: 0.3, // Reduced opacity for the width region
                  xaxis: "x1",
                  yaxis: "y1",
                  showlegend: false,
                },
                // Solid line at the median
                {
                  x: [0, plotData.data[0].z[0].length],
                  y: [linecut.position / scale, linecut.position / scale],
                  mode: "lines",
                  line: {
                    color: linecut.leftColor,
                    width: 2 // Make the line slightly thicker
                  },
                  opacity: 0.75, // Full opacity for the center line
                  xaxis: "x1",
                  yaxis: "y1",
                  showlegend: false,
                }
              ];
            }),
            // Render rectangles for the right image (x2, y2)
            ...visibleLinecuts.flatMap((linecut) => {
              const scale = isZooming ? 1 : downsampleFactor;
              const imageHeight = plotData.data[1].z.length;

              // Clamp the y-coordinates to the image boundaries
              const yTop = Math.max(0, (linecut.position - (linecut.width || 1) / 2) / scale);
              const yBottom = Math.min(imageHeight, (linecut.position + (linecut.width || 1) / 2) / scale);

              return [
                // Rectangle for the width
                {
                  x: [
                    0,
                    plotData.data[1].z[0].length,
                    plotData.data[1].z[0].length,
                    0,
                  ],
                  y: [
                    yTop,
                    yTop,
                    yBottom,
                    yBottom,
                  ],
                  mode: "lines",
                  fill: "toself",
                  fillcolor: linecut.rightColor,
                  line: { color: linecut.rightColor },
                  opacity: 0.3, // Reduced opacity for the width region
                  xaxis: "x2",
                  yaxis: "y2",
                  showlegend: false,
                },
                // Solid line at the median
                {
                  x: [0, plotData.data[1].z[0].length],
                  y: [linecut.position / scale, linecut.position / scale],
                  mode: "lines",
                  line: {
                    color: linecut.rightColor,
                    width: 2 // Make the line slightly thicker
                  },
                  opacity: 0.75, // Full opacity for the center line
                  xaxis: "x2",
                  yaxis: "y2",
                  showlegend: false,
                }
              ];
            }),
          ]}
          config={{
            scrollZoom: true,
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtons: [
              [
                'pan2d',  // Add pan button
                'zoom2d', // Add zoom button
                'zoomIn2d',
                'zoomOut2d',
                'autoScale2d',
                'resetScale2d',
                'toImage',
              ],
            ],
            modeBarButtonsToRemove: [], // Keep all default buttons
            showTips: true,  // Show tooltips when hovering over mode bar buttons
          }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
          onRelayout={(relayoutData) => {
            handleModeChange(relayoutData);
            handleRelayout(relayoutData);
          }}
          layout={{
            ...plotData.layout,
            dragmode: dragMode,  // Set default mode to zoom
            annotations: generateHorizontalLinecutAnnotations(),
          }}
        />
      ) : (
        <p>Loading scatter subplot...</p>
      )}
    </div>
  );
});

export default ScatterSubplot;
