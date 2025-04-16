import { findPixelPositionForQValue} from "./findPixelPositionForQValue";
import { GenerateLinecutParams } from "../types";

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






// import { findPixelPositionInMatrix } from "./findPixelPositionInMatrix";

// export function generateHorizontalLinecutOverlay({
//   linecut,
//   currentArray,
//   factor,
//   qYMatrix,
//   units = ""
// }) {
//   if (!currentArray.length || factor === null) return [];

//   const imageHeight = currentArray.length;
//   const imageWidth = currentArray[0]?.length || 0;

//   // Use pixelPosition directly if available, otherwise convert from q-value
//   const pixelPosition = 'pixelPosition' in linecut && linecut.pixelPosition !== undefined
//     ? linecut.pixelPosition
//     : findPixelPositionInMatrix(linecut.position, qYMatrix, true);

//   // Calculate the width in pixel space
//   let pixelWidth = 0;

//   // Only calculate width if it's greater than zero
//   if (linecut.width > 0 && qYMatrix && qYMatrix.length > 0) {
//     // Find pixel positions for both edges of the width band
//     const upperQValue = linecut.position + linecut.width / 2;
//     const lowerQValue = linecut.position - linecut.width / 2;
//     const upperPixel = findPixelPositionInMatrix(upperQValue, qYMatrix, true);
//     const lowerPixel = findPixelPositionInMatrix(lowerQValue, qYMatrix, true);
//     pixelWidth = Math.abs(upperPixel - lowerPixel);
//   }

//   // Scale for display based on resolution factor
//   const scaledPosition = pixelPosition / factor;
//   const scaledWidth = pixelWidth / factor;

//   // Create the overlay boundary
//   let yTop, yBottom;

//   if (pixelWidth === 0) {
//     // For zero width, just draw the central line (no band)
//     yTop = scaledPosition;
//     yBottom = scaledPosition;
//   } else {
//     // For non-zero width, draw a band
//     yTop = Math.max(0, scaledPosition - scaledWidth / 2);
//     yBottom = Math.min(imageHeight, scaledPosition + scaledWidth / 2);
//   }

//   // Format the position label with units if provided
//   const positionLabel = units
//     ? `${linecut.position.toFixed(2)} ${units}`
//     : `${linecut.position.toFixed(2)}`;

//   const overlays = [
//     // Left image overlays
//     {
//       x: [0, imageWidth, imageWidth, 0],
//       y: [yTop, yTop, yBottom, yBottom],
//       mode: "lines",
//       fill: "toself",
//       fillcolor: linecut.leftColor,
//       line: { color: linecut.leftColor },
//       opacity: pixelWidth === 0 ? 0 : 0.3,  // Hide fill for zero width
//       xaxis: "x1",
//       yaxis: "y1",
//       showlegend: false,
//     },
//     {
//       x: [0, imageWidth],
//       y: [scaledPosition, scaledPosition],
//       mode: "lines",
//       line: { color: linecut.leftColor, width: 1 },
//       opacity: 0.75,
//       xaxis: "x1",
//       yaxis: "y1",
//       showlegend: false,
//     },
//     {
//       x: [-imageWidth * 0.03],  // Position text slightly to the left of the image
//       y: [scaledPosition],
//       mode: "text",
//       text: [positionLabel],
//       textfont: { size: 25 },  // Larger text
//       textposition: "middle left",
//       xaxis: "x1",
//       yaxis: "y1",
//       showlegend: false,
//     },
//     // Right image overlays
//     {
//       x: [0, imageWidth, imageWidth, 0],
//       y: [yTop, yTop, yBottom, yBottom],
//       mode: "lines",
//       fill: "toself",
//       fillcolor: linecut.rightColor,
//       line: { color: linecut.rightColor },
//       opacity: pixelWidth === 0 ? 0 : 0.3,  // Hide fill for zero width
//       xaxis: "x2",
//       yaxis: "y2",
//       showlegend: false,
//     },
//     {
//       x: [0, imageWidth],
//       y: [scaledPosition, scaledPosition],
//       mode: "lines",
//       line: { color: linecut.rightColor, width: 1 },
//       opacity: 0.75,
//       xaxis: "x2",
//       yaxis: "y2",
//       showlegend: false,
//     },
//     {
//       x: [-imageWidth * 0.03],
//       y: [scaledPosition],
//       mode: "text",
//       text: [positionLabel],
//       textfont: { size: 25 },
//       textposition: "middle left",
//       xaxis: "x2",
//       yaxis: "y2",
//       showlegend: false,
//     }
//   ];

//   return overlays;
// }
