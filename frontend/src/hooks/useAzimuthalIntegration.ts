// import { useState, useCallback, useRef, useEffect } from 'react';
// import { debounce } from 'lodash';
// import { decode } from "@msgpack/msgpack";
// import { AzimuthalData, AzimuthalIntegration, CalibrationParams } from '../types';
// import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';

// // The interface we expect from the server - this matches exactly what we should receive
// interface AzimuthalIntegratorResponse {
//     q_max: number;
//     q_1: number[];
//     q_2: number[];
//     intensity_1: number[];
//     intensity_2: number[];
//     q_array_filtered_1: number[][];
//     q_array_filtered_2: number[][];
//     q_x: number[];  // New field for q_x vector
//     q_y: number[];  // New field for q_y vector
// }

// // Our cache structure - this is separate from what the server sends
// interface CachedMatrixData {
//     qArray1: number[][];
//     qArray2: number[][];
//     qVectorX: number[];  // Added for storing q_x vector
//     qVectorY: number[];  // Added for storing q_y vector
//     calibrationHash: string;
//     azimuthRange: [number, number];
//     intensityData1: number[];
//     intensityData2: number[];
//     qValues1: number[];
//     qValues2: number[];
// }

// // Type guard that matches our expected interface
// function isAzimuthalIntegratorResponse(value: unknown): value is AzimuthalIntegratorResponse {
//     const response = value as AzimuthalIntegratorResponse;
//     return (
//         typeof response === 'object' &&
//         response !== null &&
//         typeof response.q_max === 'number' &&
//         Array.isArray(response.q_1) &&
//         Array.isArray(response.q_2) &&
//         Array.isArray(response.intensity_1) &&
//         Array.isArray(response.intensity_2) &&
//         Array.isArray(response.q_array_filtered_1) &&
//         Array.isArray(response.q_array_filtered_2)
//         // Array.isArray(response.q_x) &&   // Check for q_x
//         // Array.isArray(response.q_y)      // Check for q_y
//     );
// }

// export default function useAzimuthalIntegration() {
//     // State Management
//     const [azimuthalIntegrations, setAzimuthalIntegrations] = useState<AzimuthalIntegration[]>([]);
//     const [azimuthalData1, setAzimuthalData1] = useState<AzimuthalData[]>([]);
//     const [azimuthalData2, setAzimuthalData2] = useState<AzimuthalData[]>([]);
//     const [maxQValue, setMaxQValue] = useState<number>(2);
//     const [globalQRange, setGlobalQRange] = useState<[number, number] | null>(null);
//     const [globalAzimuthRange, setGlobalAzimuthRange] = useState<[number, number]>([-180, 180]);
//     const [cachedMatrixData, setCachedMatrixData] = useState<CachedMatrixData | null>(null);

//     // State for storing q_x and q_y data for visualization
//     const [qXVector, setQXVector] = useState<number[]>([]);
//     const [qYVector, setQYVector] = useState<number[]>([]);


//     const [calibrationParams, setCalibrationParams] = useState<CalibrationParams>({
//         sample_detector_distance: 274.83,
//         beam_center_x: 317.8,
//         beam_center_y: 1245.28,
//         pixel_size_x: 172,
//         pixel_size_y: 172,
//         wavelength: 1.2398,
//         tilt: 0,
//         tilt_plan_rotation: 0
//     });

//     // Utility Functions
//     const createCacheKey = useCallback((params: CalibrationParams, azimuthRange: [number, number]): string => {
//         return JSON.stringify({ calibration: params, azimuth: azimuthRange });
//     }, []);

//     const filterByQRange = useCallback((
//         qArray: number[][],
//         qRange: [number, number] | null
//     ): number[][] => {
//         if (!qRange) return qArray;
//         return qArray.map(row =>
//             row.map(value =>
//                 (value >= qRange[0] && value <= qRange[1]) ? value : NaN
//             )
//         );
//     }, []);

//     // Helper function to update integration data
//     const updateIntegrationData = useCallback((
//         id: number,
//         data: {
//             q1: number[],
//             q2: number[],
//             intensity1: number[],
//             intensity2: number[],
//             qArray1: number[][],
//             qArray2: number[][]
//         }
//     ) => {
//         const { q1, q2, intensity1, intensity2, qArray1, qArray2 } = data;

