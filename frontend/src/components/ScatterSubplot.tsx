import React, { useEffect, useState, useRef} from "react";
import Plot from "react-plotly.js";
import { decode, ExtData } from "@msgpack/msgpack";
import Plotly from "plotly.js";
import { set } from "lodash";


// Function to handle ExtType
function extractBinary(ext: ExtData | Uint8Array): Uint8Array {
    if (ext instanceof Uint8Array) {
        return ext;  // Already Uint8Array
    }
    return new Uint8Array(ext.data);  // Extract raw data from ExtType
}


// Function to reconstruct Float32Array
function reconstructFloat32Array(buffer: Uint8Array, shape: [number, number]): number[][] {
    const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
    const reshaped: number[][] = [];
    for (let i = 0; i < shape[0]; i++) {
        reshaped.push(Array.from(float32Array.slice(i * shape[1], (i + 1) * shape[1])));
    }
    return reshaped;
}


const ScatterSubplot: React.FC = React.memo(() => {
  const [plotData, setPlotData] = useState<any>(null);
  const [layout, setLayout] = useState<any>(null); // Separate state for layout
  const plotContainer = useRef<HTMLDivElement>(null);
  const plotRef = useRef<any>(null);


  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/scatter-subplot")
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const decoded = decode(new Uint8Array(buffer)) as any;

        // Extract binary arrays from ExtType
        const array1Buffer = extractBinary(decoded.array_1);
        const array2Buffer = extractBinary(decoded.array_2);
        const absDiffBuffer = extractBinary(decoded.array_diff);

        // Reconstruct and reshape arrays
        const reshapedArray1 = reconstructFloat32Array(array1Buffer, decoded.metadata.shape_1);
        const reshapedArray2 = reconstructFloat32Array(array2Buffer, decoded.metadata.shape_2);
        const reshapedAbsDiff = reconstructFloat32Array(absDiffBuffer, decoded.metadata.shape_diff);

        // Plotly data
        const plotlyData = decoded.metadata.plotly;
        plotlyData.data[0].z = reshapedArray1;
        plotlyData.data[1].z = reshapedArray2;
        plotlyData.data[2].z = reshapedAbsDiff;

        setPlotData(plotlyData);
      })
      .catch((error) => console.error("Error fetching scatter subplot:", error));
  }, []);

    // Handle resizing
    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
          if (entries[0]) {
            const { width, height } = entries[0].contentRect;
            setLayout((prev: any) => ({
              ...prev,
              width,
              height,
            }));
            if (plotRef.current) {
              Plotly.Plots.resize(plotRef.current);
            }
          }
        });

    // Observe the container
    if (plotContainer.current) {
      resizeObserver.observe(plotContainer.current);
    }

    // Cleanup on unmount
    return () => resizeObserver.disconnect();
  }, [plotData]);

  return (
    <div
      className="w-full h-full transition-all duration-300 ease-in-out"
      ref={plotContainer}
      style={{ width: "100%", height: "100%" }}
    >
      {plotData ? (
        <Plot
          data={plotData.data}
          layout={plotData.layout}
          config={{ scrollZoom: true}}
          useResizeHandler={true} // Enable resize handling
          style={{ width: "100%", height: "100%" }}
        //   className="w-full h-full"
        />
      ) : (
        <p>Loading scatter subplot...</p>
      )}
    </div>
  );
});

export default ScatterSubplot;
