import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import { decode, ExtData } from "@msgpack/msgpack";

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
  linecutPosition: number;
  setImageHeight: (height: number) => void;
  setImageWidth: (width: number) => void;
  setImageData1: (data: number[][]) => void;
  setImageData2: (data: number[][]) => void;
  horizontalLinecuts: { id: number; position: number; color: string }[];
}

const ScatterSubplot: React.FC<ScatterSubplotProps> = React.memo(({
  linecutPosition,
  setImageHeight,
  setImageWidth,
  setImageData1,
  setImageData2,
  horizontalLinecuts,
}) => {
  const [plotData, setPlotData] = useState<any>(null);
  const [imageWidth, setLocalImageWidth] = useState<number>(0);
  const [imageHeight, setLocalImageHeight] = useState<number>(0);
  const plotContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/scatter-subplot")
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const decoded = decode(new Uint8Array(buffer)) as any;

        // Extract and reshape binary arrays
        const reshapedArray1 = reconstructFloat32Array(extractBinary(decoded.array_1), decoded.metadata.shape_1);
        const reshapedArray2 = reconstructFloat32Array(extractBinary(decoded.array_2), decoded.metadata.shape_2);
        const reshapedAbsDiff = reconstructFloat32Array(extractBinary(decoded.array_diff), decoded.metadata.shape_diff);

        // Get dimensions
        const height = reshapedArray1.length;
        const width = reshapedArray1[0].length;

        // Pass dimensions and data to parent component
        setImageHeight(height);
        setImageWidth(width);
        setImageData1(reshapedArray1);
        setImageData2(reshapedArray2);

        // Update local state
        setLocalImageHeight(height);
        setLocalImageWidth(width);

        // Update Plotly data
        const plotlyData = decoded.metadata.plotly;
        plotlyData.data[0].z = reshapedArray1;
        plotlyData.data[1].z = reshapedArray2;
        plotlyData.data[2].z = reshapedAbsDiff;

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
            // Linecuts for the left image
            ...horizontalLinecuts.map((linecut: { id: number; position: number; color: string }) => ({
              x: [0, imageWidth],
              y: [linecut.position, linecut.position],
              mode: "lines",
              line: { color: linecut.color, width: 2 },
              showlegend: false,
              xaxis: "x1",
              yaxis: "y1",
            })),
            // Linecuts for the right image
            ...horizontalLinecuts.map((linecut) => ({
              x: [0, imageWidth],
              y: [linecut.position, linecut.position],
              mode: "lines",
              line: { color: linecut.color, width: 2 },
              showlegend: false,
              xaxis: "x2", // Ensure this matches the right image axes
              yaxis: "y2",
            })),

            // {
            //   x: [0, imageWidth],
            //   y: [linecutPosition, linecutPosition],
            //   mode: "lines",
            //   line: { color: "red", width: 2 },
            //   showlegend: false,
            //   xaxis: "x1",
            //   yaxis: "y1",
            // },
            // // Add horizontal line for the second scatter image
            // {
            //   x: [0, imageWidth],
            //   y: [linecutPosition, linecutPosition],
            //   mode: "lines",
            //   line: { color: "blue", width: 2 },
            //   showlegend: false,
            //   xaxis: "x2",
            //   yaxis: "y2",
            // },
          ]}
          layout={plotData.layout}
          config={{ scrollZoom: true }}
          useResizeHandler={true}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <p>Loading scatter subplot...</p>
      )}
    </div>
  );
});

export default ScatterSubplot;
