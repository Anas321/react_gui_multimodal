import { useState, useCallback } from 'react';
import { InclinedLinecut } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';
import { throttle } from 'lodash';
import { calculateInclinedLineEndpoints } from '../utils/calculateInclinedLinecutEndpoints';


export default function useInclinedLinecut(
    imageWidth: number,
    imageHeight: number,
    imageData1: number[][],
    imageData2: number[][],
) {

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
        computeInclinedLinecutData,
        setInclinedLinecutData1,
        setInclinedLinecutData2,
    }
}
