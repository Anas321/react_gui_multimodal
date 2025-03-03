// import { useState, useCallback } from 'react';
// import { InclinedLinecut } from '../types';
// import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';
// import { throttle } from 'lodash';
// import { calculateInclinedLineEndpoints } from '../utils/calculateInclinedLinecutEndpoints';


// export default function useInclinedLinecut(
//     imageWidth: number,
//     imageHeight: number,
//     imageData1: number[][],
//     imageData2: number[][],
// ) {

//     const [inclinedLinecuts, setInclinedLinecuts] = useState<InclinedLinecut[]>([]);
//     const [inclinedLinecutData1, setInclinedLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
//     const [inclinedLinecutData2, setInclinedLinecutData2] = useState<{ id: number; data: number[] }[]>([]);


//     // Compute intensity along an inclined line using interpolation
//     const computeInclinedLinecutData = useCallback((
//     imageData: number[][],
//     xPos: number,
//     yPos: number,
//     angle: number,
//     width: number
//     ): number[] => {
//     // Get the endpoints
//     const endpoints = calculateInclinedLineEndpoints({
//         linecut: {
//         xPosition: xPos,
//         yPosition: yPos,
//         angle,
//         width,
//         id: 0,
//         leftColor: '',
//         rightColor: '',
//         hidden: false,
//         type: 'inclined'
//         },
//         imageWidth: imageData[0].length,
//         imageHeight: imageData.length
//     });

//     if (!endpoints) return [];
//     const { x0, y0, x1, y1 } = endpoints;

//     // // Calculate the total distance and unit vector
//     // const distanceInX = x1 - x0;
//     // const distanceInY = y1 - y0;
//     // const length = Math.sqrt(distanceInX * distanceInX + distanceInY * distanceInY);

//     // Calculate direction vectors using the same convention as calculateInclinedLineEndpoints
//     const angleRad = (angle * Math.PI) / 180;
//     const dirX = Math.cos(angleRad);
//     const dirY = -Math.sin(angleRad);  // Match the negative sign convention

//     // Perpendicular vector (rotated 90 degrees counter-clockwise)
//     const perpX = -dirY;  // This becomes sin(angleRad)
//     const perpY = -dirX;  // This becomes -cos(angleRad)

//     const distanceInX = x1 - x0;
//     const distanceInY = y1 - y0;
//     const length = Math.sqrt(distanceInX * distanceInX + distanceInY * distanceInY);

//     // If we have zero length, return empty array
//     if (length === 0) return [];

//     // // Unit vectors for direction and perpendicular
//     // const dirX = distanceInX / length;
//     // const dirY = distanceInY / length;

//     // // Perpendicular unit vector (rotated 90 degrees)
//     // const perpX = -dirY;
//     // const perpY = dirX;

//     // Sample points along the line
//     const numPoints = Math.ceil(length);
//     const intensities = new Array(numPoints).fill(0);
//     const halfWidth = width / 2;

//     // For each point along the line
//     for (let i = 0; i < numPoints; i++) {
//         let sum = 0;
//         let count = 0;

//         // Base position along the line
//         const baseX = x0 + (i * dirX);
//         const baseY = y0 + (i * dirY);

//         // Sample perpendicular to the line for width averaging
//         for (let w = -halfWidth; w <= halfWidth; w++) {
//         const x = Math.round(baseX + (w * perpX));
//         const y = Math.round(baseY + (w * perpY));

//         // console.log(x, y);

//         // Check if point is within bounds
//         if (x >= 0 && x < imageData[0].length && y >= 0 && y < imageData.length) {
//             sum += imageData[y][x];
//             count++;
//         }
//         }

//         intensities[i] = count > 0 ? sum / count : 0;
//     }

//     return intensities;
//     }, []);



//     // Add a new inclined linecut
//     const addInclinedLinecut = useCallback(throttle(() => {
//     const existingIds = inclinedLinecuts.map((linecut) => linecut.id);
//     const newId = Math.max(0, ...existingIds) + 1;

//     // Create default linecut at center of image
//     const defaultLinecut: InclinedLinecut = {
//         id: newId,
//         xPosition: Math.floor(imageWidth / 2),  // center x
//         yPosition: Math.floor(imageHeight / 2), // center y
//         leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
//         rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
//         hidden: false,
//         width: 0,
//         angle: 45,  // Default 45-degree angle
//         type: 'inclined'
//     };

//     // Add new linecut to state
//     setInclinedLinecuts(prev => [...prev, defaultLinecut]);

