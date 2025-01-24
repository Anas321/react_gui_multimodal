import { Linecut } from "../types";

interface GenerateLinecutParams {
  linecut: Linecut;
  currentArray: number[][];
  factor: number | null;
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
