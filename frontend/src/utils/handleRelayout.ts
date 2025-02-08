// utils/handleRelayout.ts
import { ResolutionDataType } from '../types';
import { calculateDifferenceArray } from './calculateDifferenceArray';
import { getArrayMinMax } from './getArrayMinAndMax';

interface HandleRelayoutProps {
  plotData: any;
  currentResolution: 'low' | 'medium' | 'full';
  resolutionData: {
    low: ResolutionDataType;
    medium: ResolutionDataType;
    full: ResolutionDataType;
  };
  setCurrentResolution: (resolution: 'low' | 'medium' | 'full') => void;
  setZoomedXPixelRange: (range: [number, number] | null) => void;
  setZoomedYPixelRange: (range: [number, number] | null) => void;
  setPlotData: (data: any) => void;
  setDragMode: (mode: string) => void;
  transformData: (
    data1: number[][],
    data2: number[][],
    isLog: boolean,
    lowerPerc: number,
    upperPerc: number,
    normalization?: string
  ) => { array1: number[][], array2: number[][] };
  isLogScale: boolean;
  lowerPercentile: number;
  upperPercentile: number;
  normalization: string;
}

export const handleRelayout = (
  relayoutData: any,
  {
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
  }: HandleRelayoutProps
) => {
  if (!plotData) return;

  // Update dragmode if changed
  if (relayoutData.dragmode) {
    setDragMode(relayoutData.dragmode);
  }

    // Handle auto-scale
  if ("xaxis.autorange" in relayoutData || "yaxis.autorange" in relayoutData) {
    setCurrentResolution('low');
    setZoomedXPixelRange(null);
    setZoomedYPixelRange(null);

    const height = resolutionData.low.array1.length;
    const width = resolutionData.low.array1[0].length;


    // Transform both arrays together
    const { array1: transformedArray1, array2: transformedArray2 } = transformData(
      resolutionData.low.array1,
      resolutionData.low.array2,
      isLogScale,
      lowerPercentile,
      upperPercentile,
      normalization
    );

    // Calculate difference using transformed data
    const transformedDiff = calculateDifferenceArray(transformedArray1, transformedArray2);

    const [minValue1, maxValue1] = getArrayMinMax(transformedArray1);
    const [minValue2, maxValue2] = getArrayMinMax(transformedArray2);
    const [minValueDiff, maxValueDiff] = getArrayMinMax(transformedDiff);

    const globalMinValue = Math.min(minValue1, minValue2);
    const globalMaxValue = Math.max(maxValue1, maxValue2);
    const maxAbsDiff = Math.max(Math.abs(minValueDiff), Math.abs(maxValueDiff));

    setPlotData(prev => ({
      ...prev,
      data: [
        {
          ...prev.data[0],
          z: transformedArray1,
          // z: resolutionData['low'].array1,
          // zmin: globalMinValue,
          // zmax: globalMaxValue,
        },
        {
          ...prev.data[1],
          z: transformedArray2,
          // z: resolutionData['low'].array2,
          // zmin: globalMinValue,
          // zmax: globalMaxValue,
        },
        {
          ...prev.data[2],
          z: transformedDiff,
          // z: resolutionData['low'].diff,
          // zmin: -maxAbsDiff,
          // zmax: maxAbsDiff,
        }
      ],
      layout: {
        ...prev.layout,
        xaxis: { ...prev.layout.xaxis, range: [0, width], autorange: false },
        xaxis2: { ...prev.layout.xaxis2, range: [0, width], autorange: false },
        xaxis3: { ...prev.layout.xaxis3, range: [0, width], autorange: false },
        yaxis: { ...prev.layout.yaxis, range: [height + 30, -20], autorange: false },
        yaxis2: { ...prev.layout.yaxis2, range: [height + 30, -20], autorange: false },
        yaxis3: { ...prev.layout.yaxis3, range: [height + 30, -20], autorange: false },
        // coloraxis: {
        //   ...prev.layout.coloraxis,
        //   cmin: globalMinValue,
        //   cmax: globalMaxValue
        // },
        // coloraxis2: {
        //   ...prev.layout.coloraxis2,
        //   cmin: -maxAbsDiff,
        //   cmax: maxAbsDiff,
        //   cmid: 0
        // }
      },
    }));

    return;
  }

  // Extract ranges - check for both zoom and pan events
  const xStart = relayoutData["xaxis2.range[0]"] // ?? relayoutData["xaxis2.range.0"];
  const xEnd = relayoutData["xaxis2.range[1]"] // ?? relayoutData["xaxis2.range.1"];
  const yStart = relayoutData["yaxis2.range[0]"] // ?? relayoutData["yaxis2.range.0"];
  const yEnd = relayoutData["yaxis2.range[1]"] // ?? relayoutData["yaxis2.range.1"];

  if ([xStart, xEnd, yStart, yEnd].some(v => v === undefined)) return;

  // Get the current resolution factor
  const factor = resolutionData[currentResolution].factor;

  // Update the zoomed pixel range for both zoom and pan
  const scaledXStart = Math.floor(xStart * factor);
  const scaledXEnd = Math.ceil(xEnd * factor);
  const scaledYStart = Math.floor(yStart * factor);
  const scaledYEnd = Math.ceil(yEnd * factor);

  setZoomedXPixelRange([scaledXStart, scaledXEnd]);
  setZoomedYPixelRange([scaledYStart, scaledYEnd]);

  // Determine new resolution based on zoom level
  const currentWidth = resolutionData[currentResolution].array1[0].length;
  const currentHeight = resolutionData[currentResolution].array1.length;
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
        xaxis: { ...prev.layout.xaxis, range: [newXStart, newXEnd], autorange: false },
        xaxis2: { ...prev.layout.xaxis2, range: [newXStart, newXEnd], autorange: false },
        xaxis3: { ...prev.layout.xaxis3, range: [newXStart, newXEnd], autorange: false },
        yaxis: { ...prev.layout.yaxis, range: [newYStart, newYEnd], autorange: false },
        yaxis2: { ...prev.layout.yaxis2, range: [newYStart, newYEnd], autorange: false },
        yaxis3: { ...prev.layout.yaxis3, range: [newYStart, newYEnd], autorange: false },
      },
    }));

    // Clear linecut cache when resolution changes
    // linecutCache.clear();
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
};