//         setAzimuthalData1(prev => {
//             const filtered = prev.filter(d => d.id !== id);
//             return [...filtered, {
//                 id,
//                 q: q1,
//                 intensity: intensity1,
//                 qArray: qArray1
//             }];
//         });

//         setAzimuthalData2(prev => {
//             const filtered = prev.filter(d => d.id !== id);
//             return [...filtered, {
//                 id,
//                 q: q2,
//                 intensity: intensity2,
//                 qArray: qArray2
//             }];
//         });
//     }, []);

//     // Main data fetching function
//     const fetchAzimuthalData = useCallback(async (
//         id: number,
//         qRange: [number, number] | null,
//         azimuthRange: [number, number]
//     ) => {
//         // Generate a unique key for caching based on current parameters
//         const currentCacheKey = createCacheKey(calibrationParams, azimuthRange);

//         // Check if we need to fetch new data by comparing cache keys
//         // This happens if:
//         // 1. We have no cached data (!cachedMatrixData), or
//         // 2. The current parameters don't match the cached parameters
//         try {
//             const needsNewData = !cachedMatrixData ||
//                                currentCacheKey !== cachedMatrixData.calibrationHash ||
//                                azimuthRange !== cachedMatrixData.azimuthRange;

//             console.log('needsNewData', needsNewData);
//             if (needsNewData) {
//                 // Create a URL object for the API endpoint
//                 // URL is a built-in JavaScript class for handling URLs
//                 const url = new URL('http://127.0.0.1:8000/api/azimuthal-integrator');

//                 // Add all calibration parameters to the URL as query parameters
//                 // Object.entries() converts an object into an array of [key, value] pairs
//                 // forEach() executes a function for each item in the array
//                 Object.entries(calibrationParams).forEach(([key, value]) => {
//                     url.searchParams.set(key, value.toString());
//                 });
//                 // URLSearchParams is a built-in API for handling URL query parameters
//                 url.searchParams.set('azimuth_range_deg', `${azimuthRange[0]},${azimuthRange[1]}`);

//                 // Add the azimuth range to the URL parameters
//                 // Template literals (`${x}`) allow embedding expressions in strings
//                 const response = await fetch(url.toString());

//                 // Check if the request was successful (status code 200-299)
//                 if (!response.ok) {
//                     throw new Error(`Failed to fetch azimuthal integration data: ${await response.text()}`);
//                 }

//                 // Convert the response to a binary array buffer and decode it
//                 // arrayBuffer() gets the raw binary data
//                 // Uint8Array creates a typed array of 8-bit unsigned integers
//                 // decode() converts the binary MessagePack format back to JavaScript objects
//                 const decodedData = decode(new Uint8Array(await response.arrayBuffer()));

//                 // Validate the response format using our type guard
//                 if (!isAzimuthalIntegratorResponse(decodedData)) {
//                     throw new Error('Invalid response format from server');
//                 }

//                 // Update the q_x and q_y matrices in state
//                 setQXVector(decodedData.q_x);
//                 setQYVector(decodedData.q_y);

//                 // Store the fetched data in the cache
//                 // This prevents unnecessary future API calls
//                 setCachedMatrixData({
//                     qArray1: decodedData.q_array_filtered_1,
//                     qArray2: decodedData.q_array_filtered_2,
//                     qVectorX: decodedData.q_x,           // Store q_x
//                     qVectorY: decodedData.q_y,           // Store q_y
//                     calibrationHash: currentCacheKey,
//                     azimuthRange,
//                     intensityData1: decodedData.intensity_1,
//                     intensityData2: decodedData.intensity_2,
//                     qValues1: decodedData.q_1,
//                     qValues2: decodedData.q_2
//                 });

//                 // If this is the first time we're getting data,
//                 // initialize the global Q-range based on the maximum Q value
//                 if (maxQValue === 2) {
//                     setMaxQValue(decodedData.q_max);
//                     setGlobalQRange([0, decodedData.q_max]);
//                 }

