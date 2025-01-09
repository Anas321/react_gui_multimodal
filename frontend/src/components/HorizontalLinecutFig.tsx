import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { Linecut } from "../types";

interface HorizontalLinecutFigProps {
  linecuts: Linecut[]; // List of linecuts with positions and colors
  linecutData1: { id: number; data: number[] }[]; // Data for left scatter image
  linecutData2: { id: number; data: number[] }[]; // Data for right scatter image
  leftImageColorPalette: string[]; // Color palette for the left image
  rightImageColorPalette: string[]; // Color palette for the right image
  imageData1: number[][]; // Full data for the left scatter image
  imageData2: number[][]; // Full data for the right scatter image
}

const HorizontalLinecutFig: React.FC<HorizontalLinecutFigProps> = ({
  linecuts,
  linecutData1,
  linecutData2,
  leftImageColorPalette,
  rightImageColorPalette,
  imageData1,
  imageData2,
}) => {
  const [layout, setLayout] = useState({
    xaxis: { title: "Pixel Index" },
    yaxis: { title: "Intensity" },
    showlegend: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Update layout dimensions when container size changes
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setLayout((prev) => ({
          ...prev,
          width,
          height: height,
        }));
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Helper function to compute averaged intensity
  const computeAveragedIntensity = (
    imageData: number[][],
    position: number,
    width: number
  ) => {
    const halfWidth = width / 2;
    const startRow = Math.max(0, Math.floor(position - halfWidth));
    const endRow = Math.min(imageData.length - 1, Math.ceil(position + halfWidth));

    const averagedIntensity = Array.from(
      { length: imageData[0].length },
      (_, colIndex) => {
        let sum = 0;
        let count = 0;

        for (let row = startRow; row <= endRow; row++) {
          sum += imageData[row][colIndex];
          count++;
        }

        return sum / count;
      }
    );

    return averagedIntensity;
  };

  return (
    <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow">
      <Plot
        data={[
          // Map through all visible linecuts and add their data to the plot
          ...linecuts
            .filter((linecut) => !linecut.hidden) // Only include visible linecuts
            .flatMap((linecut) => {
              const averagedDataLeft = computeAveragedIntensity(
                imageData1,
                linecut.position,
                linecut.width ?? 1 // Provide default width if undefined
              );

              const averagedDataRight = computeAveragedIntensity(
                imageData2,
                linecut.position,
                linecut.width ?? 1 // Provide default width if undefined
              );

              return [
                // Plot for the left image
                {
                  x: Array.from(
                    { length: averagedDataLeft.length },
                    (_, i) => i
                  ),
                  y: averagedDataLeft,
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: `Left Linecut ${linecut.id}`,
                  line: {
                    color:
                      leftImageColorPalette[
                        (linecut.id - 1) % leftImageColorPalette.length
                      ], // Cycle through the left image palette
                    width: 2,
                  },
                },
                // Plot for the right image
                {
                  x: Array.from(
                    { length: averagedDataRight.length },
                    (_, i) => i
                  ),
                  y: averagedDataRight,
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: `Right Linecut ${linecut.id}`,
                  line: {
                    color:
                      rightImageColorPalette[
                        (linecut.id - 1) % rightImageColorPalette.length
                      ], // Cycle through the right image palette
                    width: 2,
                  },
                },
              ];
            }),
        ]}
        layout={layout}
        config={{
          responsive: true, // Enables responsiveness
        }}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default HorizontalLinecutFig;
