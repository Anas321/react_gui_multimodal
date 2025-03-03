import { Linecut, InclinedLinecut } from "../types";
import { calculateInclinedLineEndpoints } from "./calculateInclinedLinecutEndpoints";

interface GenerateLinecutParams {
  linecut: Linecut;
  currentArray: number[][];
  factor: number | null;
  imageWidth?: number;
  imageHeight?: number;
  qYVector?: number[]; // Add qYVector for q-value mapping
  qXVector?: number[]; // Add qXVector for q-value mapping
  units?: string;     // Add units for labels
}

// Helper function to find pixel position from q-value
function findPixelPositionForQValue(qValue: number, qVector: number[]): number {
  if (!qVector || qVector.length === 0) {
    return qValue; // Fallback to using the value directly if no mapping is available
  }

  // Find the index of the closest q-value in the qVector
  let closestIndex = 0;
  let smallestDifference = Math.abs(qVector[0] - qValue);

  for (let i = 1; i < qVector.length; i++) {
    const difference = Math.abs(qVector[i] - qValue);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestIndex = i;
    }
  }

  return closestIndex; // Return the corresponding pixel position
}

export function generateHorizontalLinecutOverlay({
  linecut,
  currentArray,
  factor,
  qYVector = [],
}: GenerateLinecutParams) {
  if (!currentArray.length || factor === null) return [];

  const imageHeight = currentArray.length;
  const imageWidth = currentArray[0]?.length || 0;

  // Use pixelPosition directly if available, otherwise convert from q-value
  const pixelPosition = 'pixelPosition' in linecut && linecut.pixelPosition !== undefined
    ? linecut.pixelPosition
    : findPixelPositionForQValue(linecut.position, qYVector);

  // Calculate the width in pixel space
  let pixelWidth = 0;

  // Only calculate width if it's greater than zero
  if (linecut.width > 0) {
    // Find pixel positions for both edges of the width band
    const upperQValue = linecut.position + linecut.width / 2;
    const lowerQValue = linecut.position - linecut.width / 2;
    const upperPixel = findPixelPositionForQValue(upperQValue, qYVector);
    const lowerPixel = findPixelPositionForQValue(lowerQValue, qYVector);
    pixelWidth = Math.abs(upperPixel - lowerPixel);
  }

  // Scale for display based on resolution factor
  const scaledPosition = pixelPosition / factor;
  const scaledWidth = pixelWidth / factor;

  // Create the overlay boundary
  let yTop, yBottom;

  if (pixelWidth === 0) {
    // For zero width, just draw the central line (no band)
    yTop = scaledPosition;
    yBottom = scaledPosition;
  } else {
    // For non-zero width, draw a band
    yTop = Math.max(0, scaledPosition - scaledWidth / 2);
    yBottom = Math.min(imageHeight, scaledPosition + scaledWidth / 2);
  }

  // Format the position label
  const positionLabel = `${linecut.position.toFixed(1)}`;

  const overlays = [
    // Left image overlays
    {
      x: [0, imageWidth, imageWidth, 0],
      y: [yTop, yTop, yBottom, yBottom],
      mode: "lines",
      fill: "toself",
      fillcolor: linecut.leftColor,
      line: { color: linecut.leftColor },
      opacity: pixelWidth === 0 ? 0 : 0.3,  // Hide fill for zero width
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
    },
    {
      x: [0, imageWidth],
      y: [scaledPosition, scaledPosition],
      mode: "lines",
      line: { color: linecut.leftColor, width: 1 },
      opacity: 0.75,
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
    },
    {
      x: [-imageWidth * 0.03],  // Position text slightly to the left of the image
      y: [scaledPosition],
      mode: "text",
      text: [positionLabel],
      textfont: { size: 25 },  // Larger text
      textposition: "middle left",
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
    },
    // Right image overlays
    {
      x: [0, imageWidth, imageWidth, 0],
      y: [yTop, yTop, yBottom, yBottom],
      mode: "lines",
      fill: "toself",
      fillcolor: linecut.rightColor,
      line: { color: linecut.rightColor },
      opacity: pixelWidth === 0 ? 0 : 0.3,  // Hide fill for zero width
      xaxis: "x2",
      yaxis: "y2",
      showlegend: false,
    },
    {
      x: [0, imageWidth],
      y: [scaledPosition, scaledPosition],
      mode: "lines",
      line: { color: linecut.rightColor, width: 1 },
      opacity: 0.75,
      xaxis: "x2",
      yaxis: "y2",
      showlegend: false,
    },
    {
      x: [-imageWidth * 0.03],
      y: [scaledPosition],
      mode: "text",
      text: [positionLabel],
      textfont: { size: 25 },
      textposition: "middle left",
      xaxis: "x2",
      yaxis: "y2",
      showlegend: false,
    }
  ];

  return overlays;
}

