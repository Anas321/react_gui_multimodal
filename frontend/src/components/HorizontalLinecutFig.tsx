import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { Linecut } from "../types";

interface HorizontalLinecutFigProps {
  linecuts: Linecut[]; // List of linecuts with positions and colors
  linecutData1: { id: number; data: number[] }[]; // Data for left scatter image
  linecutData2: { id: number; data: number[] }[]; // Data for right scatter image
  leftImageColorPalette: string[]; // Color palette for the left image
  rightImageColorPalette: string[]; // Color palette for the right image
}

const HorizontalLinecutFig: React.FC<HorizontalLinecutFigProps> = ({
  linecuts,
  linecutData1,
  linecutData2,
  leftImageColorPalette,
  rightImageColorPalette,
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

  return (
    <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow">
      <Plot
        data={[
          // Map through all visible linecuts and add their data to the plot
          ...linecuts
            .filter((linecut) => !linecut.hidden) // Only include visible linecuts
            .flatMap((linecut) => {
              // Find the corresponding data for left and right images
              const linecutDataLeft = linecutData1.find((d) => d.id === linecut.id);
              const linecutDataRight = linecutData2.find((d) => d.id === linecut.id);

              return [
                // Plot for the left image
                {
                  x: Array.from(
                    { length: linecutDataLeft?.data.length || 0 },
                    (_, i) => i
                  ),
                  y: linecutDataLeft?.data || [],
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
                    { length: linecutDataRight?.data.length || 0 },
                    (_, i) => i
                  ),
                  y: linecutDataRight?.data || [],
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