//                 // Update the integration data with the new values
//                 // filterByQRange applies the Q-range filter to the arrays
//                 updateIntegrationData(id, {
//                     q1: decodedData.q_1,
//                     q2: decodedData.q_2,
//                     intensity1: decodedData.intensity_1,
//                     intensity2: decodedData.intensity_2,
//                     qArray1: filterByQRange(decodedData.q_array_filtered_1, qRange),
//                     qArray2: filterByQRange(decodedData.q_array_filtered_2, qRange)
//                 });
//             } else {
//                 // If we don't need new data, use the cached values
//                 // Set the q_x and q_y matrices from the cache
//                 setQXVector(cachedMatrixData.qVectorX);
//                 setQYVector(cachedMatrixData.qVectorY);
//                 // This saves unnecessary API calls
//                 updateIntegrationData(id, {
//                     q1: cachedMatrixData.qValues1,
//                     q2: cachedMatrixData.qValues2,
//                     intensity1: cachedMatrixData.intensityData1,
//                     intensity2: cachedMatrixData.intensityData2,
//                     qArray1: filterByQRange(cachedMatrixData.qArray1, qRange),
//                     qArray2: filterByQRange(cachedMatrixData.qArray2, qRange)
//                 });
//             }
//         } catch (error) {
//             // If any error occurs during the process, log it and re-throw
//             console.error('Error in azimuthal integration:', error);
//             throw error;
//         }
//     }, [calibrationParams, cachedMatrixData, createCacheKey, filterByQRange, maxQValue, updateIntegrationData]);

//     // Debounced update functions
//     const debouncedQRangeUpdate = useRef(
//         debounce((params: {
//             id: number,
//             qRange: [number, number],
//             azimuthRange: [number, number],
//             setGlobalQRange: typeof setGlobalQRange,
//             setAzimuthalIntegrations: typeof setAzimuthalIntegrations,
//             fetchAzimuthalData: typeof fetchAzimuthalData
//         }) => {
//             const { id, qRange, azimuthRange, setGlobalQRange, setAzimuthalIntegrations, fetchAzimuthalData } = params;
//             setGlobalQRange(qRange);
//             setAzimuthalIntegrations(prev =>
//                 prev.map(integration =>
//                     integration.id === id ? { ...integration, qRange } : integration
//                 )
//             );
//             fetchAzimuthalData(id, qRange, azimuthRange);
//         }, 100)
//     ).current;


//     const debouncedAzimuthRangeUpdate = useRef(
//         debounce((params: {
//             id: number,
//             qRange: [number, number] | null,
//             azimuthRange: [number, number],
//             setGlobalAzimuthRange: typeof setGlobalAzimuthRange,
//             setAzimuthalIntegrations: typeof setAzimuthalIntegrations,
//             fetchAzimuthalData: typeof fetchAzimuthalData
//         }) => {
//             const { id, qRange, azimuthRange, setGlobalAzimuthRange, setAzimuthalIntegrations, fetchAzimuthalData } = params;
//             setGlobalAzimuthRange(azimuthRange);
//             setAzimuthalIntegrations(prev =>
//                 prev.map(integration =>
//                     integration.id === id ? { ...integration, azimuthRange } : integration
//                 )
//             );
//             fetchAzimuthalData(id, qRange, azimuthRange);
//         }, 500)
//     ).current;

//     // Cleanup effect
//     useEffect(() => {
//         return () => {
//             debouncedQRangeUpdate.cancel();
//             debouncedAzimuthRangeUpdate.cancel();
//         };
//     }, [debouncedQRangeUpdate, debouncedAzimuthRangeUpdate]);


//     // Integration management functions
//     const addAzimuthalIntegration = useCallback(() => {
//         const DEFAULT_AZIMUTH_RANGE: [number, number] = [-180, 180];
//         const existingIds = azimuthalIntegrations.map(integration => integration.id);
//         const newId = Math.max(0, ...existingIds) + 1;

//         const newIntegration: AzimuthalIntegration = {
//             id: newId,
//             qRange: null,
//             azimuthRange: DEFAULT_AZIMUTH_RANGE,
//             leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
//             rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
//             hidden: false
//         };

//         setAzimuthalIntegrations(prev => [...prev, newIntegration]);
//         setGlobalAzimuthRange(DEFAULT_AZIMUTH_RANGE);
//         fetchAzimuthalData(newId, globalQRange, DEFAULT_AZIMUTH_RANGE);
//     }, [fetchAzimuthalData, azimuthalIntegrations, globalQRange]);

