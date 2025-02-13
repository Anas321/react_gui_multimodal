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
