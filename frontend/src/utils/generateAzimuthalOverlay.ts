import { AzimuthalIntegration, AzimuthalData } from '../types';

interface GenerateAzimuthalOverlayParams {
  integration: AzimuthalIntegration;
  azimuthalData: AzimuthalData;
  axisNumber: 1 | 2;
  factor: number;
  currentArray: number[][];
}

export function generateAzimuthalOverlay({
  integration,
  azimuthalData,
  axisNumber,
  factor,
  currentArray
}: GenerateAzimuthalOverlayParams) {
  // Early validation to prevent processing with invalid data
  if (!azimuthalData?.qArray || !currentArray.length || factor === null) {
    console.warn('Invalid data for azimuthal overlay');
    return [];
  }

  // Select color based on which image we're overlaying (left or right)
  const color = axisNumber === 1 ? integration.leftColor : integration.rightColor;

  // Scale the q-array to match current resolution level
  const scaledQArray = azimuthalData.qArray.map((row, i) =>
    row.map((q, j) => {
      const fullResI = i * factor;
      const fullResJ = j * factor;

      return fullResI < currentArray.length && fullResJ < currentArray[0].length
        ? q
        : NaN;
    })
  );

  // Get q-range boundaries, handling null case
  let qMin = 0;
  let qMax = Math.max(...azimuthalData.q);  // Use maximum q value from data if qRange is null

  if (integration.qRange !== null) {
    [qMin, qMax] = integration.qRange;
  }

  // Create binary mask indicating which pixels are within the desired q-range
  const mask = scaledQArray.map(row =>
    row.map(q => !isNaN(q) && q >= qMin && q <= qMax ? 1 : 0)
  );

  // Generate contour points that trace the boundary of the q-range region
  const contourPoints = findContourPoints(mask);

  // Scale the contour points back to match current display resolution
  const scaledContourPoints = {
    x: contourPoints.x.map(x => x / factor),
    y: contourPoints.y.map(y => y / factor)
  };

  // Calculate a good position for the label (25% along the contour)
  const labelIndex = Math.floor(scaledContourPoints.x.length * 0.25);
  const labelX = scaledContourPoints.x[labelIndex];
  const labelY = scaledContourPoints.y[labelIndex];

  // Return array of Plotly traces for visualization
  return [
    // Contour line showing q-range boundary
    {
      x: scaledContourPoints.x,
      y: scaledContourPoints.y,
      mode: 'lines',
      line: { color, width: 2 },
      opacity: 0.75,
      xaxis: `x${axisNumber}`,
      yaxis: `y${axisNumber}`,
      showlegend: false,
      hoverinfo: 'skip'
    },
    // Label showing q-range values
    {
      x: [labelX],
      y: [labelY],
      mode: 'text',
      text: [`q: ${qMin.toFixed(2)}-${qMax.toFixed(2)} Å⁻¹`],
      textfont: { size: 12 },
      textposition: 'top right',
      xaxis: `x${axisNumber}`,
      yaxis: `y${axisNumber}`,
      showlegend: false,
      hoverinfo: 'skip'
    }
  ];
}

function findContourPoints(mask: number[][]) {
  const height = mask.length;
  const width = mask[0].length;
  const points = {
    x: [] as number[],
    y: [] as number[]
  };

  // Define all 8 neighboring directions
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  // Scan through the mask to find edge pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x] === 1) {
        let isEdge = false;
        for (const [dy, dx] of directions) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || ny >= height || nx < 0 || nx >= width || mask[ny][nx] === 0) {
            isEdge = true;
            break;
          }
        }
        if (isEdge) {
          points.x.push(x);
          points.y.push(y);
        }
      }
    }
  }

  return sortContourPoints(points);
}

function sortContourPoints(points: {x: number[], y: number[]}) {
  if (points.x.length === 0) return points;  // Return empty points if no contour

  const sorted = {
    x: [points.x[0]],
    y: [points.y[0]]
  };

  const remaining = new Set(points.x.map((_, i) => i).slice(1));

  while (remaining.size > 0) {
    const lastX = sorted.x[sorted.x.length - 1];
    const lastY = sorted.y[sorted.y.length - 1];

    let minDist = Infinity;
    let nextIndex = -1;

    for (const i of remaining) {
      const dx = points.x[i] - lastX;
      const dy = points.y[i] - lastY;
      const dist = dx * dx + dy * dy;

      if (dist < minDist) {
        minDist = dist;
        nextIndex = i;
      }
    }

    sorted.x.push(points.x[nextIndex]);
    sorted.y.push(points.y[nextIndex]);
    remaining.delete(nextIndex);
  }

  // Close the contour
  sorted.x.push(sorted.x[0]);
  sorted.y.push(sorted.y[0]);

  return sorted;
}