//     const updateAzimuthalQRange = useCallback((id: number, qRange: [number, number]) => {
//         const currentIntegration = azimuthalIntegrations.find(i => i.id === id);
//         if (currentIntegration) {
//             debouncedQRangeUpdate({
//                 id,
//                 qRange,
//                 azimuthRange: currentIntegration.azimuthRange || [-180, 180],
//                 setGlobalQRange,
//                 setAzimuthalIntegrations,
//                 fetchAzimuthalData
//             });
//         }
//     }, [azimuthalIntegrations, fetchAzimuthalData, debouncedQRangeUpdate]);

//     const updateAzimuthalRange = useCallback((id: number, azimuthRange: [number, number]) => {
//         const currentIntegration = azimuthalIntegrations.find(i => i.id === id);
//         if (currentIntegration) {
//             debouncedAzimuthRangeUpdate({
//                 id,
//                 qRange: currentIntegration.qRange,
//                 azimuthRange,
//                 setGlobalAzimuthRange,
//                 setAzimuthalIntegrations,
//                 fetchAzimuthalData
//             });
//         }
//     }, [azimuthalIntegrations, fetchAzimuthalData, debouncedAzimuthRangeUpdate]);

//     const updateAzimuthalColor = useCallback((id: number, side: 'left' | 'right', color: string) => {
//         setAzimuthalIntegrations(prev =>
//             prev.map(integration =>
//                 integration.id === id
//                     ? { ...integration, [`${side}Color`]: color }
//                     : integration
//             )
//         );
//     }, []);


//     const deleteAzimuthalIntegration = useCallback((id: number) => {
//         // Clear the cached matrix data
//         setCachedMatrixData(null);

//         // Remove the integration's data
//         setAzimuthalData1(prev =>
//             prev.filter(data => data.id !== id).map((data, index) => ({
//                 ...data,
//                 id: index + 1,
//             }))
//         );

//         setAzimuthalData2(prev =>
//             prev.filter(data => data.id !== id).map((data, index) => ({
//                 ...data,
//                 id: index + 1,
//             }))
//         );

//         // Update the integrations list
//         setAzimuthalIntegrations(prev => {
//             const updatedIntegrations = prev.filter(integration => integration.id !== id);
//             return updatedIntegrations.map((integration, index) => ({
//                 ...integration,
//                 id: index + 1,
//             }));
//         });
//     }, []);


//     const toggleAzimuthalVisibility = useCallback((id: number) => {
//         setAzimuthalIntegrations(prev =>
//             prev.map(integration =>
//                 integration.id === id ? { ...integration, hidden: !integration.hidden } : integration
//             )
//         );
//     }, []);

//     // const updateCalibration = useCallback((newParams: CalibrationParams) => {
//     //     setCalibrationParams(newParams);
//     //     // Clear cache when calibration changes
//     //     setCachedMatrixData(null);

//     //     // Refresh all active integrations
//     //     azimuthalIntegrations
//     //         .filter(integration => !integration.hidden)
//     //         .forEach(integration => {
//     //             fetchAzimuthalData(
//     //                 integration.id,
//     //                 integration.qRange,
//     //                 integration.azimuthRange
//     //             );
//     //         });
//     // }, [azimuthalIntegrations, fetchAzimuthalData]);

//     // // Update calibration parameters only
//     // const updateCalibration = useCallback((newParams: CalibrationParams) => {
//     //     setCalibrationParams(newParams);
//     // }, []); // No dependencies needed

//     // // Handle data fetching in an effect
//     // useEffect(() => {
//     //     // Skip if no calibration params or no integrations
//     //     if (!calibrationParams || azimuthalIntegrations.length === 0) return;

//     //     console.log('Fetching azimuthal data...');

//     //     // Update all visible integrations
//     //     azimuthalIntegrations
//     //         .filter(integration => !integration.hidden)
//     //         .forEach(integration => {
//     //             fetchAzimuthalData(
//     //                 integration.id,
//     //                 integration.qRange,
//     //                 integration.azimuthRange
//     //             );
//     //         });
//     // }, [calibrationParams, azimuthalIntegrations, fetchAzimuthalData]);

//     // New coordinator function for updating all relevant integrations
//     const updateAllVisibleIntegrations = useCallback(() => {
//         if (azimuthalIntegrations.length === 0) return;

//         azimuthalIntegrations
//             .filter(integration => !integration.hidden)
//             .forEach(integration => {
//                 fetchAzimuthalData(
//                     integration.id,
//                     integration.qRange,
//                     integration.azimuthRange
//                 );
//             });
//     }, [azimuthalIntegrations, fetchAzimuthalData]);