//     // Compute initial linecut data
//     if (imageData1.length > 0 && imageData2.length > 0) {
//         const data1 = computeInclinedLinecutData(
//         imageData1,
//         defaultLinecut.xPosition,
//         defaultLinecut.yPosition,
//         defaultLinecut.angle,
//         defaultLinecut.width
//         );
//         const data2 = computeInclinedLinecutData(
//         imageData2,
//         defaultLinecut.xPosition,
//         defaultLinecut.yPosition,
//         defaultLinecut.angle,
//         defaultLinecut.width
//         );

//         setInclinedLinecutData1(prev => [...prev, { id: newId, data: data1 }]);
//         setInclinedLinecutData2(prev => [...prev, { id: newId, data: data2 }]);
//     }
//     }, 200), [imageWidth, imageHeight, imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]);

//     // Update x position of an inclined linecut
//     const updateInclinedLinecutXPosition = useCallback(
//     throttle((id: number, xPosition: number) => {
//         // Update linecut x position only
//         setInclinedLinecuts(prev =>
//         prev.map(linecut =>
//             linecut.id === id
//             ? { ...linecut, xPosition }
//             : linecut
//         )
//         );

//         // Update linecut data
//         if (imageData1.length > 0 && imageData2.length > 0) {
//         const linecut = inclinedLinecuts.find(l => l.id === id);
//         if (linecut) {
//             const newData1 = computeInclinedLinecutData(
//             imageData1,
//             xPosition,
//             linecut.yPosition,
//             linecut.angle,
//             linecut.width
//             );
//             const newData2 = computeInclinedLinecutData(
//             imageData2,
//             xPosition,
//             linecut.yPosition,
//             linecut.angle,
//             linecut.width
//             );

//             setInclinedLinecutData1(prev =>
//             prev.map(data =>
//                 data.id === id ? { ...data, data: newData1 } : data
//             )
//             );
//             setInclinedLinecutData2(prev =>
//             prev.map(data =>
//                 data.id === id ? { ...data, data: newData2 } : data
//             )
//             );
//         }
//         }
//     }, 200),
//     [imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]
//     );

//     // Update y position of an inclined linecut
//     const updateInclinedLinecutYPosition = useCallback(
//     throttle((id: number, yPosition: number) => {
//         // Update linecut y position only
//         setInclinedLinecuts(prev =>
//         prev.map(linecut =>
//             linecut.id === id
//             ? { ...linecut, yPosition }
//             : linecut
//         )
//         );

//         // Update linecut data
//         if (imageData1.length > 0 && imageData2.length > 0) {
//         const linecut = inclinedLinecuts.find(l => l.id === id);
//         if (linecut) {
//             const newData1 = computeInclinedLinecutData(
//             imageData1,
//             linecut.xPosition,
//             yPosition,
//             linecut.angle,
//             linecut.width
//             );
//             const newData2 = computeInclinedLinecutData(
//             imageData2,
//             linecut.xPosition,
//             yPosition,
//             linecut.angle,
//             linecut.width
//             );

//             setInclinedLinecutData1(prev =>
//             prev.map(data =>
//                 data.id === id ? { ...data, data: newData1 } : data
//             )
//             );
//             setInclinedLinecutData2(prev =>
//             prev.map(data =>
//                 data.id === id ? { ...data, data: newData2 } : data
//             )
//             );
//         }
//         }
//     }, 200),
//     [imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]
//     );

//     // Update angle of an inclined linecut
//     const updateInclinedLinecutAngle = useCallback(
//     throttle((id: number, angle: number) => {
//         // Normalize angle to -180 to 180 range
//         const normalizedAngle = ((angle % 360 + 540) % 360) - 180;

//         // Update linecut angle
//         setInclinedLinecuts(prev =>
//         prev.map(linecut =>
//             linecut.id === id ? { ...linecut, angle: normalizedAngle } : linecut
//         )
//         );

//         // Update linecut data
//         if (imageData1.length > 0 && imageData2.length > 0) {
//         const linecut = inclinedLinecuts.find(l => l.id === id);
//         if (linecut) {
//             const newData1 = computeInclinedLinecutData(
//             imageData1,
//             linecut.xPosition,
//             linecut.yPosition,
//             normalizedAngle,
//             linecut.width
//             );
//             const newData2 = computeInclinedLinecutData(
//             imageData2,
//             linecut.xPosition,
//             linecut.yPosition,
//             normalizedAngle,
//             linecut.width
//             );

