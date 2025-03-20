import React, { useEffect, useRef, useState } from "react";
import Plot from "react-plotly.js";
import { DisplayOption } from "./RawDataOverviewAccordion";
import { PlotMouseEvent } from "plotly.js";
import ProgressBar from "./RawDataOverviewProgressBar"; // Import the ProgressBar component

interface RawDataOverviewFigProps {
  maxIntensities: number[];
  avgIntensities: number[];
  leftImageIndex: number | "";
  rightImageIndex: number | "";
  onSelectImages: (left: number | "", right: number | "") => void;
  isFetchingData?: boolean;
  displayOption: DisplayOption;
  imageNames?: string[];
  progress?: number; // Add progress prop
  progressMessage?: string; // Add progress message prop
}

interface Dimensions {
  width: number | undefined;
  height: number | undefined;
}

interface ContextMenuPosition {
  isVisible: boolean;
  pointIndex: number;
  x: number;
  y: number;
}

const RawDataOverviewFig: React.FC<RawDataOverviewFigProps> = ({
  maxIntensities,
  avgIntensities,
  leftImageIndex,
  rightImageIndex,
  onSelectImages,
  isFetchingData = false,
  displayOption = 'both',
  imageNames = [],
  progress = 0,
  progressMessage = 'Loading data...'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: undefined,
    height: undefined,
  });

  // State for context menu
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition>({
    isVisible: false,
    pointIndex: -1,
    x: 0,
    y: 0
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

  // Add global click listener to close context menu
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.isVisible) {
        setContextMenu(prev => ({ ...prev, isVisible: false }));
      }
    };

    // Add the event listener to the document
    document.addEventListener('click', handleGlobalClick);

    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu.isVisible]);

  // Handle point click for image selection
  const handlePointClick = (data: Readonly<PlotMouseEvent>) => {
    // Prevent immediate closing of the menu
    data.event.stopPropagation();

    if (data.points && data.points.length > 0) {
      const pointIndex = data.points[0].pointIndex;
      console.log(`Point clicked: ${pointIndex}`); // Debug log

      // Show context menu at click position
      setContextMenu({
        isVisible: true,
        pointIndex: pointIndex,
        x: data.event.clientX,
        y: data.event.clientY
      });
    }
  };

  // Handle menu option clicks
  const handleShowOnLeft = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation to document click

    // Direct update without loading state
    onSelectImages(contextMenu.pointIndex, rightImageIndex);

    // Close menu immediately
    setContextMenu(prev => ({ ...prev, isVisible: false }));
  };

  const handleShowOnRight = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent propagation to document click

    // Direct update without loading state
    onSelectImages(leftImageIndex, contextMenu.pointIndex);

    // Close menu immediately
    setContextMenu(prev => ({ ...prev, isVisible: false }));
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
        text: imageNames.length > 0 ? imageNames : undefined,
        hovertemplate: imageNames.length > 0
          ? 'Image %{x}<br>Name: %{text}<br>Max: %{y:.2f}<extra></extra>'
          : 'Image %{x}<br>Max: %{y:.2f}<extra></extra>',
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
        text: imageNames.length > 0 ? imageNames : undefined,
        hovertemplate: imageNames.length > 0
          ? 'Image %{x}<br>Name: %{text}<br>Avg: %{y:.2f}<extra></extra>'
          : 'Image %{x}<br>Avg: %{y:.2f}<extra></extra>',
      });
    }

    return data;
  };

  const plotData = createPlotData();

  // Generate a consistent UI revision ID based only on the data dimensions
  // This keeps zoom state consistent even when selected points change
  const uiRevisionId = `${maxIntensities.length}-${avgIntensities.length}-${displayOption}`;

  // Generate a data revision ID that includes selected points
  // This ensures marker highlighting updates when selections change
  const dataRevisionId = `${uiRevisionId}-${leftImageIndex}-${rightImageIndex}`;

  const layout = {
    width: dimensions.width,
    height: dimensions.height ? dimensions.height - 40 : undefined, // Adjust height to make room for progress bar
    title: {
      text: 'Intensity per Image Index',
      font: { size: 24 }
    },
    xaxis: {
      title: {
        text: 'Image Index',
        font: { size: 18 }
      },
      tickfont: { size: 18 },
      tickmode: 'linear' as const,
      dtick: Math.ceil(indices.length / 20)
    },
    yaxis: {
      title: {
        text: 'Intensity',
        font: { size: 18 }
      },
      tickfont: { size: 18 }
    },
    legend: {
      x: 10,
      y: 1,
      orientation: 'v' as const
    },
    hovermode: 'closest' as const,
    clickmode: 'event' as const, // Only trigger the click event, don't do any other action
    // The key feature: uirevision preserves UI state (like zoom) between updates
    // Only changes when the data dimensions change, not when selection changes
    uirevision: uiRevisionId,
    // But allow the plot to update when selection changes
    datarevision: dataRevisionId
  };

  // Determine if we should show the progress bar
  const showProgressBar = isFetchingData && progress < 100;

  return (
    <div ref={containerRef} className="w-full h-[400px] relative flex flex-col">
      {/* Progress Bar */}
      <div className="w-full p-2">
        <ProgressBar
          progress={progress}
          isVisible={showProgressBar}
          label={progressMessage}
        />
      </div>

      <div className="flex-grow relative">
        {isFetchingData && progress < 100 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-10">
            <div className="text-xl font-semibold">
              {progress > 0 ? `Loading... ${Math.round(progress)}%` : 'Initializing...'}
            </div>
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
              scrollZoom: true,
              doubleClick: 'reset',
            }}
            onClick={handlePointClick}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-gray-500">No data available</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.isVisible && (
        <div
          className="fixed z-[9999] bg-white shadow-lg rounded-md border border-gray-200"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            width: "250px"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 text-center text-base font-semibold border-b border-gray-200 bg-gray-50">
            {imageNames.length > contextMenu.pointIndex
              ? `Image: ${imageNames[contextMenu.pointIndex]}`
              : `Image #${contextMenu.pointIndex}`}
          </div>

          <div
            className="p-3 text-base hover:bg-blue-50 cursor-pointer transition-colors"
            onClick={handleShowOnLeft}
          >
            Show on Left
          </div>

          <div
            className="p-3 text-base hover:bg-blue-50 cursor-pointer transition-colors"
            onClick={handleShowOnRight}
          >
            Show on Right
          </div>
        </div>
      )}
    </div>
  );
};

export default RawDataOverviewFig;