export function generateVerticalLinecutOverlay({
  linecut,
  currentArray,
  factor,
  qXVector = [],
}: GenerateLinecutParams) {
  if (!currentArray.length || factor === null) return [];

  const imageHeight = currentArray.length;
  const imageWidth = currentArray[0]?.length || 0;

  // Use pixelPosition directly if available, otherwise convert from q-value
  const pixelPosition = 'pixelPosition' in linecut && linecut.pixelPosition !== undefined
    ? linecut.pixelPosition
    : findPixelPositionForQValue(linecut.position, qXVector);

  // Calculate the width in pixel space based on q-values
  let pixelWidth = 0;

  // Only calculate width if it's greater than zero
  if (linecut.width > 0) {
    // Find pixel positions for both edges of the width band
    const upperQValue = linecut.position + linecut.width / 2;
    const lowerQValue = linecut.position - linecut.width / 2;
    const upperPixel = findPixelPositionForQValue(upperQValue, qXVector);
    const lowerPixel = findPixelPositionForQValue(lowerQValue, qXVector);
    pixelWidth = Math.abs(upperPixel - lowerPixel);
  }

  // Scale for display based on resolution factor
  const scaledPosition = pixelPosition / factor;
  const scaledWidth = pixelWidth / factor;

  // Create the overlay boundary
  let xLeft, xRight;

  if (pixelWidth === 0) {
    // For zero width, just draw the central line (no band)
    xLeft = scaledPosition;
    xRight = scaledPosition;
  } else {
    // For non-zero width, draw a band
    xLeft = Math.max(0, scaledPosition - scaledWidth / 2);
    xRight = Math.min(imageWidth, scaledPosition + scaledWidth / 2);
  }

  // Format the position label with q-value
  const positionLabel = `${linecut.position.toFixed(1)}`;

  return [
    // Left image overlays
    {
      x: [xLeft, xRight, xRight, xLeft],
      y: [0, 0, imageHeight, imageHeight],
      mode: "lines",
      fill: "toself",
      fillcolor: linecut.leftColor,
      line: { color: linecut.leftColor },
      opacity: pixelWidth === 0 ? 0 : 0.3,  // Hide fill for zero width
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
    },
    {
      x: [scaledPosition, scaledPosition],
      y: [0, imageHeight],
      mode: "lines",
      line: { color: linecut.leftColor, width: 1 },
      opacity: 0.75,
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
    },
    {
      x: [scaledPosition],
      y: [imageHeight * 1.01],  // Position text slightly above the image
      mode: "text",
      text: [positionLabel],
      textfont: { size: 25 },  // Larger text
      textposition: "bottom center",
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
    },
    // Right image overlays
    {
      x: [xLeft, xRight, xRight, xLeft],
      y: [0, 0, imageHeight, imageHeight],
      mode: "lines",
      fill: "toself",
      fillcolor: linecut.rightColor,
      line: { color: linecut.rightColor },
      opacity: pixelWidth === 0 ? 0 : 0.3,  // Hide fill for zero width
      xaxis: "x2",
      yaxis: "y2",
      showlegend: false,
    },
    {
      x: [scaledPosition, scaledPosition],
      y: [0, imageHeight],
      mode: "lines",
      line: { color: linecut.rightColor, width: 1 },
      opacity: 0.75,
      xaxis: "x2",
      yaxis: "y2",
      showlegend: false,
    },
    {
      x: [scaledPosition],
      y: [imageHeight * 1.01],  // Position text slightly above the image
      mode: "text",
      text: [positionLabel],
      textfont: { size: 25 },  // Larger text
      textposition: "bottom center",
      xaxis: "x2",
      yaxis: "y2",
      showlegend: false,
    }
  ];
}

interface GenerateInclinedLinecutParams {
  linecut: InclinedLinecut;
  currentArray: number[][];
  factor: number | null;
  imageWidth: number;
  imageHeight: number;
}

export function generateInclinedLinecutOverlay({
  linecut,
  currentArray,
  factor,
  imageWidth,
  imageHeight
}: GenerateInclinedLinecutParams) {
  if (!currentArray.length || factor === null) return [];

  // Get the central line endpoints
  const endpoints = calculateInclinedLineEndpoints({
    linecut,
    imageWidth,
    imageHeight
  });

  if (!endpoints) return [];
  const { x0, y0, x1, y1 } = endpoints;

  // Calculate perpendicular vector for the width envelope
  const radians = (linecut.angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = -Math.sin(radians);

  // Calculate perpendicular unit vector
  const perpDx = -dy;
  const perpDy = dx;

  // Scale the width
  const halfWidth = linecut.width / 2;

  // Calculate envelope points perpendicular to the line
  const envelopePoints = {
    x: [
      x0 + perpDx * halfWidth,
      x1 + perpDx * halfWidth,
      x1 - perpDx * halfWidth,
      x0 - perpDx * halfWidth,
      x0 + perpDx * halfWidth // Close the path
    ],
    y: [
      y0 + perpDy * halfWidth,
      y1 + perpDy * halfWidth,
      y1 - perpDy * halfWidth,
      y0 - perpDy * halfWidth,
      y0 + perpDy * halfWidth // Close the path
    ]
  };

  // Create overlays for both axes
  const createOverlaysForAxis = (color: string, axisNumber: number) => [
    // Width envelope
    {
      x: envelopePoints.x,
      y: envelopePoints.y,
      mode: 'lines',
      fill: 'toself',
      fillcolor: color,
      line: { color },
      opacity: 0.3,
      xaxis: `x${axisNumber}`,
      yaxis: `y${axisNumber}`,
      showlegend: false,
      hoverinfo: 'skip'
    },
    // Central line
    {
      x: [x0, x1],
      y: [y0, y1],
      mode: 'lines',
      line: { color, width: 2 },
      opacity: 0.75,
      xaxis: `x${axisNumber}`,
      yaxis: `y${axisNumber}`,
      showlegend: false,
      hoverinfo: 'skip'
    },
    // Center point
    {
      x: [linecut.xPosition],
      y: [linecut.yPosition],
      mode: 'markers',
      marker: {
        color: color,
        size: 10,
        symbol: 'circle',
      },
      opacity: 0.75,
      xaxis: `x${axisNumber}`,
      yaxis: `y${axisNumber}`,
      showlegend: false,
      hoverinfo: 'skip'
    },
  ];

  return [
    ...createOverlaysForAxis(linecut.leftColor, 1),
    ...createOverlaysForAxis(linecut.rightColor, 2)
  ];
}