//     // Then update the calibration function to use this coordinator
//     const updateCalibration = useCallback((newParams: CalibrationParams) => {
//         // Set the new parameters
//         setCalibrationParams(newParams);

//         // Explicitly invalidate the cache
//         setCachedMatrixData(null);

//         // Use the coordinator to update all integrations
//         updateAllVisibleIntegrations();
//     }, [updateAllVisibleIntegrations]);


//     // Return hook interface
//     return {
//         // State
//         azimuthalIntegrations,
//         azimuthalData1,
//         azimuthalData2,
//         maxQValue,
//         globalQRange,
//         globalAzimuthRange,
//         calibrationParams,
//         qXVector,         // New export for q_x data
//         qYVector,         // New export for q_y data

//         // Functions
//         addAzimuthalIntegration,
//         updateAzimuthalQRange,
//         updateAzimuthalRange,
//         updateAzimuthalColor,
//         deleteAzimuthalIntegration,
//         toggleAzimuthalVisibility,
//         updateCalibration,
//         fetchAzimuthalData,
//     };
// }


import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { decode } from "@msgpack/msgpack";
import { AzimuthalData, AzimuthalIntegration, CalibrationParams } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';

/**
 * Response type for azimuthal integration data
 * This contains the core integration results
 */
interface AzimuthalIntegratorResponse {
    q_max: number;         // Maximum q-value
    q_1: number[];         // q-values for first integration
    q_2: number[];         // q-values for second integration
    intensity_1: number[]; // Intensity values for first integration
    intensity_2: number[]; // Intensity values for second integration
    q_array_filtered_1: number[][]; // 2D array of filtered q-values for visualization (img 1)
    q_array_filtered_2: number[][]; // 2D array of filtered q-values for visualization (img 2)
}

/**
 * Our cache structure to prevent unnecessary API calls
 * Note: This is separate from what the server sends
 */
interface CachedMatrixData {
    qArray1: number[][];       // 2D array for image 1 visualization
    qArray2: number[][];       // 2D array for image 2 visualization
    calibrationHash: string;   // Hash of calibration + azimuth for cache validation
    azimuthRange: [number, number]; // Current azimuth range
    intensityData1: number[];  // Intensity values for first integration
    intensityData2: number[];  // Intensity values for second integration
    qValues1: number[];        // q-values for first integration
    qValues2: number[];        // q-values for second integration
}

/**
 * Type guard to validate azimuthal integration response
 * Ensures the response has the expected structure
 */
function isAzimuthalIntegratorResponse(value: unknown): value is AzimuthalIntegratorResponse {
    const response = value as AzimuthalIntegratorResponse;
    return (
        typeof response === 'object' &&
        response !== null &&
        typeof response.q_max === 'number' &&
        Array.isArray(response.q_1) &&
        Array.isArray(response.q_2) &&
        Array.isArray(response.intensity_1) &&
        Array.isArray(response.intensity_2) &&
        Array.isArray(response.q_array_filtered_1) &&
        Array.isArray(response.q_array_filtered_2)
    );
}

/**
 * Custom hook for managing azimuthal integration data
 * Now accepts calibration parameters and q-vectors from parent
 *
 * @param calibrationParams - Calibration parameters from parent component
 * @returns Functions and state for azimuthal integration
 */
