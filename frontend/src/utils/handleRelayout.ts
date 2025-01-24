// utils/handleRelayout.ts
import { ResolutionDataType } from '../types';

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

    setPlotData(prev => ({
      ...prev,
      data: [
        { ...prev.data[0], z: resolutionData.low.array1 },
        { ...prev.data[1], z: resolutionData.low.array2 },
        { ...prev.data[2], z: resolutionData.low.diff },
      ],
      // layout: {
      //   ...prev.layout,
      //   // xaxis: { ...prev.layout.xaxis, range: undefined, autorange: true },
      //   // xaxis2: { ...prev.layout.xaxis2, range: undefined, autorange: true },
      //   // xaxis3: { ...prev.layout.xaxis3, range: undefined, autorange: true },
      //   xaxis: { ...prev.layout.xaxis, range: [0, width], autorange: true },
      //   xaxis2: { ...prev.layout.xaxis2, range: [0, width], autorange: true },
      //   xaxis3: { ...prev.layout.xaxis3, range: [0, width], autorange: true },
      //   yaxis: { ...prev.layout.yaxis, range: [height, 0] },
      //   yaxis2: { ...prev.layout.yaxis2, range: [height, 0] },
      //   yaxis3: { ...prev.layout.yaxis3, range: [height, 0] },
      // },
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
        xaxis: { ...prev.layout.xaxis, range: [newXStart, newXEnd] },
        xaxis2: { ...prev.layout.xaxis2, range: [newXStart, newXEnd] },
        xaxis3: { ...prev.layout.xaxis3, range: [newXStart, newXEnd] },
        yaxis: { ...prev.layout.yaxis, range: [newYStart, newYEnd] },
        yaxis2: { ...prev.layout.yaxis2, range: [newYStart, newYEnd] },
        yaxis3: { ...prev.layout.yaxis3, range: [newYStart, newYEnd] },
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
