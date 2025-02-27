
// import { useCallback, useState } from 'react';
// import { Linecut } from '../types';
// import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';
// import { throttle } from 'lodash';


// export default function useHorizontalLinecut(
//     imageHeight: number,
//     imageData1: number[][],
//     imageData2: number[][],
// ) {

//   // 1. First, declare all useState hooks
//   const [horizontalLinecuts, setHorizontalLinecuts] = useState<Linecut[]>([]);
//   const [horizontalLinecutData1, setHorizontalLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
//   const [horizontalLinecutData2, setHorizontalLinecutData2] = useState<{ id: number; data: number[] }[]>([]);

//   // Compute horizontal linecut data
//   const computeHorizontalLinecutData = useCallback((
//     position: number,
//     imageData: number[][]): number[] => {
//     if (Array.isArray(imageData) && position >= 0 && position < imageData.length) {
//       return imageData[position];
//     }
//     return [];
//   }, []);

//   // Add a new horizontal linecut
//   const addHorizontalLinecut = useCallback(throttle(() => {
//     const existingIds = horizontalLinecuts.map((linecut) => linecut.id);
//     const newId = Math.max(0, ...existingIds) + 1;
//     const defaultPosition = Math.floor((imageHeight - 1) / 2);

//     const newLinecut = {
//       id: newId,
//       position: defaultPosition,
//       leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
//       rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
//       hidden: false,
//       width: 0,
//     };

//     setHorizontalLinecuts((prev) => [...prev, newLinecut]);
//     setSelectedLinecuts((prev) => [...prev, String(newLinecut.id)]);

//     if (imageData1.length > 0 && imageData2.length > 0) {
//       const data1 = computeHorizontalLinecutData(defaultPosition, imageData1);
//       const data2 = computeHorizontalLinecutData(defaultPosition, imageData2);

//       setHorizontalLinecutData1((prev) => [...prev, { id: newId, data: data1 }]);
//       setHorizontalLinecutData2((prev) => [...prev, { id: newId, data: data2 }]);
//     }
//   }, 200), [imageHeight, imageData1, imageData2, horizontalLinecuts, computeHorizontalLinecutData]);

//   // Update position of a horizontal linecut
//   const updateHorizontalLinecutPosition = useCallback(
//     throttle((id: number, position: number) => {
//       setHorizontalLinecuts(prev =>
//         prev.map(linecut =>
//           linecut.id === id ? { ...linecut, position } : linecut
//         )
//       );

//       if (imageData1.length > 0 && imageData2.length > 0) {
//         const newLinecutData1 = computeHorizontalLinecutData(position, imageData1);
//         const newLinecutData2 = computeHorizontalLinecutData(position, imageData2);

//         setHorizontalLinecutData1(prev =>
//           prev.map(data =>
//             data.id === id ? { ...data, data: newLinecutData1 } : data
//           )
//         );
//         setHorizontalLinecutData2(prev =>
//           prev.map(data =>
//             data.id === id ? { ...data, data: newLinecutData2 } : data
//           )
//         );
//       }
//     }, 200),
//     [imageData1, imageData2, computeHorizontalLinecutData]
//   );

//   // Update width of a horizontal linecut
//   const updateHorizontalLinecutWidth = useCallback(
//     throttle((id: number, width: number) => {
//       setHorizontalLinecuts((prev) =>
//         prev.map((linecut) =>
//           linecut.id === id ? { ...linecut, width } : linecut
//         )
//       );
//     }, 200),
//     []
//   );

//   // Update color of a horizontal linecut
//   const updateHorizontalLinecutColor = useCallback((id: number, side: 'left' | 'right', color: string) => {
//     setHorizontalLinecuts((prev) =>
//       prev.map((linecut) =>
//         linecut.id === id
//           ? { ...linecut, [`${side}Color`]: color }
//           : linecut
//       )
//     );
//   }, []);

//   // Delete a horizontal linecut
//   const deleteHorizontalLinecut = useCallback((id: number) => {
//     setHorizontalLinecuts((prev) => {
//       const updatedLinecuts = prev.filter((linecut) => linecut.id !== id);
//       return updatedLinecuts.map((linecut, index) => ({
//         ...linecut,
//         id: index + 1,
//       }));
//     });

