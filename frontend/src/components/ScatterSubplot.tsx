import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import { decode } from "@msgpack/msgpack";
import {
  ResolutionDataType,
  InclinedLinecut,
  Linecut,
  AzimuthalIntegration,
  AzimuthalData,
  CalibrationParams,
} from "../types";
import { downsampleArray } from "../utils/downsampleArray";
import { handleRelayout } from '../utils/handleRelayout';
import { extractBinary, reconstructFloat32Array } from '../utils/dataProcessingScatterSubplot';
import {
  generateHorizontalLinecutOverlay,
  generateVerticalLinecutOverlay,
  generateInclinedLinecutOverlay,
} from "../utils/generateLincutsScatterSubplot";
import { generateAzimuthalOverlay } from "../utils/generateAzimuthalOverlay";
import { getArrayMinMax } from "../utils/getArrayMinAndMax";
import { calculateDifferenceArray } from "../utils/calculateDifferenceArray";


interface ScatterSubplotProps {
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
  // computeInclinedLinecutData: (
  //   imageData: number[][],
  //   xPos: number,
  //   yPos: number,
  //   angle: number,
  //   width: number
  // ) => number[];
  // setInclinedLinecutData1: (data: { id: number; data: number[] }[]) => void;
  // setInclinedLinecutData2: (data: { id: number; data: number[] }[]) => void;
  normalization: string;
  imageColormap: string;
  differenceColormap: string;
  normalizationMode: string;
  azimuthalIntegrations: AzimuthalIntegration[];  // List of active integrations
  azimuthalData1: AzimuthalData[];               // Integration data for first image
  azimuthalData2: AzimuthalData[];               // Integration data for second image
  maxQValue: number;
  calibrationParams: CalibrationParams;
  qYVector: number[]; // qYVector for q-value mapping
  qXVector: number[]; // qXVector for q-value mapping
  units: string;
  inclinedLinecutData1: { id: number; data: number[] }[];
  inclinedLinecutData2: { id: number; data: number[] }[];
}


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
  // computeInclinedLinecutData,
  // setInclinedLinecutData1,
  // setInclinedLinecutData2,
  normalization,
  imageColormap,
  differenceColormap,
  normalizationMode,
  azimuthalIntegrations,
  azimuthalData1,
  azimuthalData2,
  maxQValue,
  calibrationParams,
  qYVector,
  qXVector,
  units,
  inclinedLinecutData1,
  inclinedLinecutData2,
}) => {
  const [plotData, setPlotData] = useState<any>(null);
  const plotContainer = useRef<HTMLDivElement>(null);
  const [currentResolution, setCurrentResolution] = useState<'low' | 'medium' | 'full'>('low');
  const [dragMode, setDragMode] = useState('zoom');
  // const [clippingLimits, setClippingLimits] = useState({ lower: 1, upper: 99 });
  const plotDataRef = useRef<any>(null);
  // const [isTransformingData, setIsTransformingData] = useState(false);


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

  const calculateGlobalPercentiles = (
    data1: number[][],
    data2: number[][],
    lowPercentile: number,
    highPercentile: number
  ): [number, number] => {
    // Calculate total length first
    let totalLength = 0;
    for (let i = 0; i < data1.length; i++) {
      for (let j = 0; j < data1[i].length; j++) {
        if (!Number.isNaN(data1[i][j])) totalLength++;
      }
    }
    for (let i = 0; i < data2.length; i++) {
      for (let j = 0; j < data2[i].length; j++) {
        if (!Number.isNaN(data2[i][j])) totalLength++;
      }
    }

    // Pre-allocate array
    const values = new Float32Array(totalLength);
    let idx = 0;

    // Fill array with non-NaN values
    for (let i = 0; i < data1.length; i++) {
      for (let j = 0; j < data1[i].length; j++) {
        if (!Number.isNaN(data1[i][j])) {
          values[idx++] = data1[i][j];
        }
      }
    }
    for (let i = 0; i < data2.length; i++) {
      for (let j = 0; j < data2[i].length; j++) {
        if (!Number.isNaN(data2[i][j])) {
          values[idx++] = data2[i][j];
        }
      }
    }

    // Sort the values
    values.sort();

    // Calculate percentile indices
    const lowIndex = Math.ceil((lowPercentile / 100) * totalLength);
    const highIndex = Math.floor((highPercentile / 100) * totalLength);

    return [values[lowIndex], values[highIndex]];
  };

  const calculateMinMax = (data1: number[][], data2: number[][]) => {
    let min = Infinity;
    let max = -Infinity;

    // Calculate min and max across both arrays
    for (let i = 0; i < data1.length; i++) {
        for (let j = 0; j < data1[i].length; j++) {
            const val = data1[i][j];
            if (!Number.isNaN(val)) {
                min = Math.min(min, val);
                max = Math.max(max, val);
            }
        }
    }
    for (let i = 0; i < data2.length; i++) {
        for (let j = 0; j < data2[i].length; j++) {
            const val = data2[i][j];
            if (!Number.isNaN(val)) {
                min = Math.min(min, val);
                max = Math.max(max, val);
            }
        }
    }

    return { min, max };
  };

  const calculateMeanStd = (data1: number[][], data2: number[][]) => {
      let sum = 0;
      let count = 0;

      // First pass: calculate mean
      for (let i = 0; i < data1.length; i++) {
          for (let j = 0; j < data1[i].length; j++) {
              const val = data1[i][j];
              if (!Number.isNaN(val)) {
                  sum += val;
                  count++;
              }
          }
      }
      for (let i = 0; i < data2.length; i++) {
          for (let j = 0; j < data2[i].length; j++) {
              const val = data2[i][j];
              if (!Number.isNaN(val)) {
                  sum += val;
                  count++;
              }
          }
      }

      const mean = sum / count;

      // Second pass: calculate variance
      let variance = 0;
      for (let i = 0; i < data1.length; i++) {
          for (let j = 0; j < data1[i].length; j++) {
              const val = data1[i][j];
              if (!Number.isNaN(val)) {
                  variance += Math.pow(val - mean, 2);
              }
          }
      }
      for (let i = 0; i < data2.length; i++) {
          for (let j = 0; j < data2[i].length; j++) {
              const val = data2[i][j];
              if (!Number.isNaN(val)) {
                  variance += Math.pow(val - mean, 2);
              }
          }
      }

      const std = Math.sqrt(variance / count);

      return { mean, std };
  };

  // Clip array to the percentile bounds
  const clipArray = (arr: number[][], minVal: number, maxVal: number) =>
    arr.map(row => row.map(val =>
      Number.isNaN(val) ? val :  // Preserve NaN values
      val < minVal ? minVal : (val > maxVal ? maxVal : val)
    ));



  // Main data transformation function
  const transformData = useCallback((
    data1: number[][],
    data2: number[][],
    isLog: boolean,
    lowerPerc: number,
    upperPerc: number,
    normalization: string = 'none',
    normalizationMode: string = 'together'
  ): { array1: number[][], array2: number[][] } => {
    if (!data1.length || !data2.length) return { array1: [], array2: [] };

    // Function to process a single array with log scale
    const applyLogScale = (data: number[][]) => {
      // Get dimensions of the image
      const rows = data.length;
      const cols = data[0]?.length || 0;
      const totalSize = rows * cols;

      // Create TypedArrays for input and output
      // Float32Array is chosen because:
      // - It's more memory efficient than Float64Array
      // - Provides enough precision for image processing
      // - Is commonly used in WebGL and image processing
      const flatInput = new Float32Array(totalSize);
      const result = new Float32Array(totalSize);

      // First pass: Flatten 2D array and find minimum positive value
      // We flatten the array because:
      // - Sequential memory access is faster than jumping between array rows
      // - CPU cache can better predict and prefetch sequential data
      // - Reduces memory fragmentation
      let minPositive = Infinity;
      let idx = 0;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const val = data[i][j];
          flatInput[idx++] = val;
          // Track minimum positive value for log scaling
          // We need this to handle values <= 0 which can't be log scaled
          if (val > 0) {
            minPositive = Math.min(minPositive, val);
          }
        }
      }

      // Calculate log of minimum positive value once
      // This will be used as replacement for values <= 0
      const logMinPositive = Math.log10(minPositive);

      // Second pass: Apply log scaling to all values
      // Process linearly through the TypedArray for better performance
      // This is faster than processing the 2D array because:
      // - Better memory locality
      // - Simpler array bounds checking
      // - Better CPU branch prediction
      for (let i = 0; i < totalSize; i++) {
        const val = flatInput[i];
        result[i] = val < 0 ? logMinPositive : val == 0 ? 0 : Math.log10(val);
      }

      // Convert back to 2D array if required by the calling code
      // Note: If possible, modifying the code to work with flat arrays
      // would be more efficient than this conversion
      const output: number[][] = new Array(rows);
      for (let i = 0; i < rows; i++) {
        // subarray creates a view into the existing array
        // This is more efficient than copying the data
        output[i] = Array.from(result.subarray(i * cols, (i + 1) * cols));
      }

      return output;
    };

    // Function to process percentiles for a single array
    const calculateSingleArrayPercentiles = (data: number[][], lowPercentile: number, highPercentile: number): [number, number] => {
      let totalLength = 0;
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          if (!Number.isNaN(data[i][j])) totalLength++;
        }
      }

      const values = new Float32Array(totalLength);
      let idx = 0;

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          if (!Number.isNaN(data[i][j])) {
            values[idx++] = data[i][j];
          }
        }
      }

      values.sort();
      const lowIndex = Math.ceil((lowPercentile / 100) * totalLength);
      const highIndex = Math.floor((highPercentile / 100) * totalLength);
      return [values[lowIndex], values[highIndex]];
    };

    // Function to calculate min-max for a single array
    const calculateSingleArrayMinMax = (data: number[][]) => {
      let min = Infinity;
      let max = -Infinity;

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const val = data[i][j];
          if (!Number.isNaN(val)) {
            min = Math.min(min, val);
            max = Math.max(max, val);
          }
        }
      }

      return { min, max };
    };

    // Function to calculate mean-std for a single array
    const calculateSingleArrayMeanStd = (data: number[][]) => {
      let sum = 0;
      let count = 0;

      // First pass: calculate mean
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const val = data[i][j];
          if (!Number.isNaN(val)) {
            sum += val;
            count++;
          }
        }
      }

      const mean = sum / count;

      // Second pass: calculate variance
      let variance = 0;
      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          const val = data[i][j];
          if (!Number.isNaN(val)) {
            variance += Math.pow(val - mean, 2);
          }
        }
      }

      const std = Math.sqrt(variance / count);
      return { mean, std };
    };

    // First apply log transform if needed
    let transformed1 = isLog ? applyLogScale(data1) : data1;
    let transformed2 = isLog ? applyLogScale(data2) : data2;

    if (normalizationMode === 'together') {
      // Calculate global percentiles and clip both arrays using the global limits
      const [minValue, maxValue] = calculateGlobalPercentiles(transformed1, transformed2, lowerPerc, upperPerc);
      transformed1 = clipArray(transformed1, minValue, maxValue);
      transformed2 = clipArray(transformed2, minValue, maxValue);

      // Apply normalization if needed
      switch (normalization) {
        case 'minmax': {
          const { min, max } = calculateMinMax(transformed1, transformed2);
          const range = max - min;
          const normalize = (arr: number[][]) => arr.map(row =>
            row.map(val =>
              Number.isNaN(val) ? 0 : range === 0 ? 0 : (val - min) / range
            )
          );
          transformed1 = normalize(transformed1);
          transformed2 = normalize(transformed2);
          break;
        }
        case 'mean': {
          const { mean, std } = calculateMeanStd(transformed1, transformed2);
          const normalize = (arr: number[][]) => arr.map(row =>
            row.map(val =>
              Number.isNaN(val) ? 0 : std === 0 ? 0 : (val - mean) / std
            )
          );
          transformed1 = normalize(transformed1);
          transformed2 = normalize(transformed2);
          break;
        }
        default:
          transformed1 = transformed1.map(row => row.map(val => Number.isNaN(val) ? 0 : val));
          transformed2 = transformed2.map(row => row.map(val => Number.isNaN(val) ? 0 : val));
      }
    } else {
      // Process each array individually
      // Apply percentile clipping individually
      const [minValue1, maxValue1] = calculateSingleArrayPercentiles(transformed1, lowerPerc, upperPerc);
      const [minValue2, maxValue2] = calculateSingleArrayPercentiles(transformed2, lowerPerc, upperPerc);
      transformed1 = clipArray(transformed1, minValue1, maxValue1);
      transformed2 = clipArray(transformed2, minValue2, maxValue2);

      // Apply normalization individually
      switch (normalization) {
        case 'minmax': {
          // Normalize array1
          const { min: min1, max: max1 } = calculateSingleArrayMinMax(transformed1);
          const range1 = max1 - min1;
          transformed1 = transformed1.map(row =>
            row.map(val =>
              Number.isNaN(val) ? 0 : range1 === 0 ? 0 : (val - min1) / range1
            )
          );

          // Normalize array2
          const { min: min2, max: max2 } = calculateSingleArrayMinMax(transformed2);
          const range2 = max2 - min2;
          transformed2 = transformed2.map(row =>
            row.map(val =>
              Number.isNaN(val) ? 0 : range2 === 0 ? 0 : (val - min2) / range2
            )
          );
          break;
        }
        case 'mean': {
          // Normalize array1
          const { mean: mean1, std: std1 } = calculateSingleArrayMeanStd(transformed1);
          transformed1 = transformed1.map(row =>
            row.map(val =>
              Number.isNaN(val) ? 0 : std1 === 0 ? 0 : (val - mean1) / std1
            )
          );

          // Normalize array2
          const { mean: mean2, std: std2 } = calculateSingleArrayMeanStd(transformed2);
          transformed2 = transformed2.map(row =>
            row.map(val =>
              Number.isNaN(val) ? 0 : std2 === 0 ? 0 : (val - mean2) / std2
            )
          );
          break;
        }
        default:
          transformed1 = transformed1.map(row => row.map(val => Number.isNaN(val) ? 0 : val));
          transformed2 = transformed2.map(row => row.map(val => Number.isNaN(val) ? 0 : val));
      }
    }

    return { array1: transformed1, array2: transformed2 };
  }, []);







  // Transform the data for the current resolution level (low, medium, or full)
  const transformedPlotData = useMemo(() => {
    if (!resolutionData[currentResolution]) return null;

    const currentData = resolutionData[currentResolution];

    // Transform both arrays together
    const { array1: transformedArray1, array2: transformedArray2 } = transformData(
      currentData.array1,
      currentData.array2,
      isLogScale,
      lowerPercentile,
      upperPercentile,
      normalization,
      normalizationMode,
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
    normalizationMode,
    transformData
  ]);

  // Transform the full resolution data for linecut calculations
  const transformedLineData = useMemo(() => {
    if (!resolutionData.full) return null;

    const { array1, array2 } = transformData(
      resolutionData.full.array1,
      resolutionData.full.array2,
      isLogScale,
      lowerPercentile,
      upperPercentile,
      normalization,
      normalizationMode,
    );

    return { array1, array2 };
  }, [
    resolutionData.full,
    isLogScale,
    lowerPercentile,
    upperPercentile,
    normalization,
    normalizationMode,
    transformData
  ]);

  // Calculate color scales for all three plots
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

      // Use global min/max for the first two plots (array1 and array2)
      if (index <= 1) {
        return {
          ...plotItem,
          z: transformedData,
          zmin: colorScales.global.min,  // Use global min
          zmax: colorScales.global.max,  // Use global max
          coloraxis: 'coloraxis',  // Link to the first coloraxis
        };
      } else {
        // For difference plot, use symmetric min/max
        return {
          ...plotItem,
          z: transformedData,
          zmin: -colorScales.maxAbsDiff,
          zmax: colorScales.maxAbsDiff,
          coloraxis: 'coloraxis2',  // Link to the second coloraxis
        };
      }
    });

    // Update the coloraxis settings in the layout
    const newLayout = {
      ...currentPlotData.layout,
      coloraxis: currentPlotData.layout.coloraxis ? {
        ...currentPlotData.layout.coloraxis,
        cmin: colorScales.global.min,
        cmax: colorScales.global.max,
        colorscale: imageColormap,
      } : undefined,
      coloraxis2: currentPlotData.layout.coloraxis2 ? {
        ...currentPlotData.layout.coloraxis2,
        cmin: -colorScales.maxAbsDiff,
        cmax: colorScales.maxAbsDiff,
        cmid: 0,
        colorscale: differenceColormap,
      } : undefined
    };

    // Check if data values or ranges have changed
    const hasDataChanged = newData.some((item: any, index: number) => {
      const oldItem = currentPlotData.data[index];
      return (
        !oldItem ||
        item.z !== oldItem.z ||
        item.zmin !== oldItem.zmin ||
        item.zmax !== oldItem.zmax ||
        item.coloraxis !== oldItem.coloraxis ||
        item.coloraxis2 !== oldItem.coloraxis2 ||
        item.colorscale !== oldItem.colorscale ||
        item.showscale !== oldItem.showscale ||
        item.colorbar !== oldItem.colorbar
      );
    });

    // Check if color axis settings have changed
    const hasLayoutChanged =
      currentPlotData.layout.coloraxis?.cmin !== newLayout.coloraxis?.cmin ||
      currentPlotData.layout.coloraxis?.cmax !== newLayout.coloraxis?.cmax ||
      currentPlotData.layout.coloraxis?.colorscale !== newLayout.coloraxis?.colorscale ||
      currentPlotData.layout.coloraxis2?.cmin !== newLayout.coloraxis2?.cmin ||
      currentPlotData.layout.coloraxis2?.cmax !== newLayout.coloraxis2?.cmax ||
      currentPlotData.layout.coloraxis2?.cmid !== newLayout.coloraxis2?.cmid ||
      currentPlotData.layout.coloraxis2?.colorscale !== newLayout.coloraxis2?.colorscale;

    // Only update if something has changed
    if (hasDataChanged || hasLayoutChanged) {
      setPlotData(prev => ({
        ...prev,
        data: newData,
        layout: newLayout
      }));
    }
  }, [transformedPlotData, colorScales, imageColormap, differenceColormap]);


  // Effect to update linecut data when transformations change
  useEffect(() => {
    if (!transformedLineData) return;

    // Update the full resolution image data
    setImageData1(transformedLineData.array1);
    setImageData2(transformedLineData.array2);

  }, [
    transformedLineData,
    setImageData1,
    setImageData2,
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
      normalization,
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
    normalization,
  ]);



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

        const [minValue1, maxValue1] = getArrayMinMax(fullArray1);
        const [minValue2, maxValue2] = getArrayMinMax(fullArray2);
        const [minValueDiff, maxValueDiff] = getArrayMinMax(fullDiff);

        // Set dimensions and full resolution data for linecuts
        setImageHeight(fullArray1.length);
        setImageWidth(fullArray1[0].length);
        setImageData1(fullArray1);
        setImageData2(fullArray2);

        const array1DownsampledLowRes = downsampleArray(fullArray1, lowFactor);
        const array2DownsampledLowRes = downsampleArray(fullArray2, lowFactor);
        const diffDownsampledLowRes = downsampleArray(fullDiff, lowFactor);

        const array1DownsampledMediumRes = downsampleArray(fullArray1, mediumFactor);
        const array2DownsampledMediumRes = downsampleArray(fullArray2, mediumFactor);
        const diffDownsampledMediumRes = downsampleArray(fullDiff, mediumFactor);


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

        const globalMinValue = Math.min(minValue1, minValue2);
        const globalMaxValue = Math.max(maxValue1, maxValue2);

        // Set the data range for display
        plotlyData.data[0].zmin = globalMinValue;
        plotlyData.data[0].zmax = globalMaxValue;
        plotlyData.data[1].zmin = globalMinValue;
        plotlyData.data[1].zmax = globalMaxValue;
        plotlyData.data[2].zmin = minValueDiff;
        plotlyData.data[2].zmax = maxValueDiff;

        // Set the colorbar range to show full data range
        if (plotlyData.layout.coloraxis) {
          plotlyData.layout.coloraxis.cmin = globalMinValue;
          plotlyData.layout.coloraxis.cmax = globalMaxValue;
        }
        if (plotlyData.layout.coloraxis2) {
          const maxAbsDiff = Math.max(Math.abs(minValueDiff), Math.abs(maxValueDiff));
          plotlyData.layout.coloraxis2.cmin = -maxAbsDiff;
          plotlyData.layout.coloraxis2.cmax = maxAbsDiff;
          plotlyData.layout.coloraxis2.cmid = 0;
        }

        setPlotData(plotlyData);

      })
      .catch(error => console.error("Error fetching scatter subplot:", error));
  }, [
    setImageHeight,
    setImageWidth,
    setImageData1,
    setImageData2,
  ]);


  // Memoize plot components
  const mainPlotData = plotData?.data || [];


  const linecutOverlays = useMemo(() => {
    if (!plotData) return [];

    const factor = getCurrentFactor() || 1;
    const currentArrayData = resolutionData[currentResolution].array1;
    const imageWidth = currentArrayData[0]?.length || 0;
    const imageHeight = currentArrayData.length;

    console.log('linecut:', inclinedLinecuts)

    return [
      ...(horizontalLinecuts || [])
        .filter(l => !l.hidden)
        .flatMap(linecut => generateHorizontalLinecutOverlay({
          linecut,
          currentArray: currentArrayData,
          factor: getCurrentFactor(),
          qYVector, // Pass qYVector to the function
          units: units // Pass units
        })),
      ...(verticalLinecuts || [])
        .filter(l => !l.hidden)
        .flatMap(linecut => generateVerticalLinecutOverlay({
          linecut,
          currentArray: currentArrayData,
          factor: getCurrentFactor(),
          qXVector, // Pass qXVector to the function
          units: units // Pass units
        })),
        // Inclined linecuts
      ...(inclinedLinecuts || [])
      .filter(l => !l.hidden)
      .flatMap(linecut => {
        // // Scale positions while maintaining the angle
        // const scaledLinecut: InclinedLinecut = {
        //   ...linecut,
        //   xPosition: linecut.xPosition / factor,
        //   yPosition: linecut.yPosition / factor,
        //   width: (linecut.width || 0) / factor,
        //   // These properties don't need scaling
        //   angle: linecut.angle,
        //   id: linecut.id,
        //   leftColor: linecut.leftColor,
        //   rightColor: linecut.rightColor,
        //   hidden: linecut.hidden,
        //   type: 'inclined'
        // };

        return generateInclinedLinecutOverlay({
          linecut: linecut, //scaledLinecut,
          currentArray: resolutionData[currentResolution].array1,
          factor,
          imageWidth,
          imageHeight,
          beam_center_x: calibrationParams.beam_center_x,
          beam_center_y: calibrationParams.beam_center_y,
          // qXVector,
          // qYVector,
        });
      }),

      // Azimuthal integration overlays
      ...(azimuthalIntegrations || [])
      .filter(integration => !integration.hidden)
      .flatMap(integration => {
        // Get the data for this integration
        const data1 = azimuthalData1.find(d => d.id === integration.id);
        const data2 = azimuthalData2.find(d => d.id === integration.id);

        if (!data1 || !data2) return [];  // Skip if data not available

        // Generate and spread both overlays' traces
        return [
          ...generateAzimuthalOverlay({
            integration,
            azimuthalData: data1,
            axisNumber: 1,
            factor,
            currentArray: currentArrayData,
            maxQValue: maxQValue,
            beamCenterX: calibrationParams.beam_center_x,
            beamCenterY: calibrationParams.beam_center_y,
          }),
          ...generateAzimuthalOverlay({
            integration,
            azimuthalData: data2,
            axisNumber: 2,
            factor,
            currentArray: currentArrayData,
            maxQValue: maxQValue,
            beamCenterX: calibrationParams.beam_center_x,
            beamCenterY: calibrationParams.beam_center_y,
          })
        ];
      })

    ];
  }, [
    plotData,
    horizontalLinecuts,
    verticalLinecuts,
    inclinedLinecuts,
    azimuthalIntegrations,
    azimuthalData1,
    azimuthalData2,
    resolutionData,
    currentResolution,
    getCurrentFactor,
    maxQValue,
    calibrationParams,
    qYVector,
    qXVector,
    units,
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
