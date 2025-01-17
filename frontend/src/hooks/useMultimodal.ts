import { useEffect, useMemo, useState, useCallback } from 'react';
import { debounce, set, throttle } from 'lodash';
import { Linecut } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';


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
  const [zoomedPixelRange, setZoomedPixelRange] = useState<[number, number] | null>(null);


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

    const defaultPosition = 0 // Math.floor(imageHeight / 2); // Default position at the center

    const newLinecut = {
      id: newId,
      position: defaultPosition,
      leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
      rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
      hidden: false,
      width: 1, // Default width
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
    zoomedPixelRange,
    setZoomedPixelRange,
  };

}