//     setHorizontalLinecutData1((prev) =>
//       prev.filter((data) => data.id !== id).map((data, index) => ({
//         ...data,
//         id: index + 1,
//       }))
//     );

//     setHorizontalLinecutData2((prev) =>
//       prev.filter((data) => data.id !== id).map((data, index) => ({
//         ...data,
//         id: index + 1,
//       }))
//     );
//   }, []);

//   // Toggle visibility of a horizontal linecut
//   const toggleHorizontalLinecutVisibility = useCallback((id: number) => {
//     setHorizontalLinecuts((prev) =>
//       prev.map((linecut) =>
//         linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
//       )
//     );
//   }, []);


//   return {
//     horizontalLinecuts,
//     horizontalLinecutData1,
//     horizontalLinecutData2,
//     addHorizontalLinecut,
//     updateHorizontalLinecutPosition,
//     updateHorizontalLinecutWidth,
//     updateHorizontalLinecutColor,
//     deleteHorizontalLinecut,
//     toggleHorizontalLinecutVisibility,
//   };


// }







// import { useCallback, useState, useEffect } from 'react';
// import { Linecut } from '../types';
// import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';
// import { throttle } from 'lodash';

// /**
//  * Custom hook for managing horizontal linecuts based on q-values or pixel positions
//  * This version supports both pixel-based and q-value-based linecuts
//  *
//  * @param imageHeight - Height of the detector image in pixels
//  * @param imageData1 - 2D array of intensity values for first image
//  * @param imageData2 - 2D array of intensity values for second image
//  * @param qYVector - Array of q-values along Y axis (optional)
//  * @returns Object with linecut data and management functions
//  */
// export default function useHorizontalLinecut(
//     imageHeight: number,
//     imageData1: number[][],
//     imageData2: number[][],
//     qYVector: number[] = [] // Optional qYVector parameter
// ) {
//   // State for linecuts and their intensity data
//   const [horizontalLinecuts, setHorizontalLinecuts] = useState<Linecut[]>([]);
//   const [horizontalLinecutData1, setHorizontalLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
//   const [horizontalLinecutData2, setHorizontalLinecutData2] = useState<{ id: number; data: number[] }[]>([]);

// //   // We need a reference to selectedLinecuts if it's used in the original code
// //   // This would ideally be passed as a prop, but we'll keep it for compatibility
// //   const [selectedLinecuts, setSelectedLinecuts] = useState<string[]>([]);

//   /**
//    * Find the closest pixel row index for a given q-value
//    * This converts from q-space to pixel space
//    *
//    * @param targetQ - The q-value to find in the qYVector
//    * @param tolerance - Optional tolerance for finding inexact matches
//    * @returns The closest pixel row index
//    */
//   const findClosestPixelForQValue = useCallback((
//     targetQ: number,
//     tolerance: number = 0.1
//   ): number => {
//     // If qYVector is empty, return the default position
//     if (!qYVector || qYVector.length === 0) {
//       return Math.floor((imageHeight - 1) / 2);
//     }

//     // Find the index of the closest q-value to our target
//     let closestIndex = 0;
//     let smallestDifference = Math.abs(qYVector[0] - targetQ);

//     for (let i = 1; i < qYVector.length; i++) {
//       const difference = Math.abs(qYVector[i] - targetQ);
//       if (difference < smallestDifference) {
//         smallestDifference = difference;
//         closestIndex = i;
//       }
//     }

//     // Check if we're within tolerance
//     if (smallestDifference > tolerance) {
//       console.warn(`Could not find q-value ${targetQ} within tolerance ${tolerance}. Closest value is ${qYVector[closestIndex]}`);
//     }

//     return closestIndex;
//   }, [qYVector, imageHeight]);

//   /**
//    * Compute horizontal linecut data for a given pixel position
//    *
//    * @param position - The row index in pixel space
//    * @param imageData - 2D array of intensity values
//    * @returns 1D array of intensity values along the row
//    */
//   const computeHorizontalLinecutData = useCallback((
//     position: number,
//     imageData: number[][]
//   ): number[] => {
//     if (Array.isArray(imageData) && position >= 0 && position < imageData.length) {
//       return imageData[position];
//     }
//     return [];
//   }, []);

