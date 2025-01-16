import { useEffect, useMemo, useState } from 'react';
import { debounce, set, throttle } from 'lodash';
import { Linecut } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';


export default function useMultimodal() {

  const [horizontalLinecuts, setHorizontalLinecuts] = useState<Linecut[]>([]);
  const [experimentType, setExperimentType] = useState('SAXS');
  const [selectedLinecuts, setSelectedLinecuts] = useState<string[]>([]); // Manage multiple linecuts
  const [horizontalLinecutPosition, setHorizontalLinecutPosition] = useState(0);
  const [horizontalLinecutData1, setHorizontalLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
  const [horizontalLinecutData2, setHorizontalLinecutData2] = useState<{ id: number; data: number[] }[]>([]);
  const [imageHeight, setImageHeight] = useState<number>(100); // Default value for height
  const [imageWidth, setImageWidth] = useState<number>(100);  // Default value for width
  const [imageData1, setImageData1] = useState<number[][]>([]); // Data for scatter image 1
  const [imageData2, setImageData2] = useState<number[][]>([]); // Data for scatter image 2



  const updateHorizontalLinecutColor = (id: number, side: 'left' | 'right', color: string) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id
          ? { ...linecut, [`${side}Color`]: color } // Update either `leftColor` or `rightColor`
          : linecut
      )
    );
  };


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



  const toggleHorizontalLinecutVisibility = (id: number) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
      )
    );
  };


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


  const throttledUpdateLinecutPosition = throttle((id, position) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id ? { ...linecut, position } : linecut
      )
    );

    setHorizontalLinecutPosition(position);

    if (imageData1.length > 0 && imageData2.length > 0) {
      const newLinecutData1 = computeLinecutData(position, imageData1);
      const newLinecutData2 = computeLinecutData(position, imageData2);

      // Inline debounced functions
      const debouncedSetData1 = debounce((data) => {
        setHorizontalLinecutData1((prev) =>
          prev.map((linecutData) =>
            linecutData.id === id ? { ...linecutData, data } : linecutData
          )
        );
      }, 100);

      const debouncedSetData2 = debounce((data) => {
        setHorizontalLinecutData2((prev) =>
          prev.map((linecutData) =>
            linecutData.id === id ? { ...linecutData, data } : linecutData
          )
        );
      }, 100);

      // Call the debounced setters
      debouncedSetData1(newLinecutData1);
      debouncedSetData2(newLinecutData2);

      // Cleanup to prevent memory leaks
      debouncedSetData1.cancel();
      debouncedSetData2.cancel();
    }
  }, 100);


  const updateHorizontalLinecutPosition = (id: number, position: number) => {
    throttledUpdateLinecutPosition(id, position);
  };


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


  const computeLinecutData = (position: number, imageData: number[][]): number[] => {
    if (Array.isArray(imageData) && position >= 0 && position < imageData.length) {
      return imageData[position];
    }
    return [];
  };


  // Memoized linecut data for both images
  const linecutDataMemoized1 = useMemo(() => {
    return computeLinecutData(horizontalLinecutPosition, imageData1);
  }, [horizontalLinecutPosition, imageData1]);

  const linecutDataMemoized2 = useMemo(() => {
    return computeLinecutData(horizontalLinecutPosition, imageData2);
  }, [horizontalLinecutPosition, imageData2]);


useEffect(() => {
    const debouncedSetData1 = debounce((newData) => {
      setHorizontalLinecutData1((prev) => [...prev, newData]);
    }, 100);

    const debouncedSetData2 = debounce((newData) => {
      setHorizontalLinecutData2((prev) => [...prev, newData]);
    }, 100);

    if (linecutDataMemoized1.length > 0 && linecutDataMemoized2.length > 0) {
      debouncedSetData1({ id: horizontalLinecutPosition, data: linecutDataMemoized1 });
      debouncedSetData2({ id: horizontalLinecutPosition, data: linecutDataMemoized2 });
    }

    // Cleanup to prevent memory leaks
    return () => {
      debouncedSetData1.cancel();
      debouncedSetData2.cancel();
    };
  }, [linecutDataMemoized1, linecutDataMemoized2, horizontalLinecutPosition]);


    const [zoomedPixelRange, setZoomedPixelRange] = useState<[number, number] | null>(null);


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

    // verticalLinecuts,
    // setVerticalLinecuts,
    // verticalLinecutData1,
    // verticalLinecutData2,
    // addVerticalLinecut,
    // updateVerticalLinecutPosition,

  };

}
