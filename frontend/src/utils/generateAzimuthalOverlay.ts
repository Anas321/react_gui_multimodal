import { AzimuthalIntegration, AzimuthalData } from '../types';

interface GenerateAzimuthalOverlayParams {
    integration: AzimuthalIntegration;
    azimuthalData: AzimuthalData;
    axisNumber: number;
    factor: number;
    currentArray: number[][];
    maxQValue: number;
    beamCenterX?: number;  // Add beam center parameters
    beamCenterY?: number;
  }


  // Helper function to find indices in 2D array
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



 export function generateAzimuthalOverlay({
  integration,
  azimuthalData,
  axisNumber,
  factor,
  currentArray,
  maxQValue,
  beamCenterX = 0,
  beamCenterY = 0
}: GenerateAzimuthalOverlayParams) {
  if (!currentArray.length || !azimuthalData) return [];

  const qArray = azimuthalData.qArray;
  const tolerance = 0.1;

  const innerQ = integration.qRange ? integration.qRange[0] : 0;
  const outerQ = integration.qRange ? integration.qRange[1] : maxQValue;

  const [innerY, innerX] = findWhere(qArray, val => Math.abs(val - innerQ) < tolerance);
  const [outerY, outerX] = findWhere(qArray, val => Math.abs(val - outerQ) < tolerance);

  const scalePoint = (x: number, y: number) => ({
    x: x / factor,
    y: y / factor
  });

  // Calculate angles for each point relative to beam center
  const getAngle = (x: number, y: number) => {
    const dx = x - beamCenterX;
    const dy = y - beamCenterY;
    // Get angle in degrees, shifted to [-180, 180] range
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return angle;
  };

  // Filter points based on azimuthal range
  const startAngle = integration.azimuthRange[0];
  const endAngle = integration.azimuthRange[1];

  const filterByAngle = (x: number, y: number) => {
    const angle = getAngle(x, y);
    if (startAngle <= endAngle) {
      return angle >= startAngle && angle <= endAngle;
    } else {
      // Handle case where range crosses -180/180 boundary
      return angle >= startAngle || angle <= endAngle;
    }
  };

  // Create and filter points
  const innerPoints = innerX
    .map((x, i) => ({ x, y: innerY[i] }))
    .filter(p => filterByAngle(p.x, p.y))
    .map(p => scalePoint(p.x, p.y));

  const outerPoints = outerX
    .map((x, i) => ({ x, y: outerY[i] }))
    .filter(p => filterByAngle(p.x, p.y))
    .map(p => scalePoint(p.x, p.y));

  const color = axisNumber === 1 ? integration.leftColor : integration.rightColor;

  return [
    // Inner circle points
    {
      x: innerPoints.map(p => p.x),
      y: innerPoints.map(p => p.y),
      mode: 'markers',
      marker: { color, size: 2 },
      opacity: 0.75,
      xaxis: `x${axisNumber}`,
      yaxis: `y${axisNumber}`,
      showlegend: false,
    },
    // Outer circle points
    {
      x: outerPoints.map(p => p.x),
      y: outerPoints.map(p => p.y),
      mode: 'markers',
      marker: { color, size: 2 },
      opacity: 0.75,
      xaxis: `x${axisNumber}`,
      yaxis: `y${axisNumber}`,
      showlegend: false,
    },
    // Fill region between points
    // {
    //   x: [...innerPoints.map(p => p.x), ...outerPoints.map(p => p.x).reverse()],
    //   y: [...innerPoints.map(p => p.y), ...outerPoints.map(p => p.y).reverse()],
    //   mode: 'lines',
    //   fill: 'toself',
    //   fillcolor: color,
    //   line: { color },
    //   opacity: 0.3,
    //   xaxis: `x${axisNumber}`,
    //   yaxis: `y${axisNumber}`,
    //   showlegend: false,
    // }
  ];
}