//   /**
//    * Add a new horizontal linecut
//    * Will use q-values if qYVector is available, otherwise uses pixel position
//    */
//   const addHorizontalLinecut = useCallback(throttle(() => {
//     const existingIds = horizontalLinecuts.map((linecut) => linecut.id);
//     const newId = Math.max(0, ...existingIds) + 1;

//     let newLinecut: Linecut;

//     if (qYVector && qYVector.length > 0) {
//       // Q-space mode when qYVector is available
//       // Calculate default q-value (middle of range or 0)
//       const minQ = Math.min(...qYVector);
//       const maxQ = Math.max(...qYVector);
//       const defaultQ = (minQ + maxQ) / 2;

//       // Find the pixel position for this q-value
//       const pixelPosition = findClosestPixelForQValue(defaultQ);

//       newLinecut = {
//         id: newId,
//         position: defaultQ,
//         pixelPosition: pixelPosition,
//         leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
//         rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
//         hidden: false,
//         width: 1.0,
//         qValue: defaultQ,
//         type: 'horizontal'
//       };
//     } else {
//       // Pixel-space mode (original behavior) when qYVector is not available
//       const defaultPosition = Math.floor((imageHeight - 1) / 2);

//       newLinecut = {
//         id: newId,
//         position: defaultPosition,
//         leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
//         rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
//         hidden: false,
//         width: 0,
//         type: 'horizontal'
//       };
//     }

//     setHorizontalLinecuts((prev) => [...prev, newLinecut]);
//     // setSelectedLinecuts((prev) => [...prev, String(newLinecut.id)]);

//     // Compute intensity data for the new linecut
//     if (imageData1.length > 0 && imageData2.length > 0) {
//       // Use pixelPosition if available (q-space mode), otherwise use position (pixel-space mode)
//       const position = newLinecut.pixelPosition !== undefined ? newLinecut.pixelPosition : newLinecut.position;

//       const data1 = computeHorizontalLinecutData(position, imageData1);
//       const data2 = computeHorizontalLinecutData(position, imageData2);

//       setHorizontalLinecutData1((prev) => [...prev, { id: newId, data: data1 }]);
//       setHorizontalLinecutData2((prev) => [...prev, { id: newId, data: data2 }]);
//     }
//   }, 200), [
//     imageHeight,
//     imageData1,
//     imageData2,
//     horizontalLinecuts,
//     computeHorizontalLinecutData,
//     qYVector,
//     findClosestPixelForQValue
//   ]);

//   /**
//    * Update position of a horizontal linecut
//    * Will use q-values if qYVector is available, otherwise uses pixel position directly
//    */
//   const updateHorizontalLinecutPosition = useCallback(
//     throttle((id: number, position: number) => {
//       if (qYVector && qYVector.length > 0) {
//         // Q-space mode
//         // Find the closest pixel position for this q-value
//         const pixelPosition = findClosestPixelForQValue(position);

//         // Update the linecut with both q-value and pixel position
//         setHorizontalLinecuts(prev =>
//           prev.map(linecut =>
//             linecut.id === id ? {
//               ...linecut,
//               position: position,         // q-value
//               pixelPosition: pixelPosition,
//               qValue: position
//             } : linecut
//           )
//         );

//         // Update intensity data using the pixel position
//         if (imageData1.length > 0 && imageData2.length > 0) {
//           const newLinecutData1 = computeHorizontalLinecutData(pixelPosition, imageData1);
//           const newLinecutData2 = computeHorizontalLinecutData(pixelPosition, imageData2);

//           setHorizontalLinecutData1(prev =>
//             prev.map(data =>
//               data.id === id ? { ...data, data: newLinecutData1 } : data
//             )
//           );
//           setHorizontalLinecutData2(prev =>
//             prev.map(data =>
//               data.id === id ? { ...data, data: newLinecutData2 } : data
//             )
//           );
//         }
//       } else {
//         // Pixel-space mode (original behavior)
//         setHorizontalLinecuts(prev =>
//           prev.map(linecut =>
//             linecut.id === id ? { ...linecut, position } : linecut
//           )
//         );

//         // Update intensity data using the pixel position directly
//         if (imageData1.length > 0 && imageData2.length > 0) {
//           const newLinecutData1 = computeHorizontalLinecutData(position, imageData1);
//           const newLinecutData2 = computeHorizontalLinecutData(position, imageData2);

