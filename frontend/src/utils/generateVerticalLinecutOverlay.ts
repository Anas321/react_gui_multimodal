import { findPixelPositionForQValue } from "./findPixelPositionForQValue";
import { GenerateLinecutParams } from "../types";


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









// import { findPixelPositionInMatrix } from "./findPixelPositionInMatrix";


// export function generateVerticalLinecutOverlay({
//   linecut,
//   currentArray,
//   factor,
//   qXMatrix,
//   units = ""
// }) {
//   if (!currentArray.length || factor === null) return [];

//   const imageHeight = currentArray.length;
//   const imageWidth = currentArray[0]?.length || 0;

//   // Use pixelPosition directly if available, otherwise convert from q-value
//   const pixelPosition = 'pixelPosition' in linecut && linecut.pixelPosition !== undefined
//     ? linecut.pixelPosition
//     : findPixelPositionInMatrix(linecut.position, qXMatrix, false);

//   // Calculate the width in pixel space based on q-values
//   let pixelWidth = 0;

//   // Only calculate width if it's greater than zero
//   if (linecut.width > 0 && qXMatrix && qXMatrix.length > 0) {
//     // Find pixel positions for both edges of the width band
//     const upperQValue = linecut.position + linecut.width / 2;
//     const lowerQValue = linecut.position - linecut.width / 2;
//     const upperPixel = findPixelPositionInMatrix(upperQValue, qXMatrix, false);
//     const lowerPixel = findPixelPositionInMatrix(lowerQValue, qXMatrix, false);
//     pixelWidth = Math.abs(upperPixel - lowerPixel);
//   }

//   // Scale for display based on resolution factor
//   const scaledPosition = pixelPosition / factor;
//   const scaledWidth = pixelWidth / factor;

//   // Create the overlay boundary
//   let xLeft, xRight;

//   if (pixelWidth === 0) {
//     // For zero width, just draw the central line (no band)
//     xLeft = scaledPosition;
//     xRight = scaledPosition;
//   } else {
//     // For non-zero width, draw a band
//     xLeft = Math.max(0, scaledPosition - scaledWidth / 2);
//     xRight = Math.min(imageWidth, scaledPosition + scaledWidth / 2);
//   }

//   // Format the position label with units if provided
//   const positionLabel = units
//     ? `${linecut.position.toFixed(2)} ${units}`
//     : `${linecut.position.toFixed(2)}`;

//   return [
//     // Left image overlays
//     {
//       x: [xLeft, xRight, xRight, xLeft],
//       y: [0, 0, imageHeight, imageHeight],
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
//       x: [scaledPosition, scaledPosition],
//       y: [0, imageHeight],
//       mode: "lines",
//       line: { color: linecut.leftColor, width: 1 },
//       opacity: 0.75,
//       xaxis: "x1",
//       yaxis: "y1",
//       showlegend: false,
//     },
//     {
//       x: [scaledPosition],
//       y: [imageHeight * 1.01],  // Position text slightly above the image
//       mode: "text",
//       text: [positionLabel],
//       textfont: { size: 25 },  // Larger text
//       textposition: "bottom center",
//       xaxis: "x1",
//       yaxis: "y1",
//       showlegend: false,
//     },
//     // Right image overlays
//     {
//       x: [xLeft, xRight, xRight, xLeft],
//       y: [0, 0, imageHeight, imageHeight],
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
//       x: [scaledPosition, scaledPosition],
//       y: [0, imageHeight],
//       mode: "lines",
//       line: { color: linecut.rightColor, width: 1 },
//       opacity: 0.75,
//       xaxis: "x2",
//       yaxis: "y2",
//       showlegend: false,
//     },
//     {
//       x: [scaledPosition],
//       y: [imageHeight * 1.01],  // Position text slightly above the image
//       mode: "text",
//       text: [positionLabel],
//       textfont: { size: 25 },  // Larger text
//       textposition: "bottom center",
//       xaxis: "x2",
//       yaxis: "y2",
//       showlegend: false,
//     }
//   ];
// }
