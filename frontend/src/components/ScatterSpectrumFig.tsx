import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { DisplayOption } from "./ScatterSpectrumAccordion";

interface ScatterSpectrumFigProps {
  maxIntensities: number[];
  avgIntensities: number[];
  leftImageIndex: number | "";
  rightImageIndex: number | "";
  onSelectImages: (left: number | "", right: number | "") => void;
  isLoading: boolean;
  displayOption: DisplayOption;
}

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

const ScatterSpectrumFig: React.FC<ScatterSpectrumFigProps> = ({
  maxIntensities,
  avgIntensities,
  leftImageIndex,
  rightImageIndex,
  onSelectImages,
  isLoading,
  displayOption = 'both'
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

  // Define the type for Plotly click event data
  interface PlotlyClickEvent {
    points: Array<{
      pointIndex: number;
      pointNumber: number;
      curveNumber: number;
      x: number;
      y: number;
      data: any;
    }>;
    event: MouseEvent;
  }

  // Handle point click for image selection
  const handlePointClick = (data: PlotlyClickEvent) => {
    const pointIndex = data.points[0].pointIndex;

    // Already selected as left or right image
    if (pointIndex === leftImageIndex || pointIndex === rightImageIndex) {
      return;
    }

    // If left image isn't set, set it first
    if (typeof leftImageIndex !== 'number') {
      onSelectImages(pointIndex, rightImageIndex);
    } else if (typeof rightImageIndex !== 'number') {
      // If right image isn't set, set it
      onSelectImages(leftImageIndex, pointIndex);
    } else {
      // Both are set, replace right image
      onSelectImages(leftImageIndex, pointIndex);
    }
  };

  // Create x-axis values (image indices)
  const indices = Array.from({ length: maxIntensities.length }, (_, i) => i);

  // Function to create marker styling
  const createMarkerStyling = (indices: number[]) => {
    return {
      size: 10,
      line: {
        width: indices.map(i => (i === leftImageIndex || i === rightImageIndex) ? 2 : 0),
        color: indices.map(i => (i === leftImageIndex) ? 'red' : (i === rightImageIndex) ? 'blue' : 'rgba(0,0,0,0)')
      }
    };
  };

  // Create plot data based on display option
  const createPlotData = () => {
    const data = [];

    if (displayOption === 'both' || displayOption === 'max') {
      data.push({
        x: indices,
        y: maxIntensities,
        mode: 'lines+markers' as const,
        type: 'scatter' as const,
        name: 'Max Intensity',
        marker: {
          ...createMarkerStyling(indices),
          color: 'rgb(31, 119, 180)'
        },
        hovertemplate: 'Image %{x}<br>Max: %{y:.2f}<extra></extra>',
      });
    }

    if (displayOption === 'both' || displayOption === 'avg') {
      data.push({
        x: indices,
        y: avgIntensities,
        mode: 'lines+markers' as const,
        type: 'scatter' as const,
        name: 'Avg Intensity',
        marker: {
          ...createMarkerStyling(indices),
          color: 'rgb(255, 127, 14)'
        },
        hovertemplate: 'Image %{x}<br>Avg: %{y:.2f}<extra></extra>',
      });
    }

    return data;
  };

  const plotData = createPlotData();

  const layout = {
    width: dimensions.width,
    height: dimensions.height,
    title: {
      text: 'Intensity per Image Index',
      font: { size: 24 }
    },
    xaxis: {
      title: {
        text: 'Image Index',
        font: { size: 18 }
      },
      tickmode: 'linear' as const,
      dtick: Math.ceil(indices.length / 20) // Dynamically adjust tick spacing
    },
    yaxis: {
      title: {
        text: 'Intensity',
        font: { size: 18 }
      },
    },
    legend: {
      x: 0,
      y: 1,
      orientation: 'h' as const
    },
    hovermode: 'closest' as const,
  };

  return (
    <div ref={containerRef} className="w-full h-[400px] relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-10">
          <div className="text-xl font-semibold">Loading...</div>
        </div>
      )}
      {maxIntensities.length > 0 || avgIntensities.length > 0 ? (
        <Plot
          data={plotData}
          layout={layout}
          config={{
            displayModeBar: true,
            responsive: true,
            displaylogo: false,
          }}
          onClick={(data) => handlePointClick(data)}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-xl text-gray-500">No spectrum data available</p>
        </div>
      )}
    </div>
  );
};

export default ScatterSpectrumFig;