//           setHorizontalLinecutData1(prev =>
//             prev.map(data =>
//               data.id === id ? { ...data, data: newLinecutData1 } : data
//             )
//           );
//           setHorizontalLinecutData2(prev =>
//             prev.map(data =>
//               data.id === id ? { ...data, data: newLinecutData2 } : data
//             )
//           );
//         }
//       }
//     }, 200),
//     [imageData1, imageData2, computeHorizontalLinecutData, qYVector, findClosestPixelForQValue]
//   );

//   /**
//    * Update width of a horizontal linecut
//    */
//   const updateHorizontalLinecutWidth = useCallback(
//     throttle((id: number, width: number) => {
//       setHorizontalLinecuts((prev) =>
//         prev.map((linecut) =>
//           linecut.id === id ? { ...linecut, width } : linecut
//         )
//       );

//       // Note: A more advanced implementation could add width-based averaging
//       // by finding all pixel rows within a q-range of [qValue - width/2, qValue + width/2]
//     }, 200),
//     []
//   );

//   /**
//    * Update color of a horizontal linecut
//    */
//   const updateHorizontalLinecutColor = useCallback((id: number, side: 'left' | 'right', color: string) => {
//     setHorizontalLinecuts((prev) =>
//       prev.map((linecut) =>
//         linecut.id === id
//           ? { ...linecut, [`${side}Color`]: color }
//           : linecut
//       )
//     );
//   }, []);

//   /**
//    * Delete a horizontal linecut
//    */
//   const deleteHorizontalLinecut = useCallback((id: number) => {
//     // Remove the linecut from the list
//     setHorizontalLinecuts((prev) => {
//       const updatedLinecuts = prev.filter((linecut) => linecut.id !== id);
//       return updatedLinecuts.map((linecut, index) => ({
//         ...linecut,
//         id: index + 1,
//       }));
//     });

//     // Remove the linecut data for image 1
//     setHorizontalLinecutData1((prev) =>
//       prev.filter((data) => data.id !== id).map((data, index) => ({
//         ...data,
//         id: index + 1,
//       }))
//     );

//     // Remove the linecut data for image 2
//     setHorizontalLinecutData2((prev) =>
//       prev.filter((data) => data.id !== id).map((data, index) => ({
//         ...data,
//         id: index + 1,
//       }))
//     );

//     // // Update selectedLinecuts if needed
//     // setSelectedLinecuts(prev => prev.filter(linecut => linecut !== String(id)));
//   }, []);

//   /**
//    * Toggle visibility of a horizontal linecut
//    */
//   const toggleHorizontalLinecutVisibility = useCallback((id: number) => {
//     setHorizontalLinecuts((prev) =>
//       prev.map((linecut) =>
//         linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
//       )
//     );
//   }, []);

//   /**
//    * Update all linecuts when qYVector changes
//    * This ensures pixel positions stay in sync with q-values
//    */
//   useEffect(() => {
//     // Skip if qYVector is empty or no linecuts exist
//     if (!qYVector.length || !horizontalLinecuts.length) return;

//     // Update all linecuts with new pixel positions
//     setHorizontalLinecuts(prev =>
//       prev.map(linecut => {
//         if (linecut.qValue) {
//           // For linecuts that have a qValue, update their pixel position
//           const pixelPosition = findClosestPixelForQValue(linecut.qValue);
//           return { ...linecut, pixelPosition };
//         }
//         return linecut;
//       })
//     );

//     // Update intensity data for all linecuts
//     horizontalLinecuts.forEach(linecut => {
//       if (imageData1.length > 0 && imageData2.length > 0 && linecut.qValue) {
//         const pixelPosition = findClosestPixelForQValue(linecut.qValue);

//         const newLinecutData1 = computeHorizontalLinecutData(pixelPosition, imageData1);
//         const newLinecutData2 = computeHorizontalLinecutData(pixelPosition, imageData2);

//         setHorizontalLinecutData1(prev =>
//           prev.map(data =>
//             data.id === linecut.id ? { ...data, data: newLinecutData1 } : data
//           )
//         );

//         setHorizontalLinecutData2(prev =>
//           prev.map(data =>
//             data.id === linecut.id ? { ...data, data: newLinecutData2 } : data
//           )
//         );
//       }
//     });
//   }, [qYVector, horizontalLinecuts, findClosestPixelForQValue, computeHorizontalLinecutData, imageData1, imageData2]);

