import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { decode, ExtData } from "@msgpack/msgpack";
import { Linecut } from "../types";
import { cond, reverse } from "lodash";
import { relayout } from "plotly.js";
// import { createScatterSubplot } from "../utils/createScatterSubplot";
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

function calculateZminMax(array_1: number[][], array_2: number[][]): [number, number] {
  let zmin = Infinity;
  let zmax = -Infinity;

  // Combine both arrays and iterate through them
  [array_1, array_2].forEach((array) => {
    array.forEach((row) => {
      row.forEach((value) => {
        if (value < zmin) zmin = value;
        if (value > zmax) zmax = value;
      });
    });
  });

  return [zmin, zmax];
}


interface ScatterSubplotProps {
  setImageHeight: (height: number) => void;
  setImageWidth: (width: number) => void;
  setImageData1: (data: number[][]) => void; // Full-resolution data for linecuts
  setImageData2: (data: number[][]) => void; // Full-resolution data for linecuts
  horizontalLinecuts: Linecut[];
  leftImageColorPalette: string[];
  rightImageColorPalette: string[];
}

const ScatterSubplot: React.FC<ScatterSubplotProps> = React.memo(({
  setImageHeight,
  setImageWidth,
  setImageData1,
  setImageData2,
  horizontalLinecuts,
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



    const handleRelayout = (relayoutData) => {

      // Check if the relayout event corresponds to an autoscale action
      const isAutoscale =
      "xaxis.autorange" in relayoutData ||
      "yaxis.autorange" in relayoutData;


    if (isAutoscale) {
      setIsZooming(false); // Reset zoom state
      // Revert to downsampled data and reset layout ranges
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
        },
      }));
      return;
    }

    if (isZooming) {
      return;
    }

    setIsZooming(true); // Enable zoom state on the first zoom

      // Calculate indices in the downsampled data
      const xStartDownsampled = Math.max(0, Math.floor(relayoutData["xaxis2.range[0]"]));
      const xEndDownsampled = Math.min(
        downsampledArray1[0].length,
        Math.ceil(relayoutData["xaxis2.range[1]"])
      );
      const yStartDownsampled = Math.max(0, Math.floor(relayoutData["yaxis2.range[0]"]));
      const yEndDownsampled = Math.min(
        downsampledArray1.length,
        Math.ceil(relayoutData["yaxis2.range[1]"])
      );

      // Scale indices back to the full-resolution data
      const xStartFullRes = Math.max(0, xStartDownsampled * downsampleFactor);
      const xEndFullRes = Math.min(fullResArray1[0].length, xEndDownsampled * downsampleFactor);
      const yStartFullRes = Math.max(0, yStartDownsampled * downsampleFactor);
      const yEndFullRes = Math.min(fullResArray1.length, yEndDownsampled * downsampleFactor);

      // // Extract full-resolution zoomed-in regions
      // const zoomedArray1 = fullResArray1
      //   .slice(yEndFullRes, yStartFullRes)
      //   .map((row) => row.slice(xStartFullRes, xEndFullRes));
      // const zoomedArray2 = fullResArray2
      //   .slice(yEndFullRes, yStartFullRes)
      //   .map((row) => row.slice(xStartFullRes, xEndFullRes));
      // const zoomedDiff = zoomedArray1.map((row, i) =>
      //   row.map((val, j) => val - zoomedArray2[i][j])
      // );



      // Update the plot data with the full-resolution zoomed-in data
      setPlotData((prev) => {
        const updatedData = {
          ...prev,
          data: [
            { ...prev.data[0], z: fullResArray1 },
            { ...prev.data[1], z: fullResArray2 },
            { ...prev.data[2], z: fullResDiff },
          ],
          layout: {
            ...prev.layout,
            xaxis: { ...prev.layout.xaxis, range: [xStartFullRes, xEndFullRes] },
            xaxis2: { ...prev.layout.xaxis2, range: [xStartFullRes, xEndFullRes] },
            xaxis3: { ...prev.layout.xaxis3, range: [xStartFullRes, xEndFullRes] },
            yaxis: { ...prev.layout.yaxis, range: [yStartFullRes, yEndFullRes] },
            yaxis2: { ...prev.layout.yaxis2, range: [yStartFullRes, yEndFullRes] },
            yaxis3: { ...prev.layout.yaxis3, range: [yStartFullRes, yEndFullRes] },
          },
        };
        return updatedData;
      });
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
          ...visibleLinecuts.map((linecut) => {
            const scale = isZooming ? 1 : downsampleFactor; // Scale down linecuts for downsampled data
            return {
              x: [
                0,
                plotData.data[0].z[0].length,
                plotData.data[0].z[0].length,
                0,
              ],
              y: [
                (linecut.position - (linecut.width || 1) / 2) / scale,
                (linecut.position - (linecut.width || 1) / 2) / scale,
                (linecut.position + (linecut.width || 1) / 2) / scale,
                (linecut.position + (linecut.width || 1) / 2) / scale,
              ],
              mode: "lines",
              fill: "toself",
              fillcolor: linecut.leftColor,
              line: { color: linecut.leftColor },
              opacity: 0.3,
              xaxis: "x1", // Associate with the left image
              yaxis: "y1",
              showlegend: false,
            };
          }),
          // Render rectangles for the right image (x2, y2)
          ...visibleLinecuts.map((linecut) => {
            const scale = isZooming ? 1 : downsampleFactor; // Scale down linecuts for downsampled data
            return {
              x: [
                0,
                plotData.data[1].z[0].length,
                plotData.data[1].z[0].length,
                0,
              ],
              y: [
                (linecut.position - (linecut.width || 1) / 2) / scale,
                (linecut.position - (linecut.width || 1) / 2) / scale,
                (linecut.position + (linecut.width || 1) / 2) / scale,
                (linecut.position + (linecut.width || 1) / 2) / scale,
              ],
              mode: "lines",
              fill: "toself",
              fillcolor: linecut.rightColor,
              line: { color: linecut.rightColor },
              opacity: 0.3,
              xaxis: "x2", // Associate with the right image
              yaxis: "y2",
              showlegend: false,
            };
          }),
        ]}
        layout={{
          ...plotData.layout,
          annotations: generateHorizontalLinecutAnnotations(),
        }}
        config={{ scrollZoom: true, responsive: true, displayModeBar: true }}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%" }}
        onRelayout={handleRelayout}
      />


      ) : (
        <p>Loading scatter subplot...</p>
      )}
    </div>
  );
});

export default ScatterSubplot;
