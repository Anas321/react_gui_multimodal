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

// interface GenerateInclinedLinecutParams {
//   linecut: InclinedLinecut;
//   currentArray: number[][];
//   factor: number | null;
//   imageWidth: number;
//   imageHeight: number;
// }

// export function generateInclinedLinecutOverlay({
//   linecut,
//   currentArray,
//   factor,
//   imageWidth,
//   imageHeight
// }: GenerateInclinedLinecutParams) {
//   if (!currentArray.length || factor === null) return [];

//   // Get the central line endpoints
//   const endpoints = calculateInclinedLineEndpoints({
//     linecut,
//     imageWidth,
//     imageHeight
//   });

//   if (!endpoints) return [];
//   const { x0, y0, x1, y1 } = endpoints;

//   // Calculate perpendicular vector for the width envelope
//   const radians = (linecut.angle * Math.PI) / 180;
//   const dx = Math.cos(radians);
//   const dy = -Math.sin(radians);

//   // Calculate perpendicular unit vector
//   const perpDx = -dy;
//   const perpDy = dx;

//   // Scale the width
//   const halfWidth = linecut.width / 2;

//   // Calculate envelope points perpendicular to the line
//   const envelopePoints = {
//     x: [
//       x0 + perpDx * halfWidth,
//       x1 + perpDx * halfWidth,
//       x1 - perpDx * halfWidth,
//       x0 - perpDx * halfWidth,
//       x0 + perpDx * halfWidth // Close the path
//     ],
//     y: [
//       y0 + perpDy * halfWidth,
//       y1 + perpDy * halfWidth,
//       y1 - perpDy * halfWidth,
//       y0 - perpDy * halfWidth,
//       y0 + perpDy * halfWidth // Close the path
//     ]
//   };

//   // Create overlays for both axes
//   const createOverlaysForAxis = (color: string, axisNumber: number) => [
//     // Width envelope
//     {
//       x: envelopePoints.x,
//       y: envelopePoints.y,
//       mode: 'lines',
//       fill: 'toself',
//       fillcolor: color,
//       line: { color },
//       opacity: 0.3,
//       xaxis: `x${axisNumber}`,
//       yaxis: `y${axisNumber}`,
//       showlegend: false,
//       hoverinfo: 'skip'
//     },
//     // Central line
//     {
//       x: [x0, x1],
//       y: [y0, y1],
//       mode: 'lines',
//       line: { color, width: 2 },
//       opacity: 0.75,
//       xaxis: `x${axisNumber}`,
//       yaxis: `y${axisNumber}`,
//       showlegend: false,
//       hoverinfo: 'skip'
//     },
//     // Center point
//     {
//       x: [linecut.xPosition],
//       y: [linecut.yPosition],
//       mode: 'markers',
//       marker: {
//         color: color,
//         size: 10,
//         symbol: 'circle',
//       },
//       opacity: 0.75,
//       xaxis: `x${axisNumber}`,
//       yaxis: `y${axisNumber}`,
//       showlegend: false,
//       hoverinfo: 'skip'
//     },
//   ];

//   return [
//     ...createOverlaysForAxis(linecut.leftColor, 1),
//     ...createOverlaysForAxis(linecut.rightColor, 2)
//   ];
// }

interface GenerateInclinedLinecutParams {
  linecut: InclinedLinecut;
  currentArray: number[][];
  factor: number | null;
  imageWidth: number;
  imageHeight: number;
  qXVector?: number[];
  qYVector?: number[];
}


// export function generateInclinedLinecutOverlay({
//   linecut,
//   currentArray,
//   factor,
//   imageWidth,
//   imageHeight,
//   qXVector,
//   qYVector
// }: GenerateInclinedLinecutParams) {
//   if (!currentArray.length || factor === null) return [];

//   // Convert qXPosition and qYPosition to pixel positions
//   // Find closest pixel positions for the q-values
//   const pixelX = findPixelPositionForQValue(linecut.qXPosition, qXVector || []);
//   const pixelY = findPixelPositionForQValue(linecut.qYPosition, qYVector || []);