//             setInclinedLinecutData1(prev =>
//             prev.map(data =>
//                 data.id === id ? { ...data, data: newData1 } : data
//             )
//             );
//             setInclinedLinecutData2(prev =>
//             prev.map(data =>
//                 data.id === id ? { ...data, data: newData2 } : data
//             )
//             );
//         }
//         }
//     }, 200),
//     [imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]
//     );

//     // Update width of an inclined linecut
//     const updateInclinedLinecutWidth = useCallback(
//     throttle((id: number, width: number) => {
//         // Update linecut width
//         setInclinedLinecuts(prev =>
//         prev.map(linecut =>
//             linecut.id === id ? { ...linecut, width } : linecut
//         )
//         );

//         // Update linecut data
//         if (imageData1.length > 0 && imageData2.length > 0) {
//         const linecut = inclinedLinecuts.find(l => l.id === id);
//         if (linecut) {
//             const newData1 = computeInclinedLinecutData(
//             imageData1,
//             linecut.xPosition,
//             linecut.yPosition,
//             linecut.angle,
//             width
//             );
//             const newData2 = computeInclinedLinecutData(
//             imageData2,
//             linecut.xPosition,
//             linecut.yPosition,
//             linecut.angle,
//             width
//             );

//             setInclinedLinecutData1(prev =>
//             prev.map(data =>
//                 data.id === id ? { ...data, data: newData1 } : data
//             )
//             );
//             setInclinedLinecutData2(prev =>
//             prev.map(data =>
//                 data.id === id ? { ...data, data: newData2 } : data
//             )
//             );
//         }
//         }
//     }, 200),
//     [imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]
//     );

//     // Update color of an inclined linecut
//     const updateInclinedLinecutColor = useCallback((id: number, side: 'left' | 'right', color: string) => {
//     setInclinedLinecuts(prev =>
//         prev.map(linecut =>
//         linecut.id === id
//             ? { ...linecut, [`${side}Color`]: color }
//             : linecut
//         )
//     );
//     }, []);

//     // Delete an inclined linecut
//     const deleteInclinedLinecut = useCallback((id: number) => {
//     // Remove linecut and reindex remaining ones
//     setInclinedLinecuts(prev => {
//         const updatedLinecuts = prev.filter(linecut => linecut.id !== id);
//         return updatedLinecuts.map((linecut, index) => ({
//         ...linecut,
//         id: index + 1,
//         }));
//     });

//     // Update corresponding data arrays
//     setInclinedLinecutData1(prev =>
//         prev.filter(data => data.id !== id).map((data, index) => ({
//         ...data,
//         id: index + 1,
//         }))
//     );
//     setInclinedLinecutData2(prev =>
//         prev.filter(data => data.id !== id).map((data, index) => ({
//         ...data,
//         id: index + 1,
//         }))
//     );
//     }, []);

//     // Toggle visibility of an inclined linecut
//     const toggleInclinedLinecutVisibility = useCallback((id: number) => {
//     setInclinedLinecuts(prev =>
//         prev.map(linecut =>
//         linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
//         )
//     );
//     }, []);


//     return {
//         inclinedLinecuts,
//         inclinedLinecutData1,
//         inclinedLinecutData2,
//         addInclinedLinecut,
//         updateInclinedLinecutXPosition,
//         updateInclinedLinecutYPosition,
//         updateInclinedLinecutAngle,
//         updateInclinedLinecutWidth,
//         updateInclinedLinecutColor,
//         deleteInclinedLinecut,
//         toggleInclinedLinecutVisibility,
//         computeInclinedLinecutData,
//         setInclinedLinecutData1,
//         setInclinedLinecutData2,
//     }
// }



import { useState, useCallback, useEffect } from 'react';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';
import { throttle } from 'lodash';
import { InclinedLinecut } from '../types';

// // Define the Q-space inclined linecut type
// interface InclinedLinecut {
//   id: number;
//   qXPosition: number;    // X position in q-space
//   qYPosition: number;    // Y position in q-space
//   angle: number;         // Angle in degrees
//   qWidth: number;        // Width in q-space units
//   leftColor: string;     // Color for left image visualization
//   rightColor: string;    // Color for right image visualization
//   hidden: boolean;       // Visibility flag
//   type: 'inclined';      // Type identifier
// }

