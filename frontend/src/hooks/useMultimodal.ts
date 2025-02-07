import { useEffect, useMemo, useState, useCallback } from 'react';
import { debounce, set, throttle } from 'lodash';
import { Linecut, InclinedLinecut } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';
import { calculateInclinedLineEndpoints } from '../utils/calculateInclinedLinecutEndpoints';


export default function useMultimodal() {

  // 1. First, declare all useState hooks
  const [horizontalLinecuts, setHorizontalLinecuts] = useState<Linecut[]>([]);
  const [experimentType, setExperimentType] = useState('SAXS');
  const [selectedLinecuts, setSelectedLinecuts] = useState<string[]>([]);
  const [horizontalLinecutPosition, setHorizontalLinecutPosition] = useState(0);
  const [horizontalLinecutData1, setHorizontalLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
  const [horizontalLinecutData2, setHorizontalLinecutData2] = useState<{ id: number; data: number[] }[]>([]);
  const [imageHeight, setImageHeight] = useState<number>(100);
  const [imageWidth, setImageWidth] = useState<number>(100);
  const [imageData1, setImageData1] = useState<number[][]>([]);
  const [imageData2, setImageData2] = useState<number[][]>([]);
  const [zoomedXPixelRange, setZoomedXPixelRange] = useState<[number, number] | null>(null);
  const [zoomedYPixelRange, setZoomedYPixelRange] = useState<[number, number] | null>(null);


  // 2. Then declare all useMemo hooks
  // Cache linecut data computations
  const linecutDataCache = useMemo(() => new Map(), []);


  // 3. Then declare all useCallback hooks
  const computeLinecutData = useCallback((position: number, imageData: number[][]): number[] => {
    const cacheKey = `${position}-${imageData.length}`;
    if (linecutDataCache.has(cacheKey)) {
      return linecutDataCache.get(cacheKey);
    }

    if (Array.isArray(imageData) && position >= 0 && position < imageData.length) {
      const data = imageData[position];
      linecutDataCache.set(cacheKey, data);
      return data;
    }
    return [];
  }, [linecutDataCache]);


  // 4. Finally, declare all throttle and debounce hooks
  // Throttle the update linecut position function to prevent too many updates
  const throttledUpdateLinecutPosition = useCallback(
    throttle((id: number, position: number) => {
      setHorizontalLinecuts(prev =>
        prev.map(linecut =>
          linecut.id === id ? { ...linecut, position } : linecut
        )
      );

      if (imageData1.length > 0 && imageData2.length > 0) {
        const newLinecutData1 = computeLinecutData(position, imageData1);
        const newLinecutData2 = computeLinecutData(position, imageData2);

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
    }, 200, { leading: true, trailing: true }),
    [imageData1, imageData2, computeLinecutData]
  );


  // Update the color of a horizontal linecut
  const updateHorizontalLinecutColor = (id: number, side: 'left' | 'right', color: string) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id
          ? { ...linecut, [`${side}Color`]: color } // Update either `leftColor` or `rightColor`
          : linecut
      )
    );
  };


  // Delete a horizontal linecut
  const deleteHorizontalLinecut = (id: number) => {
    setHorizontalLinecuts((prev) => {
      // Filter out the linecut to be deleted
      const updatedLinecuts = prev.filter((linecut) => linecut.id !== id);

      // Renumber the remaining linecuts to keep the order
      return updatedLinecuts.map((linecut, index) => ({
        ...linecut,
        id: index + 1, // Reassign IDs starting from 1
      }));
    });

    // Also update the linecut data (if applicable)
    setHorizontalLinecutData1((prev) =>
      prev.filter((data) => data.id !== id).map((data, index) => ({
        ...data,
        id: index + 1, // Ensure the IDs in data match the updated linecuts
      }))
    );

    setHorizontalLinecutData2((prev) =>
      prev.filter((data) => data.id !== id).map((data, index) => ({
        ...data,
        id: index + 1, // Ensure the IDs in data match the updated linecuts
      }))
    );
  };


  // Toggle the visibility of a horizontal linecut
  const toggleHorizontalLinecutVisibility = (id: number) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
      )
    );
  };

  // Add a new horizontal linecut
  const addHorizontalLinecut = throttle(() => {
    // Ensure unique IDs for new linecuts
    const existingIds = horizontalLinecuts.map((linecut) => linecut.id);
    const newId = Math.max(0, ...existingIds) + 1;

    const defaultPosition = Math.floor((imageHeight - 1) / 2); // Default position at the center

    const newLinecut = {
      id: newId,
      position: defaultPosition,
      leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
      rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
      hidden: false,
      width: 0, // Default width
    };

    // Add the new linecut
    setHorizontalLinecuts((prev) => [...prev, newLinecut]);

    // Add to selected linecuts
    setSelectedLinecuts((prev) => [...prev, String(newLinecut.id)]);

    // Set the position state for the new linecut
    setHorizontalLinecutPosition(defaultPosition);

    // Compute and set linecut data for both images
    if (imageData1.length > 0 && imageData2.length > 0) {
      const data1 = imageData1[defaultPosition];
      const data2 = imageData2[defaultPosition];

      setHorizontalLinecutData1((prev) => [...prev, { id: newId, data: data1 }]);
      setHorizontalLinecutData2((prev) => [...prev, { id: newId, data: data2 }]);
    }
  }, 200);


  // Update the position of a horizontal linecut
  const updateHorizontalLinecutPosition = (id: number, position: number) => {
    throttledUpdateLinecutPosition(id, position);
  };

  // Update the width of a horizontal linecut
  const updateHorizontalLinecutWidth = (id: number, width: number) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id
          ? {
              ...linecut,
              width, // Update only the width
            }
          : linecut
      )
    );
  };


  // ====================================================
  // Vertical Linecuts
  // ====================================================

    // Add new states for vertical linecuts
    const [verticalLinecuts, setVerticalLinecuts] = useState<Linecut[]>([]);
    const [verticalLinecutData1, setVerticalLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
    const [verticalLinecutData2, setVerticalLinecutData2] = useState<{ id: number; data: number[] }[]>([]);

    // Add vertical linecut computation function
    const computeVerticalLinecutData = useCallback((position: number, imageData: number[][]): number[] => {
        const cacheKey = `vertical-${position}-${imageData.length}`;
        if (linecutDataCache.has(cacheKey)) {
        return linecutDataCache.get(cacheKey);
        }

        if (Array.isArray(imageData) && imageData[0] && position >= 0 && position < imageData[0].length) {
        const data = imageData.map(row => row[position]);
        linecutDataCache.set(cacheKey, data);
        return data;
        }
        return [];
    }, [linecutDataCache]);

    // Add vertical linecut functions
    const addVerticalLinecut = throttle(() => {
        const existingIds = verticalLinecuts.map((linecut) => linecut.id);
        const newId = Math.max(0, ...existingIds) + 1;
        const defaultPosition = Math.floor((imageWidth - 1) / 2); // Default position at the center

        const newLinecut = {
        id: newId,
        position: defaultPosition,
        leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
        rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
        hidden: false,
        width: 0,
        };

        setVerticalLinecuts((prev) => [...prev, newLinecut]);

        if (imageData1.length > 0 && imageData2.length > 0) {
        const data1 = computeVerticalLinecutData(defaultPosition, imageData1);
        const data2 = computeVerticalLinecutData(defaultPosition, imageData2);

        setVerticalLinecutData1((prev) => [...prev, { id: newId, data: data1 }]);
        setVerticalLinecutData2((prev) => [...prev, { id: newId, data: data2 }]);
        }
    }, 200);

    const updateVerticalLinecutPosition = useCallback(
        throttle((id: number, position: number) => {
        setVerticalLinecuts(prev =>
            prev.map(linecut =>
            linecut.id === id ? { ...linecut, position } : linecut
            )
        );

        if (imageData1.length > 0 && imageData2.length > 0) {
            const newLinecutData1 = computeVerticalLinecutData(position, imageData1);
            const newLinecutData2 = computeVerticalLinecutData(position, imageData2);

            setVerticalLinecutData1(prev =>
            prev.map(data =>
                data.id === id ? { ...data, data: newLinecutData1 } : data
            )
            );
            setVerticalLinecutData2(prev =>
            prev.map(data =>
                data.id === id ? { ...data, data: newLinecutData2 } : data
            )
            );
        }
        }, 200),
        [imageData1, imageData2, computeVerticalLinecutData]
    );

    const updateVerticalLinecutWidth = (id: number, width: number) => {
        setVerticalLinecuts((prev) =>
        prev.map((linecut) =>
            linecut.id === id ? { ...linecut, width } : linecut
        )
        );
    };

    const updateVerticalLinecutColor = (id: number, side: 'left' | 'right', color: string) => {
        setVerticalLinecuts((prev) =>
        prev.map((linecut) =>
            linecut.id === id
            ? { ...linecut, [`${side}Color`]: color }
            : linecut
        )
        );
    };

    const deleteVerticalLinecut = (id: number) => {
        setVerticalLinecuts((prev) => {
        const updatedLinecuts = prev.filter((linecut) => linecut.id !== id);
        return updatedLinecuts.map((linecut, index) => ({
            ...linecut,
            id: index + 1,
        }));
        });

        setVerticalLinecutData1((prev) =>
        prev.filter((data) => data.id !== id).map((data, index) => ({
            ...data,
            id: index + 1,
        }))
        );

        setVerticalLinecutData2((prev) =>
        prev.filter((data) => data.id !== id).map((data, index) => ({
            ...data,
            id: index + 1,
        }))
        );
    };

    const toggleVerticalLinecutVisibility = (id: number) => {
        setVerticalLinecuts((prev) =>
        prev.map((linecut) =>
            linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
        )
        );
    };


  // ==================================================== End of vertical linecuts


  // ====================================================
  // Inclined Linecuts
  // ====================================================

  // State declarations for inclined linecuts
  const [inclinedLinecuts, setInclinedLinecuts] = useState<InclinedLinecut[]>([]);
  const [inclinedLinecutData1, setInclinedLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
  const [inclinedLinecutData2, setInclinedLinecutData2] = useState<{ id: number; data: number[] }[]>([]);



  // Compute intensity along an inclined line using interpolation
  const computeInclinedLinecutData = useCallback((
    imageData: number[][],
    xPos: number,
    yPos: number,
    angle: number,
    width: number
  ): number[] => {
    // Get the endpoints
    const endpoints = calculateInclinedLineEndpoints({
      linecut: {
        xPosition: xPos,
        yPosition: yPos,
        angle,
        width,
        id: 0,
        leftColor: '',
        rightColor: '',
        hidden: false,
        type: 'inclined'
      },
      imageWidth: imageData[0].length,
      imageHeight: imageData.length
    });

    if (!endpoints) return [];
    const { x0, y0, x1, y1 } = endpoints;

    // // Calculate the total distance and unit vector
    // const distanceInX = x1 - x0;
    // const distanceInY = y1 - y0;
    // const length = Math.sqrt(distanceInX * distanceInX + distanceInY * distanceInY);

    // Calculate direction vectors using the same convention as calculateInclinedLineEndpoints
    const angleRad = (angle * Math.PI) / 180;
    const dirX = Math.cos(angleRad);
    const dirY = -Math.sin(angleRad);  // Match the negative sign convention

    // Perpendicular vector (rotated 90 degrees counter-clockwise)
    const perpX = -dirY;  // This becomes sin(angleRad)
    const perpY = -dirX;  // This becomes -cos(angleRad)

    const distanceInX = x1 - x0;
    const distanceInY = y1 - y0;
    const length = Math.sqrt(distanceInX * distanceInX + distanceInY * distanceInY);

    // If we have zero length, return empty array
    if (length === 0) return [];

    // // Unit vectors for direction and perpendicular
    // const dirX = distanceInX / length;
    // const dirY = distanceInY / length;

    // // Perpendicular unit vector (rotated 90 degrees)
    // const perpX = -dirY;
    // const perpY = dirX;

    // Sample points along the line
    const numPoints = Math.ceil(length);
    const intensities = new Array(numPoints).fill(0);
    const halfWidth = width / 2;

    // For each point along the line
    for (let i = 0; i < numPoints; i++) {
      let sum = 0;
      let count = 0;

      // Base position along the line
      const baseX = x0 + (i * dirX);
      const baseY = y0 + (i * dirY);

      // Sample perpendicular to the line for width averaging
      for (let w = -halfWidth; w <= halfWidth; w++) {
        const x = Math.round(baseX + (w * perpX));
        const y = Math.round(baseY + (w * perpY));

        // console.log(x, y);

        // Check if point is within bounds
        if (x >= 0 && x < imageData[0].length && y >= 0 && y < imageData.length) {
          sum += imageData[y][x];
          count++;
        }
      }

      intensities[i] = count > 0 ? sum / count : 0;
    }

    return intensities;
  }, []);



  // Add a new inclined linecut
  const addInclinedLinecut = useCallback(throttle(() => {
    const existingIds = inclinedLinecuts.map((linecut) => linecut.id);
    const newId = Math.max(0, ...existingIds) + 1;

    // Create default linecut at center of image
    const defaultLinecut: InclinedLinecut = {
      id: newId,
      xPosition: Math.floor(imageWidth / 2),  // center x
      yPosition: Math.floor(imageHeight / 2), // center y
      leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
      rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
      hidden: false,
      width: 0,
      angle: 45,  // Default 45-degree angle
      type: 'inclined'
    };

    // Add new linecut to state
    setInclinedLinecuts(prev => [...prev, defaultLinecut]);

    // Compute initial linecut data
    if (imageData1.length > 0 && imageData2.length > 0) {
      const data1 = computeInclinedLinecutData(
        imageData1,
        defaultLinecut.xPosition,
        defaultLinecut.yPosition,
        defaultLinecut.angle,
        defaultLinecut.width
      );
      const data2 = computeInclinedLinecutData(
        imageData2,
        defaultLinecut.xPosition,
        defaultLinecut.yPosition,
        defaultLinecut.angle,
        defaultLinecut.width
      );

      setInclinedLinecutData1(prev => [...prev, { id: newId, data: data1 }]);
      setInclinedLinecutData2(prev => [...prev, { id: newId, data: data2 }]);
    }
  }, 200), [imageWidth, imageHeight, imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]);

  // Update x position of an inclined linecut
  const updateInclinedLinecutXPosition = useCallback(
    throttle((id: number, xPosition: number) => {
      // Update linecut x position only
      setInclinedLinecuts(prev =>
        prev.map(linecut =>
          linecut.id === id
            ? { ...linecut, xPosition }
            : linecut
        )
      );

      // Update linecut data
      if (imageData1.length > 0 && imageData2.length > 0) {
        const linecut = inclinedLinecuts.find(l => l.id === id);
        if (linecut) {
          const newData1 = computeInclinedLinecutData(
            imageData1,
            xPosition,
            linecut.yPosition,
            linecut.angle,
            linecut.width
          );
          const newData2 = computeInclinedLinecutData(
            imageData2,
            xPosition,
            linecut.yPosition,
            linecut.angle,
            linecut.width
          );

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
      }
    }, 200),
    [imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]
  );

  // Update y position of an inclined linecut
  const updateInclinedLinecutYPosition = useCallback(
    throttle((id: number, yPosition: number) => {
      // Update linecut y position only
      setInclinedLinecuts(prev =>
        prev.map(linecut =>
          linecut.id === id
            ? { ...linecut, yPosition }
            : linecut
        )
      );

      // Update linecut data
      if (imageData1.length > 0 && imageData2.length > 0) {
        const linecut = inclinedLinecuts.find(l => l.id === id);
        if (linecut) {
          const newData1 = computeInclinedLinecutData(
            imageData1,
            linecut.xPosition,
            yPosition,
            linecut.angle,
            linecut.width
          );
          const newData2 = computeInclinedLinecutData(
            imageData2,
            linecut.xPosition,
            yPosition,
            linecut.angle,
            linecut.width
          );

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
      }
    }, 200),
    [imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]
  );

  // Update angle of an inclined linecut
  const updateInclinedLinecutAngle = useCallback(
    throttle((id: number, angle: number) => {
      // Normalize angle to -180 to 180 range
      const normalizedAngle = ((angle % 360 + 540) % 360) - 180;

      // Update linecut angle
      setInclinedLinecuts(prev =>
        prev.map(linecut =>
          linecut.id === id ? { ...linecut, angle: normalizedAngle } : linecut
        )
      );

      // Update linecut data
      if (imageData1.length > 0 && imageData2.length > 0) {
        const linecut = inclinedLinecuts.find(l => l.id === id);
        if (linecut) {
          const newData1 = computeInclinedLinecutData(
            imageData1,
            linecut.xPosition,
            linecut.yPosition,
            normalizedAngle,
            linecut.width
          );
          const newData2 = computeInclinedLinecutData(
            imageData2,
            linecut.xPosition,
            linecut.yPosition,
            normalizedAngle,
            linecut.width
          );

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
      }
    }, 200),
    [imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]
  );

  // Update width of an inclined linecut
  const updateInclinedLinecutWidth = useCallback(
    throttle((id: number, width: number) => {
      // Update linecut width
      setInclinedLinecuts(prev =>
        prev.map(linecut =>
          linecut.id === id ? { ...linecut, width } : linecut
        )
      );

      // Update linecut data
      if (imageData1.length > 0 && imageData2.length > 0) {
        const linecut = inclinedLinecuts.find(l => l.id === id);
        if (linecut) {
          const newData1 = computeInclinedLinecutData(
            imageData1,
            linecut.xPosition,
            linecut.yPosition,
            linecut.angle,
            width
          );
          const newData2 = computeInclinedLinecutData(
            imageData2,
            linecut.xPosition,
            linecut.yPosition,
            linecut.angle,
            width
          );

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
      }
    }, 200),
    [imageData1, imageData2, inclinedLinecuts, computeInclinedLinecutData]
  );

  // Update color of an inclined linecut
  const updateInclinedLinecutColor = useCallback((id: number, side: 'left' | 'right', color: string) => {
    setInclinedLinecuts(prev =>
      prev.map(linecut =>
        linecut.id === id
          ? { ...linecut, [`${side}Color`]: color }
          : linecut
      )
    );
  }, []);

  // Delete an inclined linecut
  const deleteInclinedLinecut = useCallback((id: number) => {
    // Remove linecut and reindex remaining ones
    setInclinedLinecuts(prev => {
      const updatedLinecuts = prev.filter(linecut => linecut.id !== id);
      return updatedLinecuts.map((linecut, index) => ({
        ...linecut,
        id: index + 1,
      }));
    });

    // Update corresponding data arrays
    setInclinedLinecutData1(prev =>
      prev.filter(data => data.id !== id).map((data, index) => ({
        ...data,
        id: index + 1,
      }))
    );
    setInclinedLinecutData2(prev =>
      prev.filter(data => data.id !== id).map((data, index) => ({
        ...data,
        id: index + 1,
      }))
    );
  }, []);

  // Toggle visibility of an inclined linecut
  const toggleInclinedLinecutVisibility = useCallback((id: number) => {
    setInclinedLinecuts(prev =>
      prev.map(linecut =>
        linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
      )
    );
  }, []);

  // ===================================================== End of inclined linecuts


  // ====================================================
  // Data transformation
  // ====================================================

  const [isLogScale, setIsLogScale] = useState(false);
  const [lowerPercentile, setLowerPercentile] = useState(1);
  const [upperPercentile, setUpperPercentile] = useState(99);
  const [normalization, setNormalization] = useState<string>('none');


  // ==================================================== End of data transformation







  const [resolutionMessage, setResolutionMessage] = useState('');





  return {
    horizontalLinecuts,
    setHorizontalLinecuts,
    experimentType,
    setExperimentType,
    selectedLinecuts,
    setSelectedLinecuts,
    horizontalLinecutData1,
    setHorizontalLinecutData1,
    horizontalLinecutData2,
    setHorizontalLinecutData2,
    imageHeight,
    setImageHeight,
    imageWidth,
    setImageWidth,
    imageData1,
    setImageData1,
    imageData2,
    setImageData2,
    updateHorizontalLinecutColor,
    deleteHorizontalLinecut,
    toggleHorizontalLinecutVisibility,
    addHorizontalLinecut,
    updateHorizontalLinecutPosition,
    updateHorizontalLinecutWidth,
    zoomedXPixelRange,
    setZoomedXPixelRange,
    // Add vertical linecut states and functions
    verticalLinecuts,
    setVerticalLinecuts,
    verticalLinecutData1,
    verticalLinecutData2,
    addVerticalLinecut,
    updateVerticalLinecutPosition,
    updateVerticalLinecutWidth,
    updateVerticalLinecutColor,
    deleteVerticalLinecut,
    toggleVerticalLinecutVisibility,
    zoomedYPixelRange,
    setZoomedYPixelRange,
    // For the zoom display message
    resolutionMessage,
    setResolutionMessage,
    // Inclined linecut states and functions
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
    computeInclinedLinecutData,
    setInclinedLinecutData1,
    setInclinedLinecutData2,
    // Data transformation states and functions
    isLogScale,
    setIsLogScale,
    lowerPercentile,
    setLowerPercentile,
    upperPercentile,
    setUpperPercentile,
    normalization,
    setNormalization,
  };

}
