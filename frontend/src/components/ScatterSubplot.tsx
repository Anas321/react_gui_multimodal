import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import { decode } from "@msgpack/msgpack";
import { ResolutionDataType, InclinedLinecut, Linecut } from "../types";
import { downsampleArray } from "../utils/downsampleArray";
import { handleRelayout } from '../utils/handleRelayout';
import { extractBinary, reconstructFloat32Array } from '../utils/dataProcessingScatterSubplot';
import {
  generateHorizontalLinecutOverlay,
  generateVerticalLinecutOverlay,
  generateInclinedLinecutOverlay,
} from "../utils/generateLincutsScatterSubplot";
import { getArrayMinMax } from "../utils/getArrayMinAndMax";
import { calculateDifferenceArray } from "../utils/calculateDifferenceArray";


export interface ScatterSubplotProps {
  setImageHeight: (height: number) => void;
  setImageWidth: (width: number) => void;
  setImageData1: (data: number[][]) => void;
  setImageData2: (data: number[][]) => void;
  horizontalLinecuts: Linecut[];
  verticalLinecuts: Linecut[];
  inclinedLinecuts: InclinedLinecut[];
  leftImageColorPalette: string[];
  rightImageColorPalette: string[];
  setZoomedXPixelRange: (range: [number, number] | null) => void;
  setZoomedYPixelRange: (range: [number, number] | null) => void;
  isThirdCollapsed: boolean;
  setResolutionMessage: (message: string) => void;
  isLogScale: boolean;
  lowerPercentile: number;
  upperPercentile: number;
  computeInclinedLinecutData: (
    imageData: number[][],
    xPos: number,
    yPos: number,
    angle: number,
    width: number
  ) => number[];
  setInclinedLinecutData1: (data: { id: number; data: number[] }[]) => void;
  setInclinedLinecutData2: (data: { id: number; data: number[] }[]) => void;
  normalization: string;
}


   // Calculate percentile values from data
   const calculatePercentiles = (data: number[][], lowPercentile: number, highPercentile: number): [number, number] => {
    // Filter out NaN values before calculating percentiles
    const flatData = data.flat().filter(val => !Number.isNaN(val));
    const sortedData = flatData.sort((a, b) => a - b);
    const lowIndex = Math.ceil((lowPercentile / 100) * sortedData.length);
    const highIndex = Math.floor((highPercentile / 100) * sortedData.length);
    return [sortedData[lowIndex], sortedData[highIndex]];
  };

  // Clip array to the percentile bounds
  const clipArray = (arr: number[][], minVal: number, maxVal: number) =>
    arr.map(row => row.map(val =>
      Number.isNaN(val) ? val :  // Preserve NaN values
      val < minVal ? minVal : (val > maxVal ? maxVal : val)
    ));


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
  isLogScale,
  lowerPercentile,
  upperPercentile,
  computeInclinedLinecutData,
  setInclinedLinecutData1,
  setInclinedLinecutData2,
  normalization,
}) => {
  const [plotData, setPlotData] = useState<any>(null);
  const plotContainer = useRef<HTMLDivElement>(null);
  const [currentResolution, setCurrentResolution] = useState<'low' | 'medium' | 'full'>('low');
  const [dragMode, setDragMode] = useState('zoom');
  // const [clippingLimits, setClippingLimits] = useState({ lower: 1, upper: 99 });
  const plotDataRef = useRef<any>(null);


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



  // =====================================================================================================================
  // Transform data based on log scale and clipping settings
  // =====================================================================================================================

  // Keep a reference to the latest plotData for use in other effects
  useEffect(() => {
    plotDataRef.current = plotData;
  }, [plotData]);

  // Main data transformation function that handles both log scaling and percentile clipping
  const transformData = useCallback((
    data: number[][],
    isLog: boolean,
    lowerPerc: number,
    upperPerc: number,
    normalization: string = 'none'
  ): number[][] => {
    if (!data.length) return [];

    // First apply log transform if needed
    let transformedData = data;
    if (isLog) {
      // Find the smallest positive value, excluding NaN values
      const minPositive = data.flat()
        .filter(val => !Number.isNaN(val) && val > 0)
        .reduce((min, val) => Math.min(min, val), Number.MAX_VALUE);

      // Transform data to log scale, preserving NaN values
      transformedData = data.map(row =>
        row.map(val =>
          Number.isNaN(val) ? val :  // Preserve NaN values
          val <= 0 ? Math.log10(minPositive) : Math.log10(val)
        )
      );
    }

    // After log transform, clip the data to the specified percentile range
    const [minValue, maxValue] = calculatePercentiles(transformedData, lowerPerc, upperPerc);
    transformedData = clipArray(transformedData, minValue, maxValue);

    // Apply normalization to the clipped data
    switch (normalization) {
      case 'minmax': {
        // Get min/max excluding NaN values
        const unmaskedData = transformedData.flat().filter(val => !Number.isNaN(val));
        const min = unmaskedData.reduce((min, val) => Math.min(min, val), Infinity);
        const max = unmaskedData.reduce((max, val) => Math.max(max, val), -Infinity);
        const range = max - min;

        return transformedData.map(row =>
          row.map(val =>
            Number.isNaN(val) ? 0 :  // Replace NaN values with 0
            range === 0 ? 0 : (val - min) / range
          )
        );
      }

      case 'mean': {
        // Calculate statistics excluding NaN values
        const unmaskedData = transformedData.flat().filter(val => !Number.isNaN(val));
        const mean = unmaskedData.reduce((sum, val) => sum + val, 0) / unmaskedData.length;
        const variance = unmaskedData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / unmaskedData.length;
        const std = Math.sqrt(variance);

        return transformedData.map(row =>
          row.map(val =>
            Number.isNaN(val) ? 0 :  // Replace NaN values with 0
            std === 0 ? 0 : (val - mean) / std
          )
        );
      }

      default:
        // Replace NaN values with 0
        return transformedData.map(row =>
          row.map(val => Number.isNaN(val) ? 0 : val)
        );

    }

  }, []);

  // Transform the data for the current resolution level (low, medium, or full)
  // This is used for the main plot display
  const transformedPlotData = useMemo(() => {
    if (!resolutionData[currentResolution]) return null;

    const currentData = resolutionData[currentResolution];

  // First transform both arrays
  const transformedArray1 = transformData(
    currentData.array1,
    isLogScale,
    lowerPercentile,
    upperPercentile,
    normalization
  );
  const transformedArray2 = transformData(
    currentData.array2,
    isLogScale,
    lowerPercentile,
    upperPercentile,
    normalization
  );

  // Then calculate difference using transformed data
  return {
    array1: transformedArray1,
    array2: transformedArray2,
    diff: calculateDifferenceArray(transformedArray1, transformedArray2)
  };
  }, [
    resolutionData,
    currentResolution,
    isLogScale,
    lowerPercentile,
    upperPercentile,
    normalization,
    transformData
  ]);

  // Transform the full resolution data for linecut calculations
  // This ensures linecuts are calculated using full resolution data
  const transformedLineData = useMemo(() => {
    if (!resolutionData.full) return null;

    return {
      array1: transformData(
        resolutionData.full.array1,
        isLogScale,
        lowerPercentile,
        upperPercentile,
        normalization
      ),
      array2: transformData(
        resolutionData.full.array2,
        isLogScale,
        lowerPercentile,
        upperPercentile,
        normalization
      )
    };
  }, [
    resolutionData.full,
    isLogScale,
    lowerPercentile,
    upperPercentile,
    normalization,
    transformData
  ]);

  // Calculate color scales for all three plots (array1, array2, and diff)
  const colorScales = useMemo(() => {
    if (
      !transformedPlotData ||
      !transformedPlotData.array1 ||
      !transformedPlotData.array2 ||
      !transformedPlotData.diff
    ) return null;

    // Use getArrayMinMax for min/max since data is already transformed
    const [minValue1, maxValue1] = getArrayMinMax(transformedPlotData.array1);
    const [minValue2, maxValue2] = getArrayMinMax(transformedPlotData.array2);
    const [minValueDiff, maxValueDiff] = getArrayMinMax(transformedPlotData.diff);

    // Calculate global min/max for consistent color scaling between array1 and array2
    const globalMinValue = Math.min(minValue1, minValue2);
    const globalMaxValue = Math.max(maxValue1, maxValue2);

    // Calculate maximum absolute difference for symmetric difference plot scaling
    const maxAbsDiff = Math.max(Math.abs(minValueDiff), Math.abs(maxValueDiff));

    return {
      array1: { min: minValue1, max: maxValue1 },
      array2: { min: minValue2, max: maxValue2 },
      diff: { min: -maxAbsDiff, max: maxAbsDiff },
      global: { min: globalMinValue, max: globalMaxValue },
      maxAbsDiff,
    };
  }, [transformedPlotData]);

  // Effect to update the plot with transformed data and color scales
  useEffect(() => {
    const currentPlotData = plotDataRef.current;

    if (!currentPlotData?.data || !transformedPlotData || !colorScales) return;

    // Update the data arrays and their min/max values
    const newData = currentPlotData.data.map((plotItem: any, index: number) => {
      const dataKey = index === 0 ? 'array1' : index === 1 ? 'array2' : 'diff';
      const transformedData = transformedPlotData[dataKey];
      return {
        ...plotItem,
        z: transformedData,
        zmin: colorScales[dataKey].min,
        zmax: colorScales[dataKey].max,
        nancolor: 'rgb(0,0,0)',  // Set NaN values to black
      };
    });

    // Update the color axis settings in the layout
    const newLayout = {
      ...currentPlotData.layout,
      coloraxis: currentPlotData.layout.coloraxis ? {
        ...currentPlotData.layout.coloraxis,
        cmin: colorScales.global.min,
        cmax: colorScales.global.max
      } : undefined,
      coloraxis2: currentPlotData.layout.coloraxis2 ? {
        ...currentPlotData.layout.coloraxis2,
        cmin: -colorScales.maxAbsDiff,
        cmax: colorScales.maxAbsDiff,
        cmid: 0
      } : undefined
    };

    // Check if data values or ranges have changed
    const hasDataChanged = newData.some((item: any, index: number) => {
      const oldItem = currentPlotData.data[index];
      return (
        !oldItem ||
        item.z !== oldItem.z ||
        item.zmin !== oldItem.zmin ||
        item.zmax !== oldItem.zmax
      );
    });

    // Check if color axis settings have changed
    const hasLayoutChanged =
      currentPlotData.layout.coloraxis?.cmin !== newLayout.coloraxis?.cmin ||
      currentPlotData.layout.coloraxis?.cmax !== newLayout.coloraxis?.cmax ||
      currentPlotData.layout.coloraxis2?.cmin !== newLayout.coloraxis2?.cmin ||
      currentPlotData.layout.coloraxis2?.cmax !== newLayout.coloraxis2?.cmax ||
      currentPlotData.layout.coloraxis2?.cmid !== newLayout.coloraxis2?.cmid;

    // Only update if something has changed
    if (hasDataChanged || hasLayoutChanged) {
      setPlotData(prev => ({
        ...prev,
        data: newData,
        layout: newLayout
      }));
    }
  }, [transformedPlotData, colorScales]);

  // Effect to update linecut data when transformations change
  useEffect(() => {
    if (!transformedLineData) return;

    // Update the full resolution image data
    setImageData1(transformedLineData.array1);
    setImageData2(transformedLineData.array2);

    // Recalculate all inclined linecuts using the transformed data
    const updatedData1: { id: number; data: number[] }[] = [];
    const updatedData2: { id: number; data: number[] }[] = [];

    inclinedLinecuts.forEach(linecut => {
      // Calculate linecut data for both images using transformed data
      const newData1 = computeInclinedLinecutData(
        transformedLineData.array1,
        linecut.xPosition,
        linecut.yPosition,
        linecut.angle,
        linecut.width
      );

      const newData2 = computeInclinedLinecutData(
        transformedLineData.array2,
        linecut.xPosition,
        linecut.yPosition,
        linecut.angle,
        linecut.width
      );

      updatedData1.push({ id: linecut.id, data: newData1 });
      updatedData2.push({ id: linecut.id, data: newData2 });
    });

    // Update all linecut data at once for better performance
    setInclinedLinecutData1(updatedData1);
    setInclinedLinecutData2(updatedData2);
  }, [
    transformedLineData,
    setImageData1,
    setImageData2,
    inclinedLinecuts,
    computeInclinedLinecutData,
    setInclinedLinecutData1,
    setInclinedLinecutData2,
  ]);




  // =============================================================================================================== End of Data Transformation


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
      transformData,
      isLogScale,
      lowerPercentile,
      upperPercentile,
      calculatePercentiles,
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
    transformData,
    isLogScale,
    lowerPercentile,
    upperPercentile,
  ]);

    // // Handle container resizing
    // useEffect(() => {
    //  if (!plotContainer.current) return;

    //   const resizeObserver = new ResizeObserver((entries) => {
    //     if (!plotData || !plotData.layout) return;

    //     const entry = entries[0];
    //     if (entry) {
    //       const { width, height } = entry.contentRect;
    //       setPlotData(prev => ({
    //         ...prev,
    //         layout: {
    //           ...prev.layout,
    //           width,
    //           height,
    //         },
    //       }));
    //     }
    //   });

    //   resizeObserver.observe(plotContainer.current);

    //   return () => {
    //     resizeObserver.disconnect();
    //   };
    // }, [plotData]);


  // Handle container resizing
  useEffect(() => {
    const currentContainer = plotContainer.current;
    if (!currentContainer) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      setPlotData(prev => {
        if (!prev || !prev.layout) return prev;

        // Only update if dimensions have actually changed
        if (prev.layout.width === width && prev.layout.height === height) {
          return prev;
        }

        return {
          ...prev,
          layout: {
            ...prev.layout,
            width,
            height,
          },
        };
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(currentContainer);

    return () => {
      resizeObserver.disconnect();
    };
  }, []); // Empty dependency array since we're using refs and closure



  // Initial data fetch
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/scatter-subplot")
      .then(response => response.arrayBuffer())
      .then(buffer => {
        const decoded = decode(new Uint8Array(buffer)) as any;

        // Reconstruct full resolution data
        const fullArray1 = reconstructFloat32Array(extractBinary(decoded.array_1), decoded.metadata.shape_1);
        const fullArray2 = reconstructFloat32Array(extractBinary(decoded.array_2), decoded.metadata.shape_2);
        // const fullDiff = reconstructFloat32Array(extractBinary(decoded.array_diff), decoded.metadata.shape_diff);
        const fullDiff = calculateDifferenceArray(fullArray1, fullArray2);

        // Determine factors based on image width
        const lowFactor = fullArray1[0].length > 2000 || fullArray1.length > 2000 ? 8 : 4;
        const mediumFactor = fullArray1[0].length > 2000 || fullArray1.length > 2000 ? 4 : 2;

        // // Transform the full resolution data
        // const transformedArray1 = transformData(fullArray1, isLogScale, lowerPercentile, upperPercentile);
        // const transformedArray2 = transformData(fullArray2, isLogScale, lowerPercentile, upperPercentile);
        // const transformedDiff = transformData(fullDiff, isLogScale, lowerPercentile, upperPercentile);


        // Calculate clip values (1st and 99th percentiles) for each array
        // Calculate clip values but don't set them in the coloraxis
        // In the data fetch useEffect, after calculating the percentiles:

        // const [minValue1, maxValue1] = calculatePercentiles(fullArray1, lowerPercentile, upperPercentile);
        // const [minValue2, maxValue2] = calculatePercentiles(fullArray2, lowerPercentile, upperPercentile);
        // const [minValueDiff, maxValueDiff] = calculatePercentiles(fullDiff, lowerPercentile, upperPercentile);

        const [minValue1, maxValue1] = getArrayMinMax(fullArray1);
        const [minValue2, maxValue2] = getArrayMinMax(fullArray2);
        const [minValueDiff, maxValueDiff] = getArrayMinMax(fullDiff);

        // const fullArray1Clipped = clipArray(fullArray1, minValue1, maxValue1);
        // const fullArray2Clipped = clipArray(fullArray2, minValue2, maxValue2);
        // const fullDiffClipped = clipArray(fullDiff, minValueDiff, maxValueDiff);


        // Set dimensions and full resolution data for linecuts
        setImageHeight(fullArray1.length);
        setImageWidth(fullArray1[0].length);
        setImageData1(fullArray1);
        setImageData2(fullArray2);
        // setImageData1(fullArray1Clipped);
        // setImageData2(fullArray2Clipped);
        // setImageData1(transformedArray1);
        // setImageData2(transformedArray2);

        const array1DownsampledLowRes = downsampleArray(fullArray1, lowFactor);
        const array2DownsampledLowRes = downsampleArray(fullArray2, lowFactor);
        const diffDownsampledLowRes = downsampleArray(fullDiff, lowFactor);

        const array1DownsampledMediumRes = downsampleArray(fullArray1, mediumFactor);
        const array2DownsampledMediumRes = downsampleArray(fullArray2, mediumFactor);
        const diffDownsampledMediumRes = downsampleArray(fullDiff, mediumFactor);


        // const array1DownsampledLowRes = downsampleArray(transformedArray1, lowFactor);
        // const array2DownsampledLowRes = downsampleArray(transformedArray2, lowFactor);
        // const diffDownsampledLowRes = downsampleArray(transformedDiff, lowFactor);

        // const array1DownsampledMediumRes = downsampleArray(transformedArray1, mediumFactor);
        // const array2DownsampledMediumRes = downsampleArray(transformedArray2, mediumFactor);
        // const diffDownsampledMediumRes = downsampleArray(transformedDiff, mediumFactor);


        // Update resolution data with clipped arrays for display
        setResolutionData({
          low: {
            array1: array1DownsampledLowRes,
            array2: array2DownsampledLowRes,
            diff: diffDownsampledLowRes,
            factor: lowFactor
          },
          medium: {
            array1: array1DownsampledMediumRes,
            array2: array2DownsampledMediumRes,
            diff: diffDownsampledMediumRes,
            factor: mediumFactor
          },
          full: {
            array1: fullArray1,
            array2: fullArray2,
            diff: fullDiff,
            factor: 1
          }
        });

        // Initialize plot with clipped low resolution data but full range colorbar
        const plotlyData = decoded.metadata.plotly;
        plotlyData.data[0].z = array1DownsampledLowRes;
        plotlyData.data[1].z = array2DownsampledLowRes;
        plotlyData.data[2].z = diffDownsampledLowRes;

        // // Calculate min and max values for color scales
        // const [minValue1, maxValue1] = getArrayMinMax(array1DownsampledLowRes);
        // const [minValue2, maxValue2] = getArrayMinMax(array2DownsampledLowRes);
        // const [minValueDiff, maxValueDiff] = getArrayMinMax(diffDownsampledLowRes);

        // Set the data range for display
        plotlyData.data[0].zmin = minValue1;
        plotlyData.data[0].zmax = maxValue1;
        plotlyData.data[1].zmin = minValue2;
        plotlyData.data[1].zmax = maxValue2;
        plotlyData.data[2].zmin = minValueDiff;
        plotlyData.data[2].zmax = maxValueDiff;

        const globalMinValue = Math.min(minValue1, minValue2)
        const globalMaxValue = Math.max(maxValue1, maxValue2)

        // Set the colorbar range to show full data range
        if (plotlyData.layout.coloraxis) {
          plotlyData.layout.coloraxis.cmin = globalMinValue
          plotlyData.layout.coloraxis.cmax = globalMaxValue
          // plotlyData.layout.coloraxis.colorscale = ['viridis']
          // plotlyData.layout.coloraxis.colorscale = [
          //   [0, '#440154'],    // dark purple
          //   [0.25, '#3B528B'], // blue
          //   [0.5, '#21908C'],  // cyan/green
          //   [0.99, '#5DC963'], // light green
          //   [1, '#FDE725']     // yellow
          // ];
          // plotlyData.layout.coloraxis.colorscale = [
          //   // [0, 'rgb(139,0,0)'],        // Dark red for values below 1st percentile
          //   [0.01, 'rgb(68,1,84)'],     // Start of regular viridis colorscale at 1st percentile
          //   [0.99, 'rgb(253,231,37)'],  // End of regular viridis colorscale at 99th percentile
          //   // [1, 'rgb(0,0,139)']         // Dark blue for values above 99th percentile
          // ];
        }
        if (plotlyData.layout.coloraxis2) {
          const maxAbsDiff = Math.max(Math.abs(minValueDiff), Math.abs(maxValueDiff));
          plotlyData.layout.coloraxis2.cmin = -maxAbsDiff;
          plotlyData.layout.coloraxis2.cmax = maxAbsDiff;
          plotlyData.layout.coloraxis2.cmid = 0;
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
  }, [
    setImageHeight,
    setImageWidth,
    setImageData1,
    setImageData2,
    // lowerPercentile,
    // upperPercentile,
    // transformData,
    // isLogScale
  ]);


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



  // Memoize layout options
  const layoutOptions = useMemo(() => {
    const baseLayout = {
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

    // Only add the axis configurations when in low resolution
    // This is to make sure the image does not move when the linecuts are added
    if (currentResolution === 'low' && plotData) {
      return {
        ...baseLayout,
        xaxis: {
          ...plotData.layout.xaxis,
          range: [0, resolutionData[currentResolution].array1[0]?.length || 0],
          autorange: false,
        },
        xaxis2: {
          ...plotData.layout.xaxis2,
          range: [0, resolutionData[currentResolution].array1[0]?.length || 0],
          autorange: false,
        },
        xaxis3: {
          ...plotData.layout.xaxis3,
          range: [0, resolutionData[currentResolution].array1[0]?.length || 0],
          autorange: false,
        },
        yaxis: {
          ...plotData.layout.yaxis,
          range: [resolutionData[currentResolution].array1?.length + 30 || 0, -20],
          autorange: false,
        },
        yaxis2: {
          ...plotData.layout.yaxis2,
          range: [resolutionData[currentResolution].array1?.length + 30 || 0, -20],
          autorange: false,
        },
        yaxis3: {
          ...plotData.layout.yaxis3,
          range: [resolutionData[currentResolution].array1?.length + 30 || 0, -20],
          autorange: false,
        },
      };
    }

    // Return only the base layout for medium and full resolution
    return baseLayout;
  }, [dragMode, isThirdCollapsed, plotData, resolutionData, currentResolution]);



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
        `Downsampling Factor: ${info.factor}x\u00A0\u00A0|\u00A0\u00A0Images and colorbars are clipped to ${lowerPercentile}st-${upperPercentile}th percentile`
      );
    }, [currentResolution, resolutionData, setResolutionMessage, lowerPercentile, upperPercentile]);



  return (
    <div className="relative w-full h-full">
      <div
        ref={plotContainer}
        className="w-full h-full"
        >
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
