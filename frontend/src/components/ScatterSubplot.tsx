import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import { decode } from "@msgpack/msgpack";
import { ResolutionDataType, ScatterSubplotProps, InclinedLinecut } from "../types";
import { downsampleArray } from "../utils/downsampleArray";
import { handleRelayout } from '../utils/handleRelayout';
import { extractBinary, reconstructFloat32Array } from '../utils/dataProcessingScatterSubplot';
import {
  generateHorizontalLinecutOverlay,
  generateVerticalLinecutOverlay,
  generateInclinedLinecutOverlay,
} from "../utils/generateLincutsScatterSubplot";


const ScatterSubplot: React.FC<ScatterSubplotProps> = React.memo(({
  setImageHeight,
  setImageWidth,
  setImageData1,
  setImageData2,
  horizontalLinecuts,
  verticalLinecuts,
  inclinedLinecuts,
  setZoomedXPixelRange,
  setZoomedYPixelRange,
  isThirdCollapsed,
  setResolutionMessage,
}) => {
  const [plotData, setPlotData] = useState<any>(null);
  const plotContainer = useRef<HTMLDivElement>(null);
  const [currentResolution, setCurrentResolution] = useState<'low' | 'medium' | 'full'>('low');
  const [dragMode, setDragMode] = useState('zoom');
  const [clippingLimits, setClippingLimits] = useState({ lower: 1, upper: 99 });


  // Calculate the actual percentile values from the data
  const calculatePercentiles = (data: number[][], lowPercentile: number, highPercentile: number): [number, number] => {
    // Flatten the 2D array to 1D
    const flatData: number[] = [];
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            flatData.push(data[i][j]);
        }
    }

    // Sort all values
    const sortedData = flatData.sort((a, b) => a - b);

    // Calculate indices for percentiles
    // For 1st percentile: we want the value below which 1% of the data falls
    // For 99th percentile: we want the value below which 99% of the data falls
    const lowIndex = Math.ceil((lowPercentile / 100) * sortedData.length);
    const highIndex = Math.floor((highPercentile / 100) * sortedData.length);

    return [sortedData[lowIndex], sortedData[highIndex]];
  };

  // Clip array to the percentile bounds
  const clipArray = (arr: number[][], minVal: number, maxVal: number) =>
    arr.map(row => row.map(val =>
        val < minVal ? minVal : (val > maxVal ? maxVal : val)
    ));



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


  // Helper function to get array stats for debugging
  const getArrayStats = (arr: number[][]) => {
    let min = arr[0][0];
    let max = arr[0][0];
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr[0].length; j++) {
        if (arr[i][j] < min) min = arr[i][j];
        if (arr[i][j] > max) max = arr[i][j];
      }
    }
    return { min, max };
  };


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
        const lowFactor = fullArray1[0].length > 2000 || fullArray1.length > 2000 ? 8 : 4;
        const mediumFactor = fullArray1[0].length > 2000 || fullArray1.length > 2000 ? 4 : 2;

        // Calculate clip values (1st and 99th percentiles) for each array
        // Calculate clip values but don't set them in the coloraxis
        // In the data fetch useEffect, after calculating the percentiles:
        const upperPercentile = clippingLimits.upper;
        const lowerPercentile = clippingLimits.lower;

        const [minValue1, maxValue1] = calculatePercentiles(fullArray1, lowerPercentile, upperPercentile);
        const [minValue2, maxValue2] = calculatePercentiles(fullArray2, lowerPercentile, upperPercentile);
        const [minValueDiff, maxValueDiff] = calculatePercentiles(fullDiff, lowerPercentile, upperPercentile);

        // Get full data ranges for the colorbars
        const stats1 = getArrayStats(fullArray1);
        const stats2 = getArrayStats(fullArray2);
        const statsDiff = getArrayStats(fullDiff);

        // Update resolution data with clipped arrays for display
        setResolutionData({
          low: {
            array1: downsampleArray(clipArray(fullArray1, minValue1, maxValue1), lowFactor),
            array2: downsampleArray(clipArray(fullArray2, minValue2, maxValue2), lowFactor),
            diff: downsampleArray(clipArray(fullDiff, minValueDiff, maxValueDiff), lowFactor),
            factor: lowFactor
          },
          medium: {
            array1: downsampleArray(clipArray(fullArray1, minValue1, maxValue1), mediumFactor),
            array2: downsampleArray(clipArray(fullArray2, minValue2, maxValue2), mediumFactor),
            diff: downsampleArray(clipArray(fullDiff, minValueDiff, maxValueDiff), mediumFactor),
            factor: mediumFactor
          },
          full: {
            // Store original data for calculations
            array1: fullArray1,
            array2: fullArray2,
            diff: fullDiff,
            factor: 1
          }
        });

        // Initialize plot with clipped low resolution data but full range colorbar
        const plotlyData = decoded.metadata.plotly;
        plotlyData.data[0].z = downsampleArray(clipArray(fullArray1, minValue1, maxValue1), lowFactor);
        plotlyData.data[1].z = downsampleArray(clipArray(fullArray2, minValue2, maxValue2), lowFactor);
        plotlyData.data[2].z = downsampleArray(clipArray(fullDiff, minValueDiff, maxValueDiff), lowFactor);

        // Set the data range for display
        plotlyData.data[0].zmin = minValue1;
        plotlyData.data[0].zmax = maxValue1;
        plotlyData.data[1].zmin = minValue2;
        plotlyData.data[1].zmax = maxValue2;
        plotlyData.data[2].zmin = minValueDiff;
        plotlyData.data[2].zmax = maxValueDiff;

        // Set the colorbar range to show full data range
        if (plotlyData.layout.coloraxis) {
          plotlyData.layout.coloraxis.cmin = Math.min(minValue1, minValue2) //Math.min(stats1.min, stats2.min);
          plotlyData.layout.coloraxis.cmax = Math.max(maxValue1, maxValue2) //Math.max(stats1.max, stats2.max);
        }
        if (plotlyData.layout.coloraxis2) {
          plotlyData.layout.coloraxis2.cmin = minValueDiff //statsDiff.min;
          plotlyData.layout.coloraxis2.cmax = maxValueDiff //statsDiff.max;
        }

        // // Create medium and low resolution versions
        // const mediumArray1 = downsampleArray(fullArray1, mediumFactor);
        // const mediumArray2 = downsampleArray(fullArray2, mediumFactor);
        // const mediumDiff = downsampleArray(fullDiff, mediumFactor);
        // const lowArray1 = downsampleArray(fullArray1, lowFactor);
        // const lowArray2 = downsampleArray(fullArray2, lowFactor);
        // const lowDiff = downsampleArray(fullDiff, lowFactor);

        // // Update resolution data
        // setResolutionData({
        //   low: {
        //     array1: lowArray1,
        //     array2: lowArray2,
        //     diff: lowDiff,
        //     factor: lowFactor
        //   },
        //   medium: {
        //     array1: mediumArray1,
        //     array2: mediumArray2,
        //     diff: mediumDiff,
        //     factor: mediumFactor
        //   },
        //   full: {
        //     array1: fullArray1,
        //     array2: fullArray2,
        //     diff: fullDiff,
        //     factor: 1
        //   }
        // });

        // // Initialize plot with low resolution data
        // const plotlyData = decoded.metadata.plotly;
        // plotlyData.data[0].z = lowArray1;
        // plotlyData.data[1].z = lowArray2;
        // plotlyData.data[2].z = lowDiff;

        setPlotData(plotlyData);

      })
      .catch(error => console.error("Error fetching scatter subplot:", error));
  }, [setImageHeight, setImageWidth, setImageData1, setImageData2, clippingLimits]);


  // Memoize plot components
  const mainPlotData = plotData?.data || [];


  const linecutOverlays = useMemo(() => {
    if (!plotData) return [];

    const factor = getCurrentFactor() || 1;
    const currentArrayData = resolutionData[currentResolution].array1;
    const imageWidth = currentArrayData[0]?.length || 0;
    const imageHeight = currentArrayData.length;

    return [
      ...(horizontalLinecuts || [])
        .filter(l => !l.hidden)
        .flatMap(linecut => generateHorizontalLinecutOverlay({
          linecut,
          currentArray: currentArrayData,
          factor: getCurrentFactor()
        })),
      ...(verticalLinecuts || [])
        .filter(l => !l.hidden)
        .flatMap(linecut => generateVerticalLinecutOverlay({
          linecut,
          currentArray: currentArrayData,
          factor: getCurrentFactor()
        })),
        // Inclined linecuts
      ...(inclinedLinecuts || [])
      .filter(l => !l.hidden)
      .flatMap(linecut => {
        // Scale positions while maintaining the angle
        const scaledLinecut: InclinedLinecut = {
          ...linecut,
          xPosition: linecut.xPosition / factor,
          yPosition: linecut.yPosition / factor,
          width: (linecut.width || 1) / factor,
          // These properties don't need scaling
          angle: linecut.angle,
          id: linecut.id,
          leftColor: linecut.leftColor,
          rightColor: linecut.rightColor,
          hidden: linecut.hidden,
          type: 'inclined'
        };

        return generateInclinedLinecutOverlay({
          linecut: scaledLinecut,
          currentArray: resolutionData[currentResolution].array1,
          factor,
          imageWidth,
          imageHeight
        });
      })
    ];
  }, [
    plotData,
    horizontalLinecuts,
    verticalLinecuts,
    inclinedLinecuts,
    resolutionData,
    currentResolution,
    getCurrentFactor
  ]);



  const layoutOptions = {
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
  };

    // Update resolution message whenever resolution changes
    useEffect(() => {
      const resInfo = {
        low: {
          factor: resolutionData.low.factor
        },
        medium: {
          factor: resolutionData.medium.factor
        },
        full: {
          factor: resolutionData.full.factor
        }
      };
      const info = resInfo[currentResolution];
      setResolutionMessage(
        `Downsampling Factor: ${info.factor}x\u00A0\u00A0|\u00A0\u00A0Images and colorbars are clipped to ${clippingLimits.lower}st-${clippingLimits.upper}th percentile`
      );
    }, [currentResolution, resolutionData, setResolutionMessage, clippingLimits]);


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
