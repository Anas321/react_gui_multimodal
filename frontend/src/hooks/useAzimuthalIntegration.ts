import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { decode } from "@msgpack/msgpack";
import { AzimuthalData, AzimuthalIntegration, CalibrationParams } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';

// The interface we expect from the server - this matches exactly what we should receive
interface AzimuthalIntegratorResponse {
    q_max: number;
    q_1: number[];
    q_2: number[];
    intensity_1: number[];
    intensity_2: number[];
    q_array_filtered_1: number[][];
    q_array_filtered_2: number[][];
}

// Our cache structure - this is separate from what the server sends
interface CachedMatrixData {
    qArray1: number[][];
    qArray2: number[][];
    calibrationHash: string;
    azimuthRange: [number, number];
    intensityData1: number[];
    intensityData2: number[];
    qValues1: number[];
    qValues2: number[];
}

// Type guard that matches our expected interface
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

export default function useAzimuthalIntegration() {
    // State Management
    const [azimuthalIntegrations, setAzimuthalIntegrations] = useState<AzimuthalIntegration[]>([]);
    const [azimuthalData1, setAzimuthalData1] = useState<AzimuthalData[]>([]);
    const [azimuthalData2, setAzimuthalData2] = useState<AzimuthalData[]>([]);
    const [maxQValue, setMaxQValue] = useState<number>(2);
    const [globalQRange, setGlobalQRange] = useState<[number, number] | null>(null);
    const [globalAzimuthRange, setGlobalAzimuthRange] = useState<[number, number]>([-180, 180]);
    const [cachedMatrixData, setCachedMatrixData] = useState<CachedMatrixData | null>(null);
    const [calibrationParams, setCalibrationParams] = useState<CalibrationParams>({
        sample_detector_distance: 274.83,
        beam_center_x: 317.8,
        beam_center_y: 1245.28,
        pixel_size_x: 172,
        pixel_size_y: 172,
        wavelength: 1.2398,
        tilt: 0,
        tilt_plan_rotation: 0
    });

    // Utility Functions
    const createCacheKey = useCallback((params: CalibrationParams, azimuthRange: [number, number]): string => {
        return JSON.stringify({ calibration: params, azimuth: azimuthRange });
    }, []);

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

    // Helper function to update integration data
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

        setAzimuthalData1(prev => {
            const filtered = prev.filter(d => d.id !== id);
            return [...filtered, {
                id,
                q: q1,
                intensity: intensity1,
                qArray: qArray1
            }];
        });

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

    // Main data fetching function
    const fetchAzimuthalData = useCallback(async (
        id: number,
        qRange: [number, number] | null,
        azimuthRange: [number, number]
    ) => {
        const currentCacheKey = createCacheKey(calibrationParams, azimuthRange);

        try {
            const needsNewData = !cachedMatrixData ||
                               currentCacheKey !== createCacheKey(calibrationParams, cachedMatrixData.azimuthRange);

            if (needsNewData) {
                const url = new URL('http://127.0.0.1:8000/api/azimuthal-integrator');

                Object.entries(calibrationParams).forEach(([key, value]) => {
                    url.searchParams.set(key, value.toString());
                });
                url.searchParams.set('azimuth_range_deg', `${azimuthRange[0]},${azimuthRange[1]}`);

                const response = await fetch(url.toString());
                if (!response.ok) {
                    throw new Error(`Failed to fetch azimuthal integration data: ${await response.text()}`);
                }

                const decodedData = decode(new Uint8Array(await response.arrayBuffer()));

                if (!isAzimuthalIntegratorResponse(decodedData)) {
                    throw new Error('Invalid response format from server');
                }

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

                if (maxQValue === 2) {
                    setMaxQValue(decodedData.q_max);
                    setGlobalQRange([0, decodedData.q_max]);
                }

                updateIntegrationData(id, {
                    q1: decodedData.q_1,
                    q2: decodedData.q_2,
                    intensity1: decodedData.intensity_1,
                    intensity2: decodedData.intensity_2,
                    qArray1: filterByQRange(decodedData.q_array_filtered_1, qRange),
                    qArray2: filterByQRange(decodedData.q_array_filtered_2, qRange)
                });
            } else {
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
    }, [calibrationParams, cachedMatrixData, createCacheKey, filterByQRange, maxQValue, updateIntegrationData]);

    // Debounced update functions
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
        }, 100)
    ).current;


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
        }, 500)
    ).current;

    // Cleanup effect
    useEffect(() => {
        return () => {
            debouncedQRangeUpdate.cancel();
            debouncedAzimuthRangeUpdate.cancel();
        };
    }, [debouncedQRangeUpdate, debouncedAzimuthRangeUpdate]);


    // Integration management functions
    const addAzimuthalIntegration = useCallback(() => {
        const DEFAULT_AZIMUTH_RANGE: [number, number] = [-180, 180];
        const existingIds = azimuthalIntegrations.map(integration => integration.id);
        const newId = Math.max(0, ...existingIds) + 1;

        const newIntegration: AzimuthalIntegration = {
            id: newId,
            qRange: null,
            azimuthRange: DEFAULT_AZIMUTH_RANGE,
            leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
            rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
            hidden: false
        };

        setAzimuthalIntegrations(prev => [...prev, newIntegration]);
        setGlobalAzimuthRange(DEFAULT_AZIMUTH_RANGE);
        fetchAzimuthalData(newId, globalQRange, DEFAULT_AZIMUTH_RANGE);
    }, [fetchAzimuthalData, azimuthalIntegrations, globalQRange]);

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

    const updateAzimuthalColor = useCallback((id: number, side: 'left' | 'right', color: string) => {
        setAzimuthalIntegrations(prev =>
            prev.map(integration =>
                integration.id === id
                    ? { ...integration, [`${side}Color`]: color }
                    : integration
            )
        );
    }, []);


    const deleteAzimuthalIntegration = useCallback((id: number) => {
        // Clear the cached matrix data
        setCachedMatrixData(null);

        // Remove the integration's data
        setAzimuthalData1(prev =>
            prev.filter(data => data.id !== id).map((data, index) => ({
                ...data,
                id: index + 1,
            }))
        );

        setAzimuthalData2(prev =>
            prev.filter(data => data.id !== id).map((data, index) => ({
                ...data,
                id: index + 1,
            }))
        );

        // Update the integrations list
        setAzimuthalIntegrations(prev => {
            const updatedIntegrations = prev.filter(integration => integration.id !== id);
            return updatedIntegrations.map((integration, index) => ({
                ...integration,
                id: index + 1,
            }));
        });
    }, []);


    const toggleAzimuthalVisibility = useCallback((id: number) => {
        setAzimuthalIntegrations(prev =>
            prev.map(integration =>
                integration.id === id ? { ...integration, hidden: !integration.hidden } : integration
            )
        );
    }, []);

    const updateCalibration = useCallback((newParams: CalibrationParams) => {
        setCalibrationParams(newParams);
        // Clear cache when calibration changes
        setCachedMatrixData(null);

        // Refresh all active integrations
        azimuthalIntegrations
            .filter(integration => !integration.hidden)
            .forEach(integration => {
                fetchAzimuthalData(
                    integration.id,
                    integration.qRange,
                    integration.azimuthRange
                );
            });
    }, [azimuthalIntegrations, fetchAzimuthalData]);

    // Return hook interface
    return {
        // State
        azimuthalIntegrations,
        azimuthalData1,
        azimuthalData2,
        maxQValue,
        globalQRange,
        globalAzimuthRange,
        calibrationParams,

        // Functions
        addAzimuthalIntegration,
        updateAzimuthalQRange,
        updateAzimuthalRange,
        updateAzimuthalColor,
        deleteAzimuthalIntegration,
        toggleAzimuthalVisibility,
        updateCalibration,
        fetchAzimuthalData,
    };
}
