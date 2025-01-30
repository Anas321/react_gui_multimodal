import { useEffect, useRef, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { Linecut } from "../types";

interface VerticalLinecutFigProps {
  linecuts: Linecut[];
  imageData1: number[][];
  imageData2: number[][];
  zoomedXPixelRange: [number, number] | null;
  zoomedYPixelRange: [number, number] | null;
}

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

const VerticalLinecutFig: React.FC<VerticalLinecutFigProps> = ({
  linecuts,
  imageData1,
  imageData2,
  zoomedXPixelRange,
  zoomedYPixelRange,
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

  // Compute averaged intensity for a vertical linecut
  const computeAveragedIntensity = (
    imageData: number[][],
    position: number,
    width: number
  ) => {
    const halfWidth = width / 2;
    const startCol = Math.max(0, Math.floor(position - halfWidth));
    const endCol = Math.min(imageData[0].length - 1, Math.ceil(position + halfWidth));

    return Array.from(
      { length: imageData.length },
      (_, rowIndex) => {
        let sum = 0;
        let count = 0;

        for (let col = startCol; col <= endCol; col++) {
          sum += imageData[rowIndex][col];
          count++;
        }

        return sum / count;
      }
    );
  };

  // Memoize plot data - Plot as normal x-y but with synchronization on x-axis
  const plotData = useMemo(() =>
    linecuts
      .filter((linecut) => !linecut.hidden)
      .flatMap((linecut) => {
        const averagedDataLeft = computeAveragedIntensity(
          imageData1,
          linecut.position,
          linecut.width ?? 1
        );

        const averagedDataRight = computeAveragedIntensity(
          imageData2,
          linecut.position,
          linecut.width ?? 1
        );

        const xValues = Array.from(
          { length: averagedDataLeft.length },
          (_, i) => i
        );

        return [
          {
            x: xValues,
            y: averagedDataLeft,
            type: "scatter" as const,
            mode: "lines" as const,
            name: `Left Linecut ${linecut.id}`,
            line: {
              color: linecut.leftColor,
              width: 2,
            },
          },
          {
            x: xValues,
            y: averagedDataRight,
            type: "scatter" as const,
            mode: "lines" as const,
            name: `Right Linecut ${linecut.id}`,
            line: {
              color: linecut.rightColor,
              width: 2,
            },
          },
        ];
      }),
    [linecuts, imageData1, imageData2]
  );


  // // Memoize layout - Using zoomedPixelRange for y-axis but display on x-axis
  // const layout = useMemo(() => {
  //   return {
  //     width: dimensions.width,
  //     height: dimensions.height,
  //     xaxis: {
  //       title: { text: "Pixel Index", font: { size: 25 } },
  //       tickfont: { size: 25 },
  //       autorange: !zoomedYPixelRange,
  //       range: zoomedYPixelRange || undefined,
  //     },
  //     yaxis: {
  //       title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
  //       tickfont: { size: 25 },
  //     },
  //     margin:{
  //       l: 110,
  //     },
  //     legend: {
  //       font: { size: 25 },
  //     },
  //     font: { size: 25 },
  //     showlegend: true,
  //   };
  // }, [dimensions, zoomedYPixelRange]);



  // Add the check for linecuts in range
  const isLinecutInRange = (
    linecut: Linecut,
    xRange: [number, number] | null,
    yRange: [number, number] | null
  ): boolean => {
    if (!xRange || !yRange) return false;

    // For vertical linecuts, we check if the linecut's x-position falls within the x-range
    const [xStart, xEnd] = xRange;
    const position = linecut.position;

    return position >= xStart && position <= xEnd;
  };

  // Update the layout useMemo
  const layout = useMemo(() => {

    const defaultRange = {
      xaxis: {
        title: { text: "Pixel Index", font: { size: 25 } },
        tickfont: { size: 25 },
        autorange: true,
      },
    };

    // Check for linecuts in range
    const hasLinecutInRange = linecuts
      .filter(linecut => !linecut.hidden)
      .some(linecut => isLinecutInRange(linecut, zoomedXPixelRange, zoomedYPixelRange));


    // Only apply zoom range if there are linecuts in range
    const xAxisConfig = (zoomedYPixelRange && hasLinecutInRange)
      ? {
          ...defaultRange.xaxis,
          range: zoomedYPixelRange,
          autorange: false,
        }
      : defaultRange.xaxis;

    return {
      width: dimensions.width,
      height: dimensions.height,
      xaxis: xAxisConfig,
      yaxis: {
        title: { text: "Intensity", font: { size: 25 }, standoff: 50 },
        tickfont: { size: 25 },
        autorange: true,
      },
      margin: { l: 110 },
      legend: { font: { size: 25 } },
      font: { size: 25 },
      showlegend: true,
    };
  }, [dimensions, zoomedYPixelRange, zoomedXPixelRange, linecuts]);


  return (
    <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow">
      <Plot
        data={plotData}
        layout={layout}
        config={{
          scrollZoom: true,
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtons: [
            [
              'pan2d',
              'zoom2d',
              'zoomIn2d',
              'zoomOut2d',
              'autoScale2d',
              'resetScale2d',
              'toImage',
            ],
          ],
          showTips: true,
        }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default VerticalLinecutFig;
