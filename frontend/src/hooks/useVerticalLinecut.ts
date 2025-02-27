import { useState, useCallback } from 'react';
import { Linecut } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';
import { throttle } from 'lodash';


export default function useVerticalLinecut(
    imageWidth: number,
    imageData1: number[][],
    imageData2: number[][],
) {

    // Add new states for vertical linecuts
    const [verticalLinecuts, setVerticalLinecuts] = useState<Linecut[]>([]);
    const [verticalLinecutData1, setVerticalLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
    const [verticalLinecutData2, setVerticalLinecutData2] = useState<{ id: number; data: number[] }[]>([]);

    // Compute vertical linecut data
    const computeVerticalLinecutData = useCallback((position: number, imageData: number[][]): number[] => {
        // First validate the input parameters
        if (Array.isArray(imageData) &&
            imageData[0] && // Check first row exists
            position >= 0 &&
            position < imageData[0].length) {
            // For vertical linecuts, we take values from the same position in each row
            // This creates an array of intensity values going from top to bottom
            return imageData.map(row => row[position]);
        }
        // Return empty array if validation fails
        return [];
    }, []); // No dependencies needed since this is a pure computation

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


    return {
        verticalLinecuts,
        verticalLinecutData1,
        verticalLinecutData2,
        addVerticalLinecut,
        updateVerticalLinecutPosition,
        updateVerticalLinecutWidth,
        updateVerticalLinecutColor,
        deleteVerticalLinecut,
        toggleVerticalLinecutVisibility,
    }

}