/**
 * Custom hook for managing inclined linecuts in q-space
 *
 * This hook provides functionality to create, manipulate, and visualize inclined linecuts
 * on scattering images working exclusively in q-space (reciprocal space).
 *
 * @param imageData1 - 2D array of intensity values for first image
 * @param imageData2 - 2D array of intensity values for second image
 * @param qXVector - Array of q-values for X axis
 * @param qYVector - Array of q-values for Y axis
 * @param units - Units for q-values (e.g., "nm⁻¹", "Å⁻¹")
 * @returns Object with linecut data and management functions
 */
export default function useInclinedLinecut(
  imageData1: number[][],
  imageData2: number[][],
  qXVector: number[],
  qYVector: number[],
  zoomedXPixelRange: [number, number] | null, // Add these parameters
  zoomedYPixelRange: [number, number] | null, // to take the pixel ranges
) {
  // State for storing linecut definitions in q-space
  const [inclinedLinecuts, setInclinedLinecuts] = useState<InclinedLinecut[]>([]);

  // State for storing intensity data extracted for each linecut
  const [inclinedLinecutData1, setInclinedLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
  const [inclinedLinecutData2, setInclinedLinecutData2] = useState<{ id: number; data: number[] }[]>([]);

  // Add state for Q-space zoom ranges
  const [zoomedXQRange, setZoomedXQRange] = useState<[number, number] | null>(null);
  const [zoomedYQRange, setZoomedYQRange] = useState<[number, number] | null>(null);

    // Convert pixel ranges to Q ranges
    useEffect(() => {
        // Convert X pixel range to Q range
        const xQRange = zoomedXPixelRange
            ? [
                qXVector[Math.min(zoomedXPixelRange[0], qXVector.length - 1)],
                qXVector[Math.min(zoomedXPixelRange[1], qXVector.length - 1)]
            ] as [number, number]
            : null;

        // Convert Y pixel range to Q range
        const yQRange = zoomedYPixelRange
            ? [
                qYVector[Math.min(zoomedYPixelRange[0], qYVector.length - 1)],
                qYVector[Math.min(zoomedYPixelRange[1], qYVector.length - 1)]
            ] as [number, number]
            : null;

        setZoomedXQRange(xQRange);
        setZoomedYQRange(yQRange);
        }, [zoomedXPixelRange, zoomedYPixelRange, qXVector, qYVector]);


  // Image dimensions in pixels
  const imageHeight = imageData1.length;
  const imageWidth = imageData1[0]?.length || 0;

  /**
   * Convert q-space coordinates to pixel coordinates
   *
   * @param qX - X position in q-space
   * @param qY - Y position in q-space
   * @returns Pixel coordinates [x, y]
   */
  const qToPixel = useCallback((qX: number, qY: number): [number, number] => {
    // Find index of closest q-value in qXVector
    let xPixel = 0;
    let minDiffX = Math.abs(qXVector[0] - qX);

    for (let i = 1; i < qXVector.length; i++) {
      const diff = Math.abs(qXVector[i] - qX);
      if (diff < minDiffX) {
        minDiffX = diff;
        xPixel = i;
      }
    }

    // Find index of closest q-value in qYVector
    let yPixel = 0;
    let minDiffY = Math.abs(qYVector[0] - qY);

    for (let i = 1; i < qYVector.length; i++) {
      const diff = Math.abs(qYVector[i] - qY);
      if (diff < minDiffY) {
        minDiffY = diff;
        yPixel = i;
      }
    }

    return [xPixel, yPixel];
  }, [qXVector, qYVector]);

  /**
   * Calculate endpoints of an inclined line in pixel space
   *
   * @param qXPosition - Center X position in q-space
   * @param qYPosition - Center Y position in q-space
   * @param angle - Angle in degrees
   * @returns Object with endpoints coordinates or null if invalid
   */
  const calculateLinecutEndpoints = useCallback((
    qXPosition: number,
    qYPosition: number,
    angle: number
  ) => {
    // Convert center position from q-space to pixel space
    const [centerX, centerY] = qToPixel(qXPosition, qYPosition);

    // Calculate direction vector based on angle
    const angleRad = (angle * Math.PI) / 180;
    const dirX = Math.cos(angleRad);
    const dirY = -Math.sin(angleRad); // Y-axis points downward in image coordinates

    // Extend the line to the image boundaries
    // Calculate intersection with image boundaries
    let tMin = -Infinity;
    let tMax = Infinity;

    // Intersection with x=0 boundary
    if (dirX !== 0) {
      const t = -centerX / dirX;
      if (dirX > 0) tMin = Math.max(tMin, t);
      else tMax = Math.min(tMax, t);
    }

    // Intersection with x=width-1 boundary
    if (dirX !== 0) {
      const t = (imageWidth - 1 - centerX) / dirX;
      if (dirX > 0) tMax = Math.min(tMax, t);
      else tMin = Math.max(tMin, t);
    }

    // Intersection with y=0 boundary
    if (dirY !== 0) {
      const t = -centerY / dirY;
      if (dirY > 0) tMin = Math.max(tMin, t);
      else tMax = Math.min(tMax, t);
    }

    // Intersection with y=height-1 boundary
    if (dirY !== 0) {
      const t = (imageHeight - 1 - centerY) / dirY;
      if (dirY > 0) tMax = Math.min(tMax, t);
      else tMin = Math.max(tMin, t);
    }

    // Check if line intersects the image
    if (tMin > tMax) return null;

    // Calculate endpoints
    const x0 = centerX + tMin * dirX;
    const y0 = centerY + tMin * dirY;
    const x1 = centerX + tMax * dirX;
    const y1 = centerY + tMax * dirY;

    return { x0, y0, x1, y1 };
  }, [qToPixel, imageWidth, imageHeight]);

  /**
   * Compute intensity data along an inclined linecut
   *
   * @param imageData - 2D array of intensity values
   * @param qXPosition - Center X position in q-space
   * @param qYPosition - Center Y position in q-space
   * @param angle - Angle in degrees
   * @param qWidth - Width in q-space units
   * @returns Array of intensity values along the linecut
   */
  const computeInclinedLinecutData = useCallback((
    imageData: number[][],
    qXPosition: number,
    qYPosition: number,
    angle: number,
    qWidth: number
  ): number[] => {
    // Calculate endpoints in pixel space
    const endpoints = calculateLinecutEndpoints(qXPosition, qYPosition, angle);
    if (!endpoints) return [];

    const { x0, y0, x1, y1 } = endpoints;

    // Calculate direction vectors
    const angleRad = (angle * Math.PI) / 180;
    const dirX = Math.cos(angleRad);
    const dirY = -Math.sin(angleRad);

    // Perpendicular vector for width calculations
    const perpX = -dirY;
    const perpY = -dirX;

    // Calculate total line length in pixel space
    const dx = x1 - x0;
    const dy = y1 - y0;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return [];

    // Convert q-width to approximate pixel width
    // This is an approximation - in a real application you would need
    // to consider the q-space scale factors in different directions
    let pixelWidth = 0;

    if (qWidth > 0) {
      // Find two q-points separated by qWidth
      const q1 = [qXPosition, qYPosition];
      const q2 = [qXPosition + qWidth * Math.cos(angleRad), qYPosition - qWidth * Math.sin(angleRad)];

      // Convert both to pixel space
      const [p1x, p1y] = qToPixel(q1[0], q1[1]);
      const [p2x, p2y] = qToPixel(q2[0], q2[1]);

      // Calculate pixel distance
      const pdx = p2x - p1x;
      const pdy = p2y - p1y;
      pixelWidth = Math.sqrt(pdx * pdx + pdy * pdy);
    }

    // Sample points along the line
    const numPoints = Math.ceil(length);
    const intensities = new Array(numPoints).fill(0);
    const halfWidth = pixelWidth / 2;

    // For each point along the line
    for (let i = 0; i < numPoints; i++) {
      let sum = 0;
      let count = 0;

      // Base position along the line
      const baseX = x0 + (i / numPoints) * dx;
      const baseY = y0 + (i / numPoints) * dy;

      // Sample perpendicular to the line for width averaging
      for (let w = -halfWidth; w <= halfWidth; w += 0.5) {
        const x = Math.round(baseX + w * perpX);
        const y = Math.round(baseY + w * perpY);

        // Check if point is within bounds
        if (x >= 0 && x < imageData[0].length && y >= 0 && y < imageData.length) {
          sum += imageData[y][x];
          count++;
        }
      }

      intensities[i] = count > 0 ? sum / count : 0;
    }

    return intensities;
  }, [calculateLinecutEndpoints, qToPixel]);

  /**
   * Calculate path distance for plotting the linecut data
   *
   * @param qXPosition - Center X position in q-space
   * @param qYPosition - Center Y position in q-space
   * @param angle - Angle in degrees
   * @param numPoints - Number of points in the intensity data
   * @returns Array of distance values in q-space
   */
  const calculateQPathDistance = useCallback((
    qXPosition: number,
    qYPosition: number,
    angle: number,
    numPoints: number
  ): number[] => {
    // Calculate endpoints in pixel space
    const endpoints = calculateLinecutEndpoints(qXPosition, qYPosition, angle);
    if (!endpoints || numPoints === 0) return [];

    const { x0, y0, x1, y1 } = endpoints;

    // Calculate q-values at endpoints
    // We need to map pixel coordinates back to q-values
    const q0X = qXVector[Math.min(Math.max(0, Math.round(x0)), qXVector.length - 1)];
    const q0Y = qYVector[Math.min(Math.max(0, Math.round(y0)), qYVector.length - 1)];
    const q1X = qXVector[Math.min(Math.max(0, Math.round(x1)), qXVector.length - 1)];
    const q1Y = qYVector[Math.min(Math.max(0, Math.round(y1)), qYVector.length - 1)];

    // Calculate total q-space distance
    const dqX = q1X - q0X;
    const dqY = q1Y - q0Y;
    const qLength = Math.sqrt(dqX * dqX + dqY * dqY);

    // Create distance array
    return Array.from({ length: numPoints }, (_, i) => (i / (numPoints - 1)) * qLength);
  }, [calculateLinecutEndpoints, qXVector, qYVector]);

  /**
   * Create a new inclined linecut at the center of the available q-range
   */
  const addInclinedLinecut = useCallback(throttle(() => {
    // Find the next available ID for the new linecut
    const existingIds = inclinedLinecuts.map((linecut) => linecut.id);
    const newId = Math.max(0, ...existingIds) + 1;

    // Calculate default q-value at the middle of the available range
    const minQX = qXVector && qXVector.length > 0 ? Math.min(...qXVector) : 0;
    const maxQX = qXVector && qXVector.length > 0 ? Math.max(...qXVector) : 0;
    const minQY = qYVector && qYVector.length > 0 ? Math.min(...qYVector) : 0;
    const maxQY = qYVector && qYVector.length > 0 ? Math.max(...qYVector) : 0;

    const defaultQX = (minQX + maxQX) / 2;
    const defaultQY = (minQY + maxQY) / 2;

    // Create the new linecut object with default properties
    const newLinecut: InclinedLinecut = {
      id: newId,
      qXPosition: defaultQX,
      qYPosition: defaultQY,
      angle: 45,  // Default 45-degree angle
      qWidth: 0,  // Start with zero width
      // Assign colors from palette, cycling through available colors
      leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
      rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
      hidden: false,
      type: 'inclined'
    };

    // Add the new linecut to the state
    setInclinedLinecuts((prev) => [...prev, newLinecut]);

    // Extract and store intensity data for the new linecut from both images
    if (imageData1 && imageData1.length > 0 && imageData2 && imageData2.length > 0) {
      const data1 = computeInclinedLinecutData(
        imageData1,
        defaultQX,
        defaultQY,
        45, // Default angle
        0   // Default width
      );

      const data2 = computeInclinedLinecutData(
        imageData2,
        defaultQX,
        defaultQY,
        45, // Default angle
        0   // Default width
      );

      setInclinedLinecutData1((prev) => [...prev, { id: newId, data: data1 }]);
      setInclinedLinecutData2((prev) => [...prev, { id: newId, data: data2 }]);
    }
  }, 200), [
    inclinedLinecuts,
    computeInclinedLinecutData,
    qXVector,
    qYVector,
    imageData1,
    imageData2
  ]);

  /**
   * Updates the X position (q-value) of an inclined linecut
   *
   * @param id - ID of the linecut to update
   * @param qXPosition - New X position in q-space
   */
  const updateInclinedLinecutXPosition = useCallback(throttle((
    id: number,
    qXPosition: number
  ) => {
    // Update the linecut with the new q-value
    setInclinedLinecuts(prev =>
      prev.map(linecut =>
        linecut.id === id ? { ...linecut, qXPosition } : linecut
      )
    );

    // Get the updated linecut to recompute the data
    const updatedLinecut = inclinedLinecuts.find(l => l.id === id);
    if (!updatedLinecut) return;

    // Recompute intensity data with the new position
    if (imageData1.length > 0 && imageData2.length > 0) {
      const newData1 = computeInclinedLinecutData(
        imageData1,
        qXPosition,
        updatedLinecut.qYPosition,
        updatedLinecut.angle,
        updatedLinecut.qWidth
      );

      const newData2 = computeInclinedLinecutData(
        imageData2,
        qXPosition,
        updatedLinecut.qYPosition,
        updatedLinecut.angle,
        updatedLinecut.qWidth
      );

      // Update intensity data in both datasets
      setInclinedLinecutData1(prev =>
        prev.map(data =>
          data.id === id ? { ...data, data: newData1 } : data
        )
      );

      setInclinedLinecutData2(prev =>
        prev.map(data =>
          data.id === id ? { ...data, data: newData2 } : data
        )
      );
    }
  }, 200), [inclinedLinecuts, computeInclinedLinecutData, imageData1, imageData2]);

  /**
   * Updates the Y position (q-value) of an inclined linecut
   *
   * @param id - ID of the linecut to update
   * @param qYPosition - New Y position in q-space
   */
  const updateInclinedLinecutYPosition = useCallback(throttle((
    id: number,
    qYPosition: number
  ) => {
    // Update the linecut with the new q-value
    setInclinedLinecuts(prev =>
      prev.map(linecut =>
        linecut.id === id ? { ...linecut, qYPosition } : linecut
      )
    );

    // Get the updated linecut to recompute the data
    const updatedLinecut = inclinedLinecuts.find(l => l.id === id);
    if (!updatedLinecut) return;

    // Recompute intensity data with the new position
    if (imageData1.length > 0 && imageData2.length > 0) {
      const newData1 = computeInclinedLinecutData(
        imageData1,
        updatedLinecut.qXPosition,
        qYPosition,
        updatedLinecut.angle,
        updatedLinecut.qWidth
      );

      const newData2 = computeInclinedLinecutData(
        imageData2,
        updatedLinecut.qXPosition,
        qYPosition,
        updatedLinecut.angle,
        updatedLinecut.qWidth
      );

      // Update intensity data in both datasets
      setInclinedLinecutData1(prev =>
        prev.map(data =>
          data.id === id ? { ...data, data: newData1 } : data
        )
      );

      setInclinedLinecutData2(prev =>
        prev.map(data =>
          data.id === id ? { ...data, data: newData2 } : data
        )
      );
    }
  }, 200), [inclinedLinecuts, computeInclinedLinecutData, imageData1, imageData2]);

  /**
   * Updates the angle of an inclined linecut
   *
   * @param id - ID of the linecut to update
   * @param angle - New angle in degrees
   */
  const updateInclinedLinecutAngle = useCallback(throttle((
    id: number,
    angle: number
  ) => {
    // Normalize angle to -180 to 180 range
    const normalizedAngle = ((angle % 360 + 540) % 360) - 180;

    // Update the linecut with the new angle
    setInclinedLinecuts(prev =>
      prev.map(linecut =>
        linecut.id === id ? { ...linecut, angle: normalizedAngle } : linecut
      )
    );

    // Get the updated linecut to recompute the data
    const updatedLinecut = inclinedLinecuts.find(l => l.id === id);
    if (!updatedLinecut) return;

    // Recompute intensity data with the new angle
    if (imageData1.length > 0 && imageData2.length > 0) {
      const newData1 = computeInclinedLinecutData(
        imageData1,
        updatedLinecut.qXPosition,
        updatedLinecut.qYPosition,
        normalizedAngle,
        updatedLinecut.qWidth
      );

      const newData2 = computeInclinedLinecutData(
        imageData2,
        updatedLinecut.qXPosition,
        updatedLinecut.qYPosition,
        normalizedAngle,
        updatedLinecut.qWidth
      );

      // Update intensity data in both datasets
      setInclinedLinecutData1(prev =>
        prev.map(data =>
          data.id === id ? { ...data, data: newData1 } : data
        )
      );

      setInclinedLinecutData2(prev =>
        prev.map(data =>
          data.id === id ? { ...data, data: newData2 } : data
        )
      );
    }
  }, 200), [inclinedLinecuts, computeInclinedLinecutData, imageData1, imageData2]);

  /**
   * Updates the width of an inclined linecut in q-space
   *
   * @param id - ID of the linecut to update
   * @param qWidth - New width in q-space units
   */
  const updateInclinedLinecutWidth = useCallback(throttle((
    id: number,
    qWidth: number
  ) => {
    // Update the linecut with the new width
    setInclinedLinecuts(prev =>
      prev.map(linecut =>
        linecut.id === id ? { ...linecut, qWidth } : linecut
      )
    );

    // Get the updated linecut to recompute the data
    const updatedLinecut = inclinedLinecuts.find(l => l.id === id);
    if (!updatedLinecut) return;

    // Recompute intensity data with the new width
    if (imageData1.length > 0 && imageData2.length > 0) {
      const newData1 = computeInclinedLinecutData(
        imageData1,
        updatedLinecut.qXPosition,
        updatedLinecut.qYPosition,
        updatedLinecut.angle,
        qWidth
      );

      const newData2 = computeInclinedLinecutData(
        imageData2,
        updatedLinecut.qXPosition,
        updatedLinecut.qYPosition,
        updatedLinecut.angle,
        qWidth
      );

      // Update intensity data in both datasets
      setInclinedLinecutData1(prev =>
        prev.map(data =>
          data.id === id ? { ...data, data: newData1 } : data
        )
      );

      setInclinedLinecutData2(prev =>
        prev.map(data =>
          data.id === id ? { ...data, data: newData2 } : data
        )
      );
    }
  }, 200), [inclinedLinecuts, computeInclinedLinecutData, imageData1, imageData2]);

  /**
   * Updates the color of a linecut (left or right side)
   *
   * @param id - ID of the linecut to update
   * @param side - Which side to update ('left' or 'right')
   * @param color - New color in CSS format
   */
  const updateInclinedLinecutColor = useCallback((
    id: number,
    side: 'left' | 'right',
    color: string
  ) => {
    // Update the color property for the specified side of the linecut
    setInclinedLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id
          ? { ...linecut, [`${side}Color`]: color }
          : linecut
      )
    );
  }, []);

  /**
   * Removes a linecut and renumbers the remaining ones
   *
   * @param id - ID of the linecut to delete
   */
  const deleteInclinedLinecut = useCallback((id: number) => {
    // Remove the linecut from the list and renumber remaining linecuts
    setInclinedLinecuts((prev) => {
      const updatedLinecuts = prev.filter((linecut) => linecut.id !== id);
      // Renumber the remaining linecuts to maintain sequential IDs
      return updatedLinecuts.map((linecut, index) => ({
        ...linecut,
        id: index + 1,
      }));
    });

    // Similarly update the intensity data arrays for both images
    setInclinedLinecutData1((prev) =>
      prev.filter((data) => data.id !== id).map((data, index) => ({
        ...data,
        id: index + 1,
      }))
    );

    setInclinedLinecutData2((prev) =>
      prev.filter((data) => data.id !== id).map((data, index) => ({
        ...data,
        id: index + 1,
      }))
    );
  }, []);

  /**
   * Toggles the visibility of a linecut
   *
   * @param id - ID of the linecut to toggle
   */
  const toggleInclinedLinecutVisibility = useCallback((id: number) => {
    setInclinedLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
      )
    );
  }, []);

  /**
   * Effect to update all linecut data when qXVector or qYVector changes
   *
   * This ensures that if the q-space mapping changes, all linecuts maintain
   * their positions in q-space but update their visualizations correctly.
   */
  useEffect(() => {
    // Skip if vectors are empty or no linecuts exist
    if (!qXVector?.length || !qYVector?.length || !inclinedLinecuts.length) return;

    // Recompute all linecut data with current q-vectors
    inclinedLinecuts.forEach(linecut => {
      if (imageData1.length > 0 && imageData2.length > 0) {
        const newData1 = computeInclinedLinecutData(
          imageData1,
          linecut.qXPosition,
          linecut.qYPosition,
          linecut.angle,
          linecut.qWidth
        );

        const newData2 = computeInclinedLinecutData(
          imageData2,
          linecut.qXPosition,
          linecut.qYPosition,
          linecut.angle,
          linecut.qWidth
        );

        setInclinedLinecutData1(prev =>
          prev.map(data =>
            data.id === linecut.id ? { ...data, data: newData1 } : data
          )
        );

        setInclinedLinecutData2(prev =>
          prev.map(data =>
            data.id === linecut.id ? { ...data, data: newData2 } : data
          )
        );
      }
    });
  }, [qXVector, qYVector, inclinedLinecuts, computeInclinedLinecutData, imageData1, imageData2]);

  // Return all the state and functions needed to use and manage linecuts in q-space
  return {
    inclinedLinecuts,
    inclinedLinecutData1,
    inclinedLinecutData2,
    addInclinedLinecut,
    updateInclinedLinecutXPosition,
    updateInclinedLinecutYPosition,
    updateInclinedLinecutAngle,
    updateInclinedLinecutWidth,
    updateInclinedLinecutColor,
    deleteInclinedLinecut,
    toggleInclinedLinecutVisibility,
    calculateQPathDistance,
    zoomedXQRange,
    zoomedYQRange,
  };
}