//   // Convert q-width to pixel width - find the approximate pixels per q-unit
//   let pixelsPerQUnit = 1; // Default fallback

//   if (qXVector && qXVector.length > 1) {
//     // Estimate pixels per q-unit using the difference between adjacent points
//     const qDiff = Math.abs(qXVector[1] - qXVector[0]);
//     pixelsPerQUnit = qDiff > 0 ? 1 / qDiff : 1;
//   }

//   const pixelWidth = linecut.qWidth * pixelsPerQUnit;

//   // Create a temporary linecut with pixel coordinates for endpoint calculation
//   const pixelLinecut: InclinedLinecut = {
//     ...linecut,
//     xPosition: pixelX,
//     yPosition: pixelY,
//     width: pixelWidth
//   };

//   // Get the central line endpoints
//   const endpoints = calculateInclinedLineEndpoints({
//     linecut: pixelLinecut,
//     imageWidth,
//     imageHeight
//   });

//   if (!endpoints) return [];
//   const { x0, y0, x1, y1 } = endpoints;

//   // Apply resolution downsampling factor
//   const scaledX0 = x0 / factor;
//   const scaledY0 = y0 / factor;
//   const scaledX1 = x1 / factor;
//   const scaledY1 = y1 / factor;
//   const scaledCenterX = pixelX / factor;
//   const scaledCenterY = pixelY / factor;

//   // Calculate perpendicular vector for the width envelope
//   const radians = (linecut.angle * Math.PI) / 180;
//   const dx = Math.cos(radians);
//   const dy = -Math.sin(radians);

//   // Calculate perpendicular unit vector
//   const perpDx = -dy;
//   const perpDy = dx;

//   // Scale width for display
//   const halfWidth = (pixelWidth / 2) / factor;

//   // Calculate envelope points perpendicular to the line
//   const envelopePoints = {
//     x: [
//       scaledX0 + perpDx * halfWidth,
//       scaledX1 + perpDx * halfWidth,
//       scaledX1 - perpDx * halfWidth,
//       scaledX0 - perpDx * halfWidth,
//       scaledX0 + perpDx * halfWidth // Close the path
//     ],
//     y: [
//       scaledY0 + perpDy * halfWidth,
//       scaledY1 + perpDy * halfWidth,
//       scaledY1 - perpDy * halfWidth,
//       scaledY0 - perpDy * halfWidth,
//       scaledY0 + perpDy * halfWidth // Close the path
//     ]
//   };

//   // Create overlays for both axes
//   const createOverlaysForAxis = (color: string, axisNumber: number) => [
//     // Width envelope
//     {
//       x: envelopePoints.x,
//       y: envelopePoints.y,
//       mode: 'lines',
//       fill: 'toself',
//       fillcolor: color,
//       line: { color },
//       opacity: linecut.qWidth > 0 ? 0.3 : 0, // Hide fill for zero width
//       xaxis: `x${axisNumber}`,
//       yaxis: `y${axisNumber}`,
//       showlegend: false,
//       hoverinfo: 'skip'
//     },
//     // Central line
//     {
//       x: [scaledX0, scaledX1],
//       y: [scaledY0, scaledY1],
//       mode: 'lines',
//       line: { color, width: 2 },
//       opacity: 0.75,
//       xaxis: `x${axisNumber}`,
//       yaxis: `y${axisNumber}`,
//       showlegend: false,
//       hoverinfo: 'skip'
//     },
//     // Center point
//     {
//       x: [scaledCenterX],
//       y: [scaledCenterY],
//       mode: 'markers',
//       marker: {
//         color: color,
//         size: 8,
//         symbol: 'circle',
//       },
//       opacity: 0.75,
//       xaxis: `x${axisNumber}`,
//       yaxis: `y${axisNumber}`,
//       showlegend: false,
//       hoverinfo: 'skip'
//     },
//   ];

//   return [
//     ...createOverlaysForAxis(linecut.leftColor, 1),
//     ...createOverlaysForAxis(linecut.rightColor, 2)
//   ];
// }


