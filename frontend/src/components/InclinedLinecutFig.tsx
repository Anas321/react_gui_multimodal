import React, { useEffect, useRef, useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Linecut } from '../types';

interface InclinedLinecutFigProps {
    linecuts: Linecut[];
    imageData1: number[][];
    imageData2: number[][];
    inclinedLinecutData1: { id: number; data: number[] }[] | undefined;
    inclinedLinecutData2: { id: number; data: number[] }[] | undefined;
    zoomedXPixelRange: [number, number] | null;
    zoomedYPixelRange: [number, number] | null;
}

interface Dimensions {
    width: number | undefined;
    height: number | undefined;
}

const InclinedLinecutFig: React.FC<InclinedLinecutFigProps> = ({
    linecuts,
    imageData1,
    imageData2,
    inclinedLinecutData1,
    inclinedLinecutData2,
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

    // Compute path distance with better precision
    const computePathDistance = (lineLength: number): number[] => {
        return Array.from({ length: Math.ceil(lineLength) }, (_, i) => i);
    };

    // Memoize plot data
    const plotData = useMemo(() => {
        // Compute line length considering both images
        const computeLineLength = (x: number, y: number, angle: number): number => {
            const radians = (angle * Math.PI) / 180;
            const dx = Math.cos(radians);
            const dy = Math.sin(radians);

            // Small number to prevent division by zero
            const epsilon = 1e-10;

            // Calculate maximum bounds considering both images
            const maxHeight = Math.max(imageData1.length, imageData2.length);
            const maxWidth = Math.max(imageData1[0].length, imageData2[0].length);

            let length;
            if (Math.abs(dx) < epsilon) {
                // Nearly vertical line
                length = Math.abs((maxHeight - y) / dy);
            } else if (Math.abs(dy) < epsilon) {
                // Nearly horizontal line
                length = Math.abs((maxWidth - x) / dx);
            } else {
                // General case
                const lengthX = dx > 0
                    ? (maxWidth - x) / dx
                    : -x / dx;
                const lengthY = dy > 0
                    ? (maxHeight - y) / dy
                    : -y / dy;
                length = Math.min(Math.abs(lengthX), Math.abs(lengthY));
            }

            return Math.max(0, length); // Ensure non-negative length
        };

        return linecuts
            .filter((linecut) => !linecut.hidden)
            .flatMap((linecut) => {
                // Find corresponding data
                const data1 = inclinedLinecutData1?.find(d => d.id === linecut.id)?.data ?? [];
                const data2 = inclinedLinecutData2?.find(d => d.id === linecut.id)?.data ?? [];

                const length = computeLineLength(
                    linecut.position,
                    linecut.positionY ?? 0,
                    linecut.angle ?? 0
                );

                const pathDistance = computePathDistance(length);

                return [
                    {
                        x: pathDistance,
                        y: data1,
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        name: `Left Linecut ${linecut.id}`,
                        line: {
                            color: linecut.leftColor,
                            width: 2,
                        },
                        hovertemplate: 'Distance: %{x:.1f}<br>Intensity: %{y:.1f}<extra></extra>'
                    },
                    {
                        x: pathDistance,
                        y: data2,
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        name: `Right Linecut ${linecut.id}`,
                        line: {
                            color: linecut.rightColor,
                            width: 2,
                        },
                        hovertemplate: 'Distance: %{x:.1f}<br>Intensity: %{y:.1f}<extra></extra>'
                    },
                ];
            });
    }, [linecuts, inclinedLinecutData1, inclinedLinecutData2, imageData1, imageData2]);

    // Memoize layout with zoom support
    const layout = useMemo(() => {
        const baseLayout = {
            width: dimensions.width,
            height: dimensions.height,
            xaxis: {
                title: { text: 'Distance Along Line (pixels)', font: { size: 25 } },
                tickfont: { size: 25 },
                autorange: !zoomedXPixelRange,
                range: zoomedXPixelRange ?? undefined,
            },
            yaxis: {
                title: { text: 'Intensity', font: { size: 25 }, standoff: 50 },
                tickfont: { size: 25 },
                autorange: !zoomedYPixelRange,
                range: zoomedYPixelRange ?? undefined,
            },
            margin: { l: 110, r: 20, t: 20, b: 80 },
            legend: {
                font: { size: 25 },
                xanchor: 'right' as const,
                yanchor: 'top' as const,
                x: 0.98,
                y: 0.98
            },
            font: { size: 25 },
            showlegend: true,
            hovermode: 'closest' as const,
        };

        return baseLayout;
    }, [dimensions, zoomedXPixelRange, zoomedYPixelRange]);

    return (
        <div ref={containerRef} className="mt-4 p-4 bg-gray-100 rounded shadow min-h-[500px]">
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
                    toImageButtonOptions: {
                        format: 'svg',
                        filename: 'inclined_linecut_plot',
                        height: 1080,
                        width: 1920,
                        scale: 1
                    }
                }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default InclinedLinecutFig;