export default function useAzimuthalIntegration(calibrationParams: CalibrationParams) {
    // ======== STATE MANAGEMENT ========

    // Azimuthal integrations list and associated data
    const [azimuthalIntegrations, setAzimuthalIntegrations] = useState<AzimuthalIntegration[]>([]);
    const [azimuthalData1, setAzimuthalData1] = useState<AzimuthalData[]>([]);
    const [azimuthalData2, setAzimuthalData2] = useState<AzimuthalData[]>([]);

    // Q-range, azimuth range, and max Q value
    const [maxQValue, setMaxQValue] = useState<number>(2);
    const [globalQRange, setGlobalQRange] = useState<[number, number] | null>(null);
    const [globalAzimuthRange, setGlobalAzimuthRange] = useState<[number, number]>([-180, 180]);

    // Cache for repeated API calls
    const [cachedMatrixData, setCachedMatrixData] = useState<CachedMatrixData | null>(null);

    // ======== UTILITY FUNCTIONS ========

    /**
     * Creates a cache key from calibration params and azimuth range
     * Used to determine if we need to fetch new data
     */
    const createCacheKey = useCallback((params: CalibrationParams, azimuthRange: [number, number]): string => {
        return JSON.stringify({ calibration: params, azimuth: azimuthRange });
    }, []);

    /**
     * Filters q-arrays by the specified q-range
     * Sets values outside the range to NaN for visualization
     */
    const filterByQRange = useCallback((
        qArray: number[][],
        qRange: [number, number] | null
    ): number[][] => {
        if (!qRange) return qArray;
        return qArray.map(row =>
            row.map(value =>
                (value >= qRange[0] && value <= qRange[1]) ? value : NaN
            )
        );
    }, []);

    /**
     * Updates azimuthal integration data for both images
     * Handles adding or replacing data by ID
     */
    const updateIntegrationData = useCallback((
        id: number,
        data: {
            q1: number[],
            q2: number[],
            intensity1: number[],
            intensity2: number[],
            qArray1: number[][],
            qArray2: number[][]
        }
    ) => {
        const { q1, q2, intensity1, intensity2, qArray1, qArray2 } = data;

        // Update data for image 1
        setAzimuthalData1(prev => {
            const filtered = prev.filter(d => d.id !== id);
            return [...filtered, {
                id,
                q: q1,
                intensity: intensity1,
                qArray: qArray1
            }];
        });

        // Update data for image 2
        setAzimuthalData2(prev => {
            const filtered = prev.filter(d => d.id !== id);
            return [...filtered, {
                id,
                q: q2,
                intensity: intensity2,
                qArray: qArray2
            }];
        });
    }, []);

    /**
     * Main data fetching function
     * Fetches azimuthal integration data
     */
    const fetchAzimuthalData = useCallback(async (
        id: number,
        qRange: [number, number] | null,
        azimuthRange: [number, number]
    ) => {
        // Generate a unique key for caching based on current parameters
        const currentCacheKey = createCacheKey(calibrationParams, azimuthRange);

        try {
            // Determine if we need new data by checking cache validity
            const needsNewData = !cachedMatrixData ||
                               currentCacheKey !== cachedMatrixData.calibrationHash ||
                               azimuthRange !== cachedMatrixData.azimuthRange;

            console.log('Need to fetch new data:', needsNewData);

            if (needsNewData) {
                // Create a URL for the azimuthal integrator endpoint
                const url = new URL('http://127.0.0.1:8000/api/azimuthal-integrator');

                // Add all calibration parameters to the URL
                Object.entries(calibrationParams).forEach(([key, value]) => {
                    url.searchParams.set(key, value.toString());
                });

                // Add azimuth range to the parameters
                url.searchParams.set('azimuth_range_deg', `${azimuthRange[0]},${azimuthRange[1]}`);

                // Fetch azimuthal integration data
                const response = await fetch(url.toString());

                // Check for HTTP errors
                if (!response.ok) {
                    throw new Error(`Failed to fetch azimuthal integration data: ${await response.text()}`);
                }

                // Decode the binary msgpack response
                const decodedData = decode(new Uint8Array(await response.arrayBuffer()));

                // Validate the response format
                if (!isAzimuthalIntegratorResponse(decodedData)) {
                    throw new Error('Invalid azimuthal integrator response format from server');
                }

                // Store fetched data in cache
                setCachedMatrixData({
                    qArray1: decodedData.q_array_filtered_1,
                    qArray2: decodedData.q_array_filtered_2,
                    calibrationHash: currentCacheKey,
                    azimuthRange,
                    intensityData1: decodedData.intensity_1,
                    intensityData2: decodedData.intensity_2,
                    qValues1: decodedData.q_1,
                    qValues2: decodedData.q_2
                });

                // Update max Q value if needed (first fetch only)
                if (maxQValue === 2) {
                    setMaxQValue(decodedData.q_max);
                    setGlobalQRange([0, decodedData.q_max]);
                }

                // Update integration data with filtered values
                updateIntegrationData(id, {
                    q1: decodedData.q_1,
                    q2: decodedData.q_2,
                    intensity1: decodedData.intensity_1,
                    intensity2: decodedData.intensity_2,
                    qArray1: filterByQRange(decodedData.q_array_filtered_1, qRange),
                    qArray2: filterByQRange(decodedData.q_array_filtered_2, qRange)
                });
            } else {
                // Use cached data if available
                updateIntegrationData(id, {
                    q1: cachedMatrixData.qValues1,
                    q2: cachedMatrixData.qValues2,
                    intensity1: cachedMatrixData.intensityData1,
                    intensity2: cachedMatrixData.intensityData2,
                    qArray1: filterByQRange(cachedMatrixData.qArray1, qRange),
                    qArray2: filterByQRange(cachedMatrixData.qArray2, qRange)
                });
            }
        } catch (error) {
            console.error('Error in azimuthal integration:', error);
            throw error;
        }
    }, [
        calibrationParams,
        cachedMatrixData,
        createCacheKey,
        filterByQRange,
        maxQValue,
        updateIntegrationData
    ]);

    // ======== DEBOUNCED FUNCTIONS ========

    /**
     * Debounced version of Q-range update
     * Prevents excessive API calls during slider movement
     */
    const debouncedQRangeUpdate = useRef(
        debounce((params: {
            id: number,
            qRange: [number, number],
            azimuthRange: [number, number],
            setGlobalQRange: typeof setGlobalQRange,
            setAzimuthalIntegrations: typeof setAzimuthalIntegrations,
            fetchAzimuthalData: typeof fetchAzimuthalData
        }) => {
            const { id, qRange, azimuthRange, setGlobalQRange, setAzimuthalIntegrations, fetchAzimuthalData } = params;
            setGlobalQRange(qRange);
            setAzimuthalIntegrations(prev =>
                prev.map(integration =>
                    integration.id === id ? { ...integration, qRange } : integration
                )
            );
            fetchAzimuthalData(id, qRange, azimuthRange);
        }, 100) // 100ms debounce time
    ).current;

    /**
     * Debounced version of azimuth range update
     * Prevents excessive API calls during slider movement
     */
    const debouncedAzimuthRangeUpdate = useRef(
        debounce((params: {
            id: number,
            qRange: [number, number] | null,
            azimuthRange: [number, number],
            setGlobalAzimuthRange: typeof setGlobalAzimuthRange,
            setAzimuthalIntegrations: typeof setAzimuthalIntegrations,
            fetchAzimuthalData: typeof fetchAzimuthalData
        }) => {
            const { id, qRange, azimuthRange, setGlobalAzimuthRange, setAzimuthalIntegrations, fetchAzimuthalData } = params;
            setGlobalAzimuthRange(azimuthRange);
            setAzimuthalIntegrations(prev =>
                prev.map(integration =>
                    integration.id === id ? { ...integration, azimuthRange } : integration
                )
            );
            fetchAzimuthalData(id, qRange, azimuthRange);
        }, 500) // 500ms debounce time (longer for azimuth since it triggers API calls)
    ).current;

    // Cleanup debounced functions on unmount
    useEffect(() => {
        return () => {
            debouncedQRangeUpdate.cancel();
            debouncedAzimuthRangeUpdate.cancel();
        };
    }, [debouncedQRangeUpdate, debouncedAzimuthRangeUpdate]);

    // ======== INTEGRATION MANAGEMENT FUNCTIONS ========

    /**
     * Creates a new azimuthal integration with default parameters
     */
    const addAzimuthalIntegration = useCallback(() => {
        const DEFAULT_AZIMUTH_RANGE: [number, number] = [-180, 180];

        // Get next available ID
        const existingIds = azimuthalIntegrations.map(integration => integration.id);
        const newId = Math.max(0, ...existingIds) + 1;

        // Create new integration object
        const newIntegration: AzimuthalIntegration = {
            id: newId,
            qRange: null,
            azimuthRange: DEFAULT_AZIMUTH_RANGE,
            leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
            rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
            hidden: false
        };

        // Add to state and trigger data fetch
        setAzimuthalIntegrations(prev => [...prev, newIntegration]);
        setGlobalAzimuthRange(DEFAULT_AZIMUTH_RANGE);
        fetchAzimuthalData(newId, globalQRange, DEFAULT_AZIMUTH_RANGE);
    }, [fetchAzimuthalData, azimuthalIntegrations, globalQRange]);

    /**
     * Updates the Q-range for a specific integration
     */
    const updateAzimuthalQRange = useCallback((id: number, qRange: [number, number]) => {
        const currentIntegration = azimuthalIntegrations.find(i => i.id === id);
        if (currentIntegration) {
            debouncedQRangeUpdate({
                id,
                qRange,
                azimuthRange: currentIntegration.azimuthRange || [-180, 180],
                setGlobalQRange,
                setAzimuthalIntegrations,
                fetchAzimuthalData
            });
        }
    }, [azimuthalIntegrations, fetchAzimuthalData, debouncedQRangeUpdate]);

    /**
     * Updates the azimuth range for a specific integration
     */
    const updateAzimuthalRange = useCallback((id: number, azimuthRange: [number, number]) => {
        const currentIntegration = azimuthalIntegrations.find(i => i.id === id);
        if (currentIntegration) {
            debouncedAzimuthRangeUpdate({
                id,
                qRange: currentIntegration.qRange,
                azimuthRange,
                setGlobalAzimuthRange,
                setAzimuthalIntegrations,
                fetchAzimuthalData
            });
        }
    }, [azimuthalIntegrations, fetchAzimuthalData, debouncedAzimuthRangeUpdate]);

    /**
     * Updates the color of an integration line
     */
    const updateAzimuthalColor = useCallback((id: number, side: 'left' | 'right', color: string) => {
        setAzimuthalIntegrations(prev =>
            prev.map(integration =>
                integration.id === id
                    ? { ...integration, [`${side}Color`]: color }
                    : integration
            )
        );
    }, []);

    /**
     * Deletes an integration and its associated data
     */
    const deleteAzimuthalIntegration = useCallback((id: number) => {
        // Clear the cached matrix data to ensure fresh fetch for next integration
        setCachedMatrixData(null);

        // Remove the integration's data from image 1
        setAzimuthalData1(prev =>
            prev.filter(data => data.id !== id).map((data, index) => ({
                ...data,
                id: index + 1, // Reindex remaining integrations
            }))
        );

        // Remove the integration's data from image 2
        setAzimuthalData2(prev =>
            prev.filter(data => data.id !== id).map((data, index) => ({
                ...data,
                id: index + 1, // Reindex remaining integrations
            }))
        );

        // Update the integrations list
        setAzimuthalIntegrations(prev => {
            const updatedIntegrations = prev.filter(integration => integration.id !== id);
            return updatedIntegrations.map((integration, index) => ({
                ...integration,
                id: index + 1, // Reindex remaining integrations
            }));
        });
    }, []);

    /**
     * Toggles visibility of an integration
     */
    const toggleAzimuthalVisibility = useCallback((id: number) => {
        setAzimuthalIntegrations(prev =>
            prev.map(integration =>
                integration.id === id ? { ...integration, hidden: !integration.hidden } : integration
            )
        );
    }, []);

    // /**
    //  * Coordinator function for updating all visible integrations
    //  * Used when calibration changes
    //  */
    // const updateAllVisibleIntegrations = useCallback(() => {
    //     if (azimuthalIntegrations.length === 0) return;

    //     // Update each visible integration with new data
    //     azimuthalIntegrations
    //         .filter(integration => !integration.hidden)
    //         .forEach(integration => {
    //             fetchAzimuthalData(
    //                 integration.id,
    //                 integration.qRange,
    //                 integration.azimuthRange
    //             );
    //         });
    // }, [azimuthalIntegrations, fetchAzimuthalData]);

    // /**
    //  * Refreshes data when calibration parameters change
    //  * Now doesn't need to update parameters since they come from props
    //  */
    // const updateCalibration = useCallback(() => {
    //     // Explicitly invalidate the cache
    //     setCachedMatrixData(null);

    //     // Update all visible integrations with new calibration
    //     updateAllVisibleIntegrations();
    // }, [updateAllVisibleIntegrations]);

    // ======== RETURN HOOK INTERFACE ========

    return {
        // State
        azimuthalIntegrations,
        azimuthalData1,
        azimuthalData2,
        maxQValue,
        globalQRange,
        globalAzimuthRange,

        // Functions
        addAzimuthalIntegration,
        updateAzimuthalQRange,
        updateAzimuthalRange,
        updateAzimuthalColor,
        deleteAzimuthalIntegration,
        toggleAzimuthalVisibility,
        // updateCalibration,
        fetchAzimuthalData,
    };
}
