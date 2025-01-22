import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import { decode, ExtData } from "@msgpack/msgpack";
import { Linecut } from "../types";
import { downsampleArray } from "../utils/downsampleArray";
import { handleRelayout } from '../utils/handleRelayout';


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

interface ResolutionDataType {
  array1: number[][];
  array2: number[][];
  diff: number[][];
  factor: number | null;
}

interface ScatterSubplotProps {
  setImageHeight: (height: number) => void;
  setImageWidth: (width: number) => void;
  setImageData1: (data: number[][]) => void;
  setImageData2: (data: number[][]) => void;
  horizontalLinecuts: Linecut[];
  verticalLinecuts: Linecut[];
  leftImageColorPalette: string[];
  rightImageColorPalette: string[];
  setZoomedXPixelRange: (range: [number, number] | null) => void;
  setZoomedYPixelRange: (range: [number, number] | null) => void;
  isThirdCollapsed: boolean;
}

const ScatterSubplot: React.FC<ScatterSubplotProps> = React.memo(({
  setImageHeight,
  setImageWidth,
  setImageData1,
  setImageData2,
  horizontalLinecuts,
  verticalLinecuts,
  setZoomedXPixelRange,
  setZoomedYPixelRange,
  isThirdCollapsed,
}) => {
  const [plotData, setPlotData] = useState<any>(null);
  const plotContainer = useRef<HTMLDivElement>(null);
  const [currentResolution, setCurrentResolution] = useState<'low' | 'medium' | 'full'>('low');
  const [dragMode, setDragMode] = useState('zoom');

  // Resolution-specific states
  const [resolutionData, setResolutionData] = useState<{
    low: ResolutionDataType;
    medium: ResolutionDataType;
    full: ResolutionDataType;
  }>({
    low: { array1: [], array2: [], diff: [], factor: null },
    medium: { array1: [], array2: [], diff: [], factor: null },
    full: { array1: [], array2: [], diff: [], factor: 1 }
  });

  // Cache for linecut calculations
  const linecutCache = useMemo(() => new Map(), []);

  // Get current resolution factor
  const getCurrentFactor = useCallback(() => {
    return resolutionData[currentResolution].factor;
  }, [currentResolution, resolutionData]);

  // Generate horizontal linecut overlay with improved annotations
  const generateHorizontalLinecutOverlay = useCallback((linecut: Linecut) => {
    if (!plotData) return [];

    const cacheKey = `${linecut.id}-${linecut.position}-${linecut.width}-${currentResolution}-${linecut.leftColor}-${linecut.rightColor}`;
    if (linecutCache.has(cacheKey)) {
      return linecutCache.get(cacheKey);
    }

    const factor = getCurrentFactor();
    const currentArray = resolutionData[currentResolution].array1;
    const imageHeight = currentArray.length;
    const imageWidth = currentArray[0]?.length || 0;

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
        line: { color: linecut.leftColor, width: 1 },
        opacity: 0.75,
        xaxis: "x1",
        yaxis: "y1",
        showlegend: false,
      },
      {
        x: [-imageWidth * 0.03],  // Position text slightly to the left of the image
        y: [scaledPosition],
        mode: "text",
        text: [`${linecut.position}`],
        textfont: { size: 25 },  // Larger text
        textposition: "middle left",
        xaxis: "x1",
        yaxis: "y1",
        showlegend: false,
      },
      // Right image overlays
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
        line: { color: linecut.rightColor, width: 1 },
        opacity: 0.75,
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      },
      {
        x: [-imageWidth * 0.03],  // Position text slightly to the left of the image
        y: [scaledPosition],
        mode: "text",
        text: [`${linecut.position}`],
        textfont: { size: 25 },  // Larger text
        textposition: "middle left",
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      }
    ];

    linecutCache.set(cacheKey, overlays);
    return overlays;
  }, [plotData, currentResolution, resolutionData, getCurrentFactor]);

  // Generate vertical linecut overlay with improved annotations
  const generateVerticalLinecutOverlay = useCallback((linecut: Linecut) => {
    if (!plotData) return [];

    const factor = getCurrentFactor();
    const currentArray = resolutionData[currentResolution].array1;
    const imageHeight = currentArray.length;
    const imageWidth = currentArray[0]?.length || 0;

    const scaledPosition = linecut.position / factor;
    const scaledWidth = (linecut.width || 1) / factor;

    const xLeft = Math.max(0, scaledPosition - scaledWidth / 2);
    const xRight = Math.min(imageWidth, scaledPosition + scaledWidth / 2);

    return [
      // Left image overlays
      {
        x: [xLeft, xRight, xRight, xLeft],
        y: [0, 0, imageHeight, imageHeight],
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
        x: [scaledPosition, scaledPosition],
        y: [0, imageHeight],
        mode: "lines",
        line: { color: linecut.leftColor, width: 1 },
        opacity: 0.75,
        xaxis: "x1",
        yaxis: "y1",
        showlegend: false,
      },
      {
        x: [scaledPosition],
        y: [imageHeight * 1.01],  // Position text slightly above the image
        mode: "text",
        text: [`${linecut.position}`],
        textfont: { size: 25 },  // Larger text
        textposition: "bottom center",
        xaxis: "x1",
        yaxis: "y1",
        showlegend: false,
      },
      // Right image overlays
      {
        x: [xLeft, xRight, xRight, xLeft],
        y: [0, 0, imageHeight, imageHeight],
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
        x: [scaledPosition, scaledPosition],
        y: [0, imageHeight],
        mode: "lines",
        line: { color: linecut.rightColor, width: 1 },
        opacity: 0.75,
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      },
      {
        x: [scaledPosition],
        y: [imageHeight * 1.01],  // Position text slightly above the image
        mode: "text",
        text: [`${linecut.position}`],
        textfont: { size: 25 },  // Larger text
        textposition: "bottom center",
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
      }
    ];
  }, [plotData, currentResolution, resolutionData, getCurrentFactor]);

  // Update the handleRelayout function in ScatterSubplot
  const relayoutHandler = useCallback((relayoutData: any) => {
    handleRelayout(relayoutData, {
      plotData,
      currentResolution,
      resolutionData,
      setCurrentResolution,
      setZoomedXPixelRange,
      setZoomedYPixelRange,
      setPlotData,
      setDragMode,
      linecutCache,
    });
  }, [
    plotData,
    currentResolution,
    resolutionData,
    setCurrentResolution,
    setZoomedXPixelRange,
    setZoomedYPixelRange,
    setPlotData,
    setDragMode,
    linecutCache,
  ]);


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

        // Set dimensions and full resolution data for linecuts
        setImageHeight(fullArray1.length);
        setImageWidth(fullArray1[0].length);
        setImageData1(fullArray1);
        setImageData2(fullArray2);

        // Determine factors based on image width
        const lowFactor = fullArray1[0].length > 2000 ? 10 : 4;
        const mediumFactor = fullArray1[0].length > 2000 ? 5 : 2;

        // Create medium and low resolution versions
        const mediumArray1 = downsampleArray(fullArray1, mediumFactor);
        const mediumArray2 = downsampleArray(fullArray2, mediumFactor);
        const mediumDiff = downsampleArray(fullDiff, mediumFactor);
        const lowArray1 = downsampleArray(fullArray1, lowFactor);
        const lowArray2 = downsampleArray(fullArray2, lowFactor);
        const lowDiff = downsampleArray(fullDiff, lowFactor);

        // Update resolution data
        setResolutionData({
          low: {
            array1: lowArray1,
            array2: lowArray2,
            diff: lowDiff,
            factor: lowFactor
          },
          medium: {
            array1: mediumArray1,
            array2: mediumArray2,
            diff: mediumDiff,
            factor: mediumFactor
          },
          full: {
            array1: fullArray1,
            array2: fullArray2,
            diff: fullDiff,
            factor: 1
          }
        });

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

  const linecutOverlays = useMemo(() => [
    // Horizontal linecut overlays
    ...horizontalLinecuts
      .filter(l => !l.hidden)
      .flatMap(generateHorizontalLinecutOverlay),
    // Vertical linecut overlays
    ...verticalLinecuts
      .filter(l => !l.hidden)
      .flatMap(generateVerticalLinecutOverlay)
  ], [
    horizontalLinecuts,
    verticalLinecuts,
    generateHorizontalLinecutOverlay,
    generateVerticalLinecutOverlay
  ]);


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
              relayoutHandler(relayoutData);
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
