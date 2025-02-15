
import { AzimuthalIntegration, AzimuthalData } from '../types';

// Define the structure for input parameters
interface GenerateAzimuthalOverlayParams {
    integration: AzimuthalIntegration;
    azimuthalData: AzimuthalData;
    axisNumber: number;
    factor: number;
    currentArray: number[][];
    maxQValue: number;
    beamCenterX?: number;
    beamCenterY?: number;
}

// Interface for circle point visualization
interface PointTrace {
    type: 'scatter';
    x: number[];
    y: number[];
    mode: 'markers';
    marker: {
        color: string;
        size: number;
    };
    opacity: number;
    xaxis: string;
    yaxis: string;
    showlegend: boolean;
}

// Interface for marker-based vector visualization
interface VectorMarkerTrace {
    type: 'scatter';
    x: number[];
    y: number[];
    mode: 'markers';
    marker: {
        color: string;
        size: number;
        symbol: string;
        angle: number;
    };
    opacity: number;
    xaxis: string;
    yaxis: string;
    showlegend: boolean;
}

// Combined type for all possible traces
type PlotTrace = PointTrace | VectorMarkerTrace;

// Helper function to find intersection points with Q-value circles
function findIntersectionPoint(angle: number, radius: number, beamCenter: {x: number, y: number}): {x: number, y: number} {
    const radians = (angle * Math.PI) / 180;
    return {
        x: beamCenter.x + radius * Math.cos(-radians),
        y: beamCenter.y - radius * Math.sin(-radians)
    };
}

// Helper function to calculate radius from beam center
function calculateRadius(point: {x: number, y: number}, beamCenter: {x: number, y: number}): number {
    const dx = point.x - beamCenter.x;
    const dy = point.y - beamCenter.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Helper function to find points in 2D array matching a condition
function findWhere(array2D: number[][], condition: (val: number) => boolean): [number[], number[]] {
    const xIndices = [];
    const yIndices = [];

    for (let i = 0; i < array2D.length; i++) {
        for (let j = 0; j < array2D[i].length; j++) {
            if (condition(array2D[i][j])) {
                yIndices.push(i);
                xIndices.push(j);
            }
        }
    }

    return [yIndices, xIndices];
}

// Helper function to generate evenly spaced points
function generatePoints(start: number, end: number, count: number): number[] {
    const points = [];
    const step = (end - start) / (count - 1);
    for (let i = 0; i < count; i++) {
        points.push(start + step * i);
    }
    return points;
}

// Main function to generate azimuthal overlay
export function generateAzimuthalOverlay({
    integration,
    azimuthalData,
    axisNumber,
    factor,
    currentArray,
    maxQValue,
    beamCenterX = 317.8,
    beamCenterY = 1245.28,
}: GenerateAzimuthalOverlayParams): PlotTrace[] {
    // Early return if no data available
    if (!currentArray.length || !azimuthalData) return [];

    // Set up Q-value parameters
    const qArray = azimuthalData.qArray;
    const tolerance = 0.1;
    const innerQ = integration.qRange ? integration.qRange[0] : 0;
    const outerQ = integration.qRange ? integration.qRange[1] : maxQValue;

    // Find points matching Q values
    const [innerY, innerX] = findWhere(qArray, val => Math.abs(val - innerQ) < tolerance);
    const [outerY, outerX] = findWhere(qArray, val => Math.abs(val - outerQ) < tolerance);

    // Calculate radii from beam center
    const beamCenter = { x: beamCenterX, y: beamCenterY };
    let innerRadius = Infinity;
    let outerRadius = 0;

    // Find minimum inner radius
    for (let i = 0; i < innerX.length; i++) {
        const radius = calculateRadius({x: innerX[i], y: innerY[i]}, beamCenter);
        innerRadius = Math.min(innerRadius, radius);
    }

    // Find maximum outer radius
    for (let i = 0; i < outerX.length; i++) {
        const radius = calculateRadius({x: outerX[i], y: outerY[i]}, beamCenter);
        outerRadius = Math.max(outerRadius, radius);
    }

    // Get angular range and check if it's a full circle
    const [startAngle, endAngle] = integration.azimuthRange;
    const isFullCircle = Math.abs(endAngle - startAngle) >= 360;
    const color = axisNumber === 1 ? integration.leftColor : integration.rightColor;

    // Initialize traces with circle points
    const traces: PlotTrace[] = [
        // Inner circle points
        {
            type: 'scatter',
            x: innerX.map(x => x / factor),
            y: innerY.map(y => y / factor),
            mode: 'markers',
            marker: { color, size: 2 },
            opacity: 0.75,
            xaxis: `x${axisNumber}`,
            yaxis: `y${axisNumber}`,
            showlegend: false,
        },
        // Outer circle points
        {
            type: 'scatter',
            x: outerX.map(x => x / factor),
            y: outerY.map(y => y / factor),
            mode: 'markers',
            marker: { color, size: 2 },
            opacity: 0.75,
            xaxis: `x${axisNumber}`,
            yaxis: `y${axisNumber}`,
            showlegend: false,
        }
    ];

    // Add azimuthal line markers if not a full circle
    if (!isFullCircle) {
        // Number of points to generate along each azimuthal line
        const numPoints = 100;

        // Generate radii points
        const radii = generatePoints(innerRadius, outerRadius, numPoints);

        // Create points for start azimuthal line
        const startPoints = radii.map(radius => {
            const point = findIntersectionPoint(startAngle, radius, beamCenter);
            return {
                x: point.x / factor < 0
                ? NaN
                : point.x / factor > currentArray[0].length
                ? NaN
                : point.x / factor,

                y: point.y / factor < 0
                ? NaN
                : point.y / factor > currentArray.length
                ? NaN
                : point.y / factor
            };
        });

        // Create points for end azimuthal line
        const endPoints = radii.map(radius => {
            const point = findIntersectionPoint(endAngle, radius, beamCenter);
            return {
                x: point.x / factor < 0
                ? NaN
                : point.x / factor > currentArray[0].length
                ? NaN
                : point.x / factor,

                y: point.y / factor < 0
                ? NaN
                : point.y / factor > currentArray.length
                ? NaN
                : point.y / factor
            };
        });

        // Add start line markers
        const startLineMarkers: VectorMarkerTrace = {
            type: 'scatter',
            x: startPoints.map(p => p.x),
            y: startPoints.map(p => p.y),
            mode: 'markers',
            marker: {
                color,
                size: 4,
                symbol: 'circle',
                angle: startAngle
            },
            opacity: 0.75,
            xaxis: `x${axisNumber}`,
            yaxis: `y${axisNumber}`,
            showlegend: false
        };

        // Add end line markers
        const endLineMarkers: VectorMarkerTrace = {
            type: 'scatter',
            x: endPoints.map(p => p.x),
            y: endPoints.map(p => p.y),
            mode: 'markers',
            marker: {
                color,
                size: 4,
                symbol: 'circle',
                angle: endAngle
            },
            opacity: 0.75,
            xaxis: `x${axisNumber}`,
            yaxis: `y${axisNumber}`,
            showlegend: false
        };

        // Add both marker sets to traces
        traces.push(startLineMarkers, endLineMarkers);
    }

    return traces;
}