//   return {
//     horizontalLinecuts,
//     horizontalLinecutData1,
//     horizontalLinecutData2,
//     addHorizontalLinecut,
//     updateHorizontalLinecutPosition,
//     updateHorizontalLinecutWidth,
//     updateHorizontalLinecutColor,
//     deleteHorizontalLinecut,
//     toggleHorizontalLinecutVisibility,
//   };
// }







import { useCallback, useState, useEffect } from 'react';
import { Linecut } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';
import { throttle } from 'lodash';

/**
 * Custom hook for managing horizontal linecuts based on q-values
 *
 * This hook provides functionality to create, manipulate, and visualize horizontal linecuts
 * on scattering images. Instead of working in pixel space, this implementation operates in
 * q-space (reciprocal space) which has physical meaning in scattering experiments.
 *
 * The hook maintains both q-value positions and their corresponding pixel positions,
 * handling the mapping between these two spaces automatically using the provided qYVector.
 *
 * @param imageHeight - Height of the detector image in pixels
 * @param imageData1 - 2D array of intensity values for first image
 * @param imageData2 - 2D array of intensity values for second image
 * @param qYVector - Array of q-values along Y axis, mapping each pixel index to a q-value
 * @returns Object with linecut data and management functions
 */
export default function useHorizontalLinecut(
    imageHeight: number,
    imageData1: number[][],
    imageData2: number[][],
    qYVector: number[] // Required qYVector parameter for q-space mapping
) {
  // State for storing the linecut definitions (position, width, colors, etc.)
  const [horizontalLinecuts, setHorizontalLinecuts] = useState<Linecut[]>([]);

  // State for storing the intensity data extracted from the images for each linecut
  // These arrays contain the actual data values that will be plotted in linecut figures
  const [horizontalLinecutData1, setHorizontalLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
  const [horizontalLinecutData2, setHorizontalLinecutData2] = useState<{ id: number; data: number[] }[]>([]);

  /**
   * Converts a q-value to the corresponding pixel row index
   *
   * This is a key function that handles the mapping from q-space (physical units)
   * to pixel space (image coordinates). It finds the index in qYVector that has
   * the closest q-value to the target value.
   *
   * @param targetQ - The q-value to find in the qYVector
   * @returns The pixel row index that best corresponds to the given q-value
   */
  const findClosestPixelForQValue = useCallback((
    targetQ: number
  ): number => {
    // Handle the case where qYVector is empty with a reasonable default
    if (!qYVector || qYVector.length === 0) {
      return Math.floor((imageHeight - 1) / 2); // Default to middle of image
    }

    // Find the index with the closest matching q-value through linear search
    let closestIndex = 0;
    let smallestDifference = Math.abs(qYVector[0] - targetQ);

    for (let i = 1; i < qYVector.length; i++) {
      const difference = Math.abs(qYVector[i] - targetQ);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestIndex = i;
      }
    }

    // Return the found pixel position (array index)
    return closestIndex;
  }, [qYVector, imageHeight]);

  /**
   * Extracts intensity data for a horizontal linecut at a specific pixel row
   *
   * This function simply returns the entire row of intensity values from the image
   * data array at the specified position, giving us the intensity profile along
   * the horizontal direction.
   *
   * @param position - The row index in pixel space to extract
   * @param imageData - 2D array of intensity values representing the image
   * @returns 1D array of intensity values along the specified row
   */
  const computeHorizontalLinecutData = useCallback((
    position: number,
    imageData: number[][]
  ): number[] => {
    // Verify position is within bounds of the image before extracting data
    if (Array.isArray(imageData) && position >= 0 && position < imageData.length) {
      return imageData[position]; // Simply return the entire row
    }
    return []; // Return empty array if out of bounds or data is invalid
  }, []);

  /**
   * Creates a new horizontal linecut at the center of the q-range
   *
   * This function calculates a default position in the middle of the available
   * q-range, finds the corresponding pixel position, and creates a new linecut
   * with unique colors. It also extracts and stores the intensity data from
   * both image datasets for the new linecut.
   */
  const addHorizontalLinecut = useCallback(throttle(() => {
    // Find the next available ID for the new linecut
    const existingIds = horizontalLinecuts.map((linecut) => linecut.id);
    const newId = Math.max(0, ...existingIds) + 1;

    // Calculate default q-value at the middle of the available range
    const minQ = qYVector.length > 0 ? Math.min(...qYVector) : 0;
    const maxQ = qYVector.length > 0 ? Math.max(...qYVector) : 0;
    const defaultQ = qYVector.length > 0 ? (minQ + maxQ) / 2 : 0;

    // Convert the q-value to the corresponding pixel position
    const pixelPosition = findClosestPixelForQValue(defaultQ);

    // Create the new linecut object with default properties
    const newLinecut: Linecut = {
      id: newId,
      position: defaultQ,         // Store q-value as the position
      pixelPosition: pixelPosition, // Also store the corresponding pixel position
      // Assign colors from palette, cycling through available colors
      leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
      rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
      hidden: false,              // Linecut is visible by default
      width: 0.0,                 // Start with zero width (just a line)
      type: 'horizontal'          // Identify this as a horizontal linecut
    };

    // Add the new linecut to the state
    setHorizontalLinecuts((prev) => [...prev, newLinecut]);

    // Extract and store intensity data for the new linecut from both images
    if (imageData1.length > 0 && imageData2.length > 0) {
      const data1 = computeHorizontalLinecutData(pixelPosition, imageData1);
      const data2 = computeHorizontalLinecutData(pixelPosition, imageData2);

      setHorizontalLinecutData1((prev) => [...prev, { id: newId, data: data1 }]);
      setHorizontalLinecutData2((prev) => [...prev, { id: newId, data: data2 }]);
    }
  }, 200), [  // Throttle to prevent rapid creation of multiple linecuts
    horizontalLinecuts,
    findClosestPixelForQValue,
    computeHorizontalLinecutData,
    imageData1,
    imageData2,
    qYVector
  ]);

  /**
   * Updates the position of an existing linecut to a new q-value
   *
   * This function handles position changes in q-space, updates the corresponding
   * pixel position, and refreshes the intensity data for the linecut. The throttling
   * prevents performance issues during rapid adjustments (e.g., slider movements).
   */
  const updateHorizontalLinecutPosition = useCallback(
    throttle((id: number, position: number) => {
      // Convert the new q-value position to pixel position
      const pixelPosition = findClosestPixelForQValue(position);

      // Update the linecut with both new q-value and corresponding pixel position
      setHorizontalLinecuts(prev =>
        prev.map(linecut =>
          linecut.id === id ? {
            ...linecut,
            position: position,        // Store the new q-value
            pixelPosition: pixelPosition // Store the new pixel position
          } : linecut
        )
      );

      // Update the intensity data for both images based on the new position
      if (imageData1.length > 0 && imageData2.length > 0) {
        const newLinecutData1 = computeHorizontalLinecutData(pixelPosition, imageData1);
        const newLinecutData2 = computeHorizontalLinecutData(pixelPosition, imageData2);

        // Update intensity data in both datasets
        setHorizontalLinecutData1(prev =>
          prev.map(data =>
            data.id === id ? { ...data, data: newLinecutData1 } : data
          )
        );
        setHorizontalLinecutData2(prev =>
          prev.map(data =>
            data.id === id ? { ...data, data: newLinecutData2 } : data
          )
        );
      }
    }, 200), // Throttle to limit updates during rapid adjustments
    [imageData1, imageData2, computeHorizontalLinecutData, findClosestPixelForQValue]
  );

  /**
   * Updates the width of a linecut in q-space
   *
   * This function simply updates the width property of the linecut in q-units.
   * The actual pixel-space width calculation happens in the overlay generation
   * function that uses this data.
   */
  const updateHorizontalLinecutWidth = useCallback(
    throttle((id: number, width: number) => {
      // Update the width property of the specified linecut
      setHorizontalLinecuts((prev) =>
        prev.map((linecut) =>
          linecut.id === id ? { ...linecut, width } : linecut
        )
      );
      // Note: The visual effect of this width change is handled in the
      // generateHorizontalLinecutOverlay function, which converts the q-space width
      // to pixel space for visualization
    }, 200), // Throttle to limit updates during slider adjustments
    []
  );

  /**
   * Updates the color of a linecut (left or right side)
   *
   * @param id - The ID of the linecut to update
   * @param side - Which side to update ('left' or 'right')
   * @param color - The new color value (CSS color string)
   */
  const updateHorizontalLinecutColor = useCallback((id: number, side: 'left' | 'right', color: string) => {
    // Update the color property for the specified side of the linecut
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id
          ? { ...linecut, [`${side}Color`]: color } // Use dynamic property name based on side
          : linecut
      )
    );
  }, []);

  /**
   * Removes a linecut and renumbers the remaining ones
   *
   * This function removes a linecut from both the linecut definitions and
   * the intensity data arrays, and renumbers the remaining linecuts to maintain
   * sequential IDs.
   */
  const deleteHorizontalLinecut = useCallback((id: number) => {
    // Remove the linecut from the list and renumber remaining linecuts
    setHorizontalLinecuts((prev) => {
      const updatedLinecuts = prev.filter((linecut) => linecut.id !== id);
      // Renumber the remaining linecuts to maintain sequential IDs
      return updatedLinecuts.map((linecut, index) => ({
        ...linecut,
        id: index + 1,
      }));
    });

    // Similarly update the intensity data arrays for both images
    setHorizontalLinecutData1((prev) =>
      prev.filter((data) => data.id !== id).map((data, index) => ({
        ...data,
        id: index + 1,
      }))
    );

    setHorizontalLinecutData2((prev) =>
      prev.filter((data) => data.id !== id).map((data, index) => ({
        ...data,
        id: index + 1,
      }))
    );
  }, []);

  /**
   * Toggles the visibility of a linecut
   *
   * This simply flips the 'hidden' flag for the specified linecut, which
   * controls whether it's displayed in the visualization.
   */
  const toggleHorizontalLinecutVisibility = useCallback((id: number) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
      )
    );
  }, []);

  /**
   * Synchronizes pixel positions when qYVector changes
   *
   * This effect ensures that if the q-value to pixel mapping changes
   * (due to calibration changes, for example), all the linecuts maintain
   * their positions in q-space but update their pixel positions accordingly.
   */
  useEffect(() => {
    // Skip if qYVector is empty or no linecuts exist
    if (!qYVector.length || !horizontalLinecuts.length) return;

    // Update all linecuts with new pixel positions based on their q-values
    setHorizontalLinecuts(prev =>
      prev.map(linecut => {
        // Recalculate pixel position based on current q-value and new mapping
        const pixelPosition = findClosestPixelForQValue(linecut.position);
        return { ...linecut, pixelPosition };
      })
    );

    // Update intensity data for all linecuts with new pixel positions
    horizontalLinecuts.forEach(linecut => {
      if (imageData1.length > 0 && imageData2.length > 0) {
        // Recalculate pixel position for current linecut
        const pixelPosition = findClosestPixelForQValue(linecut.position);

        // Extract new intensity data based on updated pixel position
        const newLinecutData1 = computeHorizontalLinecutData(pixelPosition, imageData1);
        const newLinecutData2 = computeHorizontalLinecutData(pixelPosition, imageData2);

        // Update intensity data for both images
        setHorizontalLinecutData1(prev =>
          prev.map(data =>
            data.id === linecut.id ? { ...data, data: newLinecutData1 } : data
          )
        );

        setHorizontalLinecutData2(prev =>
          prev.map(data =>
            data.id === linecut.id ? { ...data, data: newLinecutData2 } : data
          )
        );
      }
    });
  }, [qYVector, horizontalLinecuts, findClosestPixelForQValue, computeHorizontalLinecutData, imageData1, imageData2]);

  // Return all the state and functions needed to use and manage linecuts
  return {
    horizontalLinecuts,          // Linecut definitions (position, width, colors, etc.)
    horizontalLinecutData1,      // Intensity data for first image
    horizontalLinecutData2,      // Intensity data for second image
    addHorizontalLinecut,        // Function to create a new linecut
    updateHorizontalLinecutPosition, // Function to move a linecut
    updateHorizontalLinecutWidth,    // Function to change linecut width
    updateHorizontalLinecutColor,    // Function to update linecut colors
    deleteHorizontalLinecut,         // Function to remove a linecut
    toggleHorizontalLinecutVisibility, // Function to show/hide a linecut
  };
}
