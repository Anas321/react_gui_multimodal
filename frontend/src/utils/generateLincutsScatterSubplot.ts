import { Linecut, InclinedLinecut } from "../types";
import { calculateInclinedLineEndpoints } from "./calculateInclinedLinecutEndpoints";

interface GenerateLinecutParams {
  linecut: Linecut;
  currentArray: number[][];
  factor: number | null;
  imageWidth?: number;
  imageHeight?: number;
}

export function generateHorizontalLinecutOverlay({
  linecut,
  currentArray,
  factor
}: GenerateLinecutParams) {
  if (!currentArray.length || factor === null) return [];

  const imageHeight = currentArray.length;
  const imageWidth = currentArray[0]?.length || 0;

  const scaledPosition = linecut.position / factor;
  const scaledWidth = (linecut.width || 1) / factor;

  const yTop = Math.max(0, scaledPosition - scaledWidth / 2);
  const yBottom = Math.min(imageHeight, scaledPosition + scaledWidth / 2);

  const overlays = [
    // Left image overlays
    {
      x: [0, imageWidth, imageWidth, 0],
      y: [yTop, yTop, yBottom, yBottom],
      mode: "lines",
      fill: "toself",
      fillcolor: linecut.leftColor,
      line: { color: linecut.leftColor },
      opacity: 0.3,
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
      text: [`${linecut.position}`],
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
      opacity: 0.3,
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
      x: [-imageWidth * 0.03],  // Position text slightly to the left of the image
      y: [scaledPosition],
      mode: "text",
      text: [`${linecut.position}`],
      textfont: { size: 25 },  // Larger text
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
  factor
}: GenerateLinecutParams) {
  if (!currentArray.length || factor === null) return [];

  const imageHeight = currentArray.length;
  const imageWidth = currentArray[0]?.length || 0;

  const scaledPosition = linecut.position / factor;
  const scaledWidth = (linecut.width || 1) / factor;

  const xLeft = Math.max(0, scaledPosition - scaledWidth / 2);
  const xRight = Math.min(imageWidth, scaledPosition + scaledWidth / 2);

  return [
    // Left image overlays
    {
      x: [xLeft, xRight, xRight, xLeft],
      y: [0, 0, imageHeight, imageHeight],
      mode: "lines",
      fill: "toself",
      fillcolor: linecut.leftColor,
      line: { color: linecut.leftColor },
      opacity: 0.3,
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
      text: [`${linecut.position}`],
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
      opacity: 0.3,
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
      text: [`${linecut.position}`],
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

interface calculateInclinedLineEndpointsParams {
  linecut: InclinedLinecut;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Calculates the intersection points of a line with the image boundaries.
 */
export function calculateInclinedLineEndpoints({
    linecut,
    imageWidth,
    imageHeight
}: calculateInclinedLineEndpointsParams) {
    const radians = (linecut.angle * Math.PI) / 180;
    const dx = Math.cos(radians);
    const dy = -Math.sin(radians);

    const centerX = linecut.xPosition;
    const centerY = linecut.yPosition;

    const isInBounds = (x: number, y: number) =>
        x >= 0 && x <= imageWidth && y >= 0 && y <= imageHeight;

    const tLeft = (0 - centerX) / dx;
    const tRight = (imageWidth - centerX) / dx;
    const tTop = (0 - centerY) / dy;
    const tBottom = (imageHeight - centerY) / dy;

    const validTimes: number[] = [];

    // Check intersection with each boundary
    if (isFinite(tLeft)) {
        const yLeft = centerY + tLeft * dy;
        if (isInBounds(0, yLeft)) validTimes.push(tLeft);
    }
    if (isFinite(tRight)) {
        const yRight = centerY + tRight * dy;
        if (isInBounds(imageWidth, yRight)) validTimes.push(tRight);
    }
    if (isFinite(tTop)) {
        const xTop = centerX + tTop * dx;
        if (isInBounds(xTop, 0)) validTimes.push(tTop);
    }
    if (isFinite(tBottom)) {
        const xBottom = centerX + tBottom * dx;
        if (isInBounds(xBottom, imageHeight)) validTimes.push(tBottom);
    }

    // Handle boundary cases
    if (centerX === 0 || centerX === imageWidth ||
        centerY === 0 || centerY === imageHeight) {
        validTimes.push(0);
    }

    // If not enough intersections found, create a default line
    const defaultLength = 100;
    if (validTimes.length < 2) {
        return {
            x0: centerX - dx * defaultLength/2,
            y0: centerY - dy * defaultLength/2,
            x1: centerX + dx * defaultLength/2,
            y1: centerY + dy * defaultLength/2
        };
    }

    // Get the endpoints from intersection times
    validTimes.sort((a, b) => a - b);
    const firstT = validTimes[0];
    const lastT = validTimes[validTimes.length - 1];

    return {
        x0: centerX + firstT * dx,
        y0: centerY + firstT * dy,
        x1: centerX + lastT * dx,
        y1: centerY + lastT * dy
    };
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
    // Position label
    // {
    //   x: [linecut.xPosition],
    //   y: [linecut.yPosition],
    //   mode: 'text',
    //   text: [`(${Math.round(linecut.xPosition)}, ${Math.round(linecut.yPosition)})<br>${Math.round(linecut.angle)}°`],
    //   textfont: { size: 12 },
    //   textposition: 'top right',
    //   xaxis: `x${axisNumber}`,
    //   yaxis: `y${axisNumber}`,
    //   showlegend: false,
    //   hoverinfo: 'skip'
    // }
  ];

  return [
    ...createOverlaysForAxis(linecut.leftColor, 1),
    ...createOverlaysForAxis(linecut.rightColor, 2)
  ];
}
