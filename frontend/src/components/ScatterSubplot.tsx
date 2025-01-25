import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import { decode } from "@msgpack/msgpack";
import { ResolutionDataType, ScatterSubplotProps } from "../types";
import { downsampleArray } from "../utils/downsampleArray";
import { handleRelayout } from '../utils/handleRelayout';
import { extractBinary, reconstructFloat32Array } from '../utils/dataProcessingScatterSubplot';
import { generateHorizontalLinecutOverlay, generateVerticalLinecutOverlay } from "../utils/generateLincutsScatterSubplot";


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
  setResolutionMessage,
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


  // Get current resolution factor
  const getCurrentFactor = useCallback(() => {
    return resolutionData[currentResolution].factor;
  }, [currentResolution, resolutionData]);


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
        const mediumFactor = fullArray1[0].length > 2000 ? 4 : 2;

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


  const linecutOverlays = useMemo(() => {
    if (!plotData) return [];

    return [
      // Horizontal linecut overlays
      ...horizontalLinecuts
        .filter(l => !l.hidden)
        .flatMap(linecut => generateHorizontalLinecutOverlay({
          linecut,
          currentArray: resolutionData[currentResolution].array1,
          factor: getCurrentFactor()
        })),
      // Vertical linecut overlays
      ...verticalLinecuts
        .filter(l => !l.hidden)
        .flatMap(linecut => generateVerticalLinecutOverlay({
          linecut,
          currentArray: resolutionData[currentResolution].array1,
          factor: getCurrentFactor()
        }))
    ];
  }, [
    plotData,
    horizontalLinecuts,
    verticalLinecuts,
    resolutionData,
    currentResolution,
    getCurrentFactor
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


    // Update resolution message whenever resolution changes
    useEffect(() => {
      const resInfo = {
        low: {
          desc: 'Low Resolution (Full image or > 50% of the image is visible)',
          factor: resolutionData.low.factor
        },
        medium: {
          desc: 'Medium Resolution (20-50% of the image is visible)',
          factor: resolutionData.medium.factor
        },
        full: {
          desc: 'Full Resolution (< 20% of the image is visible)',
          factor: resolutionData.full.factor
        }
      };
      const info = resInfo[currentResolution];
      setResolutionMessage(`Current Display: ${info.desc} - Downsampling Factor: ${info.factor}x`);
    }, [currentResolution, resolutionData, setResolutionMessage]);



  return (
    <div className="relative w-full h-full">
      <div ref={plotContainer} className="w-full h-full">
        {plotData ? (
          <Plot
            data={[...mainPlotData, ...linecutOverlays]}
            layout={{
              ...plotData.layout,
              ...layoutOptions,
              supressplotly: true,
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
            useResizeHandler={false}  // Disable Plotly's built-in resize handler
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
    </div>
  );
});

export default ScatterSubplot;