export function generateInclinedLinecutOverlay({
  linecut,
  currentArray,
  factor,
  imageWidth,
  imageHeight,
  qXVector,
  qYVector
}: GenerateInclinedLinecutParams) {
  if (!currentArray.length || factor === null) return [];

  // Convert q-coordinates to pixel coordinates
  const findPixelPosition = (qValue: number, qVector: number[] | undefined, defaultPosition: number): number => {
    if (!qVector || qVector.length === 0) return defaultPosition;

    let closestIndex = 0;
    let minDiff = Math.abs(qVector[0] - qValue);

    for (let i = 1; i < qVector.length; i++) {
      const diff = Math.abs(qVector[i] - qValue);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  // Get center position in pixel coordinates
  const pixelX = findPixelPosition(linecut.qXPosition, qXVector, Math.floor(imageWidth / 2));
  const pixelY = findPixelPosition(linecut.qYPosition, qYVector, Math.floor(imageHeight / 2));

  // Convert q-width to pixel width
  // A simple approach - find pixel distance between qPosition and qPosition+qWidth
  let pixelWidth = 5; // Default minimum width
  if (linecut.qWidth > 0 && qXVector && qXVector.length > 0) {
    const qWidthPosition = linecut.qXPosition + linecut.qWidth;
    const widthPixelPosition = findPixelPosition(qWidthPosition, qXVector, pixelX + 5);
    pixelWidth = Math.abs(widthPixelPosition - pixelX);
    // Ensure a minimum width for visibility
    pixelWidth = Math.max(pixelWidth, 5);
  }

  // Create a pixel space linecut for calculateInclinedLineEndpoints
  const pixelLinecut: InclinedLinecut = {
    id: linecut.id,
    angle: linecut.angle,
    xPosition: pixelX,
    yPosition: pixelY,
    width: pixelWidth,
    qXPosition: linecut.qXPosition,
    qYPosition: linecut.qYPosition,
    qWidth: linecut.qWidth,
    leftColor: linecut.leftColor,
    rightColor: linecut.rightColor,
    hidden: linecut.hidden,
    type: 'inclined'
  };

  // Get endpoints using the provided function
  const endpoints = calculateInclinedLineEndpoints({
    linecut: pixelLinecut,
    imageWidth,
    imageHeight
  });

  if (!endpoints) return [];

  // Apply resolution factor
  const scaledX0 = endpoints.x0 / factor;
  const scaledY0 = endpoints.y0 / factor;
  const scaledX1 = endpoints.x1 / factor;
  const scaledY1 = endpoints.y1 / factor;
  const scaledCenterX = pixelX / factor;
  const scaledCenterY = pixelY / factor;

  // Calculate perpendicular vector for width envelope
  const angleRad = (linecut.angle * Math.PI) / 180;
  const perpX = -Math.sin(angleRad); // Perpendicular to direction
  const perpY = -Math.cos(angleRad); // Perpendicular to direction

  // Scale width for display
  const scaledHalfWidth = (pixelWidth / 2) / factor;

  // Calculate envelope points
  const envelopePoints = {
    x: [
      scaledX0 + perpX * scaledHalfWidth,
      scaledX1 + perpX * scaledHalfWidth,
      scaledX1 - perpX * scaledHalfWidth,
      scaledX0 - perpX * scaledHalfWidth,
      scaledX0 + perpX * scaledHalfWidth // Close the path
    ],
    y: [
      scaledY0 + perpY * scaledHalfWidth,
      scaledY1 + perpY * scaledHalfWidth,
      scaledY1 - perpY * scaledHalfWidth,
      scaledY0 - perpY * scaledHalfWidth,
      scaledY0 + perpY * scaledHalfWidth // Close the path
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
      opacity: linecut.qWidth > 0 ? 0.3 : 0, // Hide fill for zero width
      xaxis: `x${axisNumber}`,
      yaxis: `y${axisNumber}`,
      showlegend: false,
      hoverinfo: 'skip'
    },
    // Central line
    {
      x: [scaledX0, scaledX1],
      y: [scaledY0, scaledY1],
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
      x: [scaledCenterX],
      y: [scaledCenterY],
      mode: 'markers',
      marker: {
        color: color,
        size: 8,
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
