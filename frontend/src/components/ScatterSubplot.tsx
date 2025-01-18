import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
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

interface ScatterSubplotProps {
  setImageHeight: (height: number) => void;
  setImageWidth: (width: number) => void;
  setImageData1: (data: number[][]) => void;
  setImageData2: (data: number[][]) => void;
  horizontalLinecuts: Linecut[];
  leftImageColorPalette: string[];
  rightImageColorPalette: string[];
  setZoomedPixelRange: (range: [number, number] | null) => void;
  isThirdCollapsed: boolean;
}

const ScatterSubplot: React.FC<ScatterSubplotProps> = React.memo(({
  setImageHeight,
  setImageWidth,
  setImageData1,
  setImageData2,
  horizontalLinecuts,
  setZoomedPixelRange,
  isThirdCollapsed,
}) => {
  const [plotData, setPlotData] = useState<any>(null);
  const plotContainer = useRef<HTMLDivElement>(null);
  const [currentResolution, setCurrentResolution] = useState<'low' | 'medium' | 'full'>('low');
  const [dragMode, setDragMode] = useState('zoom');

  // Resolution-specific states
  const [resolutionData, setResolutionData] = useState({
    low: { array1: [], array2: [], diff: [], factor: 4 },
    medium: { array1: [], array2: [], diff: [], factor: 2 },
    full: { array1: [], array2: [], diff: [], factor: 1 }
  });

  // Cache for linecut calculations
  const linecutCache = useMemo(() => new Map(), []);

  // Get current resolution factor
  const getCurrentFactor = useCallback(() => {
    return resolutionData[currentResolution].factor;
  }, [currentResolution, resolutionData]);

  // Generate linecut overlay with proper scaling
  const generateLinecutOverlay = useCallback((linecut: Linecut) => {
    if (!plotData) return [];

    const cacheKey = `${linecut.id}-${linecut.position}-${linecut.width}-${currentResolution}`;
    if (linecutCache.has(cacheKey)) {
      return linecutCache.get(cacheKey);
    }

    const factor = getCurrentFactor();
    const currentArray = resolutionData[currentResolution].array1;
    const imageHeight = currentArray.length;
    const imageWidth = currentArray[0]?.length || 0;

    // Scale linecut position and width based on current resolution
    const scaledPosition = linecut.position / factor;
    const scaledWidth = (linecut.width || 1) / factor;

    const yTop = Math.max(0, scaledPosition - scaledWidth / 2);
    const yBottom = Math.min(imageHeight, scaledPosition + scaledWidth / 2);

    const overlays = [
      // Left image overlays
      {
        x: [0, imageWidth, imageWidth, 0],
        y: [yTop, yTop, yBottom, yBottom],
        mode: "lines",
        fill: "toself",
        fillcolor: linecut.leftColor,
        line: { color: linecut.leftColor },
        opacity: 0.3,
        xaxis: "x1",
        yaxis: "y1",
        showlegend: false,
      },
      {
        x: [0, imageWidth],
        y: [scaledPosition, scaledPosition],
        mode: "lines",
        line: { color: linecut.leftColor, width: 2 },
        opacity: 0.75,
        xaxis: "x1",
        yaxis: "y1",
        showlegend: false,
      },
      // Right image overlays (similar to left)
      {
        x: [0, imageWidth, imageWidth, 0],
        y: [yTop, yTop, yBottom, yBottom],
        mode: "lines",
        fill: "toself",
        fillcolor: linecut.rightColor,
        line: { color: linecut.rightColor },
        opacity: 0.3,
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      },
      {
        x: [0, imageWidth],
        y: [scaledPosition, scaledPosition],
        mode: "lines",
        line: { color: linecut.rightColor, width: 2 },
        opacity: 0.75,
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      }
    ];

    linecutCache.set(cacheKey, overlays);
    return overlays;
  }, [plotData, currentResolution, resolutionData, getCurrentFactor]);

  // Update the handleRelayout function in ScatterSubplot
const handleRelayout = useCallback((relayoutData: any) => {
  if (!plotData) return;

  // Update dragmode if changed
  if (relayoutData.dragmode) {
    setDragMode(relayoutData.dragmode);
  }

  // Handle auto-scale
  if ("xaxis.autorange" in relayoutData || "yaxis.autorange" in relayoutData) {
    setCurrentResolution('low');
    setZoomedPixelRange(null);
    const height = resolutionData.low.array1.length;

    setPlotData(prev => ({
      ...prev,
      data: [
        { ...prev.data[0], z: resolutionData.low.array1 },
        { ...prev.data[1], z: resolutionData.low.array2 },
        { ...prev.data[2], z: resolutionData.low.diff },
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

  // Extract ranges - check for both zoom and pan events
  const xStart = relayoutData["xaxis2.range[0]"] ?? relayoutData["xaxis2.range.0"];
  const xEnd = relayoutData["xaxis2.range[1]"] ?? relayoutData["xaxis2.range.1"];
  const yStart = relayoutData["yaxis2.range[0]"] ?? relayoutData["yaxis2.range.0"];
  const yEnd = relayoutData["yaxis2.range[1]"] ?? relayoutData["yaxis2.range.1"];

  if ([xStart, xEnd, yStart, yEnd].some(v => v === undefined)) return;

  // Get the current resolution factor
  const factor = resolutionData[currentResolution].factor;

  // Update the zoomed pixel range for both zoom and pan
  const scaledXStart = Math.floor(xStart * factor);
  const scaledXEnd = Math.ceil(xEnd * factor);
  setZoomedPixelRange([scaledXStart, scaledXEnd]);

  // Determine new resolution based on zoom level
  const currentWidth = resolutionData[currentResolution].array1[0]?.length || 1;
  const currentHeight = resolutionData[currentResolution].array1.length || 1;
  const zoomWidth = Math.abs(xEnd - xStart);
  const zoomHeight = Math.abs(yEnd - yStart);

  const widthRatio = (zoomWidth / currentWidth) * 100;
  const heightRatio = (zoomHeight / currentHeight) * 100;

  let newResolution: 'low' | 'medium' | 'full';
  if (widthRatio >= 50 || heightRatio >= 50) {
    newResolution = 'low';
  } else if (widthRatio >= 20 || heightRatio >= 20) {
    newResolution = 'medium';
  } else {
    newResolution = 'full';
  }

  // Update resolution and ranges if resolution changes
  if (newResolution !== currentResolution) {
    const oldFactor = resolutionData[currentResolution].factor;
    const newFactor = resolutionData[newResolution].factor;
    const scaleFactor = oldFactor / newFactor;

    const newXStart = xStart * scaleFactor;
    const newXEnd = xEnd * scaleFactor;
    const newYStart = yStart * scaleFactor;
    const newYEnd = yEnd * scaleFactor;

    setCurrentResolution(newResolution);

    // Update plot with new resolution data
    setPlotData(prev => ({
      ...prev,
      data: [
        { ...prev.data[0], z: resolutionData[newResolution].array1 },
        { ...prev.data[1], z: resolutionData[newResolution].array2 },
        { ...prev.data[2], z: resolutionData[newResolution].diff },
      ],
      layout: {
        ...prev.layout,
        xaxis: { ...prev.layout.xaxis, range: [newXStart, newXEnd] },
        xaxis2: { ...prev.layout.xaxis2, range: [newXStart, newXEnd] },
        xaxis3: { ...prev.layout.xaxis3, range: [newXStart, newXEnd] },
        yaxis: { ...prev.layout.yaxis, range: [newYStart, newYEnd] },
        yaxis2: { ...prev.layout.yaxis2, range: [newYStart, newYEnd] },
        yaxis3: { ...prev.layout.yaxis3, range: [newYStart, newYEnd] },
      },
    }));

    // Clear linecut cache when resolution changes
    linecutCache.clear();
  } else {
    // Update the plot ranges for pan events without changing resolution
    setPlotData(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        xaxis: { ...prev.layout.xaxis, range: [xStart, xEnd] },
        xaxis2: { ...prev.layout.xaxis2, range: [xStart, xEnd] },
        xaxis3: { ...prev.layout.xaxis3, range: [xStart, xEnd] },
        yaxis: { ...prev.layout.yaxis, range: [yStart, yEnd] },
        yaxis2: { ...prev.layout.yaxis2, range: [yStart, yEnd] },
        yaxis3: { ...prev.layout.yaxis3, range: [yStart, yEnd] },
      },
    }));
  }
}, [plotData, currentResolution, resolutionData, setZoomedPixelRange]);

  // Handle container resizing
  useEffect(() => {
    if (!plotContainer.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!plotData || !plotData.layout) return;

      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setPlotData(prev => ({
          ...prev,
          layout: {
            ...prev.layout,
            width,
            height,
          },
        }));
      }
    });

    resizeObserver.observe(plotContainer.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [plotData]);

  // Initial data fetch
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/scatter-subplot")
      .then(response => response.arrayBuffer())
      .then(buffer => {
        const decoded = decode(new Uint8Array(buffer)) as any;

        // Reconstruct full resolution data
        const fullArray1 = reconstructFloat32Array(extractBinary(decoded.array_1), decoded.metadata.shape_1);
        const fullArray2 = reconstructFloat32Array(extractBinary(decoded.array_2), decoded.metadata.shape_2);
        const fullDiff = reconstructFloat32Array(extractBinary(decoded.array_diff), decoded.metadata.shape_diff);

        // Create medium and low resolution versions
        const mediumArray1 = downsampleArray(fullArray1, 2);
        const mediumArray2 = downsampleArray(fullArray2, 2);
        const mediumDiff = downsampleArray(fullDiff, 2);
        const lowArray1 = downsampleArray(fullArray1, 4);
        const lowArray2 = downsampleArray(fullArray2, 4);
        const lowDiff = downsampleArray(fullDiff, 4);

        // Update resolution data
        setResolutionData({
          low: { array1: lowArray1, array2: lowArray2, diff: lowDiff, factor: 4 },
          medium: { array1: mediumArray1, array2: mediumArray2, diff: mediumDiff, factor: 2 },
          full: { array1: fullArray1, array2: fullArray2, diff: fullDiff, factor: 1 }
        });

        // Set dimensions and full resolution data for linecuts
        setImageHeight(fullArray1.length);
        setImageWidth(fullArray1[0].length);
        setImageData1(fullArray1);
        setImageData2(fullArray2);

        // Initialize plot with low resolution data
        const plotlyData = decoded.metadata.plotly;
        plotlyData.data[0].z = lowArray1;
        plotlyData.data[1].z = lowArray2;
        plotlyData.data[2].z = lowDiff;
        setPlotData(plotlyData);
      })
      .catch(error => console.error("Error fetching scatter subplot:", error));
  }, [setImageHeight, setImageWidth, setImageData1, setImageData2]);

  // Memoize plot components
  const mainPlotData = useMemo(() => plotData?.data || [], [plotData?.data]);
  const linecutOverlays = useMemo(() =>
    horizontalLinecuts.filter(l => !l.hidden).flatMap(generateLinecutOverlay),
    [horizontalLinecuts, generateLinecutOverlay]
  );
  const layoutOptions = useMemo(() => ({
    dragmode: dragMode,
    coloraxis: {
      ...plotData?.layout.coloraxis,
      colorbar: {
        ...plotData?.layout.coloraxis?.colorbar,
        len: isThirdCollapsed ? 1.0 : 0.53,
      }
    },
    coloraxis2: {
      ...plotData?.layout.coloraxis2,
      colorbar: {
        ...plotData?.layout.coloraxis2?.colorbar,
        len: isThirdCollapsed ? 1.0 : 0.53,
      }
    },
  }), [dragMode, isThirdCollapsed, plotData?.layout]);

  // Resolution message helper
  const getResolutionMessage = () => {
    const resInfo = {
      low: {
        desc: 'Low Resolution (> 50% of image visible)',
        factor: resolutionData.low.factor
      },
      medium: {
        desc: 'Medium Resolution (20-50% of image visible)',
        factor: resolutionData.medium.factor
      },
      full: {
        desc: 'Full Resolution (< 20% of image visible)',
        factor: resolutionData.full.factor
      }
    };
    const info = resInfo[currentResolution];
    return `${info.desc} - Downsampling Factor: ${info.factor}x`;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={plotContainer} className="w-full h-full">
        {plotData ? (
          <Plot
            data={[...mainPlotData, ...linecutOverlays]}
            layout={{
              ...plotData.layout,
              ...layoutOptions,
            }}
            config={{
              scrollZoom: true,
              responsive: true,
              displayModeBar: true,
              displaylogo: false,
              modeBarButtons: [
                ['pan2d', 'zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d', 'toImage'],
              ],
              showTips: true,
            }}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
            onRelayout={(relayoutData) => {
              if (relayoutData.dragmode) {
                setDragMode(relayoutData.dragmode);
              }
              handleRelayout(relayoutData);
            }}
          />
        ) : (
          <p>Loading scatter subplot...</p>
        )}
        {isThirdCollapsed && (
          <>
            <div className="absolute top-1/2 left-[31%] -translate-y-1/2 text-5xl font-bold">−</div>
            <div className="absolute top-1/2 left-[67%] -translate-y-1/2 text-5xl font-bold">=</div>
          </>
        )}
      </div>
      <div className="bg-gray-100 p-2 text-center text-gray-700 border-t border-gray-200 font-medium text-lg">
      Current Display: {getResolutionMessage()}
      </div>
    </div>
  );
});

export default ScatterSubplot;
