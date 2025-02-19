import { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { decode } from "@msgpack/msgpack";
import { AzimuthalData, AzimuthalIntegration } from '../types';
import { leftImageColorPalette, rightImageColorPalette } from '../utils/constants';

// Define the shape of data we expect from the backend API
// This helps TypeScript verify we're handling the data correctly
interface AzimuthalIntegratorResponse {
    q_max: number;             // Maximum Q value from the data
    q_1: number[];            // Q values for first dataset
    q_2: number[];            // Q values for second dataset
    intensity_1: number[];     // Intensity values for first dataset
    intensity_2: number[];     // Intensity values for second dataset
    q_array_filtered_1: number[][];  // 2D array of Q values for first dataset
    q_array_filtered_2: number[][];  // 2D array of Q values for second dataset
}

interface CalibrationParams {
    sample_detector_distance: number;  // Distance in millimeters
    beam_center_x: number;            // X-coordinate in pixels
    beam_center_y: number;            // Y-coordinate in pixels
    pixel_size_x: number;             // Size in micrometers
    pixel_size_y: number;             // Size in micrometers
    wavelength: number;               // Wavelength in Angstroms
    tilt: number;                     // Tilt angle in degrees
    tilt_plan_rotation: number;       // Tilt plane rotation in degrees
}

// Type guard function to verify the response matches our expected format
// This is a TypeScript feature that helps ensure runtime type safety
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
    // State Management Section
    // Each state variable manages a different aspect of the azimuthal integration
    const [azimuthalIntegrations, setAzimuthalIntegrations] = useState<AzimuthalIntegration[]>([]);  // List of all integrations
    const [azimuthalData1, setAzimuthalData1] = useState<AzimuthalData[]>([]);  // Data for first dataset
    const [azimuthalData2, setAzimuthalData2] = useState<AzimuthalData[]>([]);  // Data for second dataset
    const [maxQValue, setMaxQValue] = useState<number>(2);  // Maximum Q value, starts at 2 and updates from backend
    const [globalQRange, setGlobalQRange] = useState<[number, number] | null>(null);  // Current Q range selection
    const [globalAzimuthRange, setGlobalAzimuthRange] = useState<[number, number]>([-180, 180]);  // Current azimuth range

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

    // Define default ranges as constants
    const DEFAULT_Q_RANGE: [number, number] | null = null;


    // Main data fetching function
    // This function communicates with the backend to get integration data
    const fetchAzimuthalData = useCallback(async (
        id: number,
        qRange: [number, number] | null,
        azimuthRange: [number, number]
    ) => {
        try {
            // Construct URL with query parameters
            const url = new URL('http://127.0.0.1:8000/api/azimuthal-integrator');

            // Add calibration parameters
            url.searchParams.set('sample_detector_distance', calibrationParams.sample_detector_distance.toString());
            url.searchParams.set('beam_center_x', calibrationParams.beam_center_x.toString());
            url.searchParams.set('beam_center_y', calibrationParams.beam_center_y.toString());
            url.searchParams.set('pixel_size_x', calibrationParams.pixel_size_x.toString());
            url.searchParams.set('pixel_size_y', calibrationParams.pixel_size_y.toString());
            url.searchParams.set('wavelength', calibrationParams.wavelength.toString());
            url.searchParams.set('tilt', calibrationParams.tilt.toString());
            url.searchParams.set('tilt_plan_rotation', calibrationParams.tilt_plan_rotation.toString());



            if (qRange !== null) {
                url.searchParams.set('q_range', `${qRange[0]},${qRange[1]}`);
            }
            url.searchParams.set('azimuth_range_deg', `${azimuthRange[0]},${azimuthRange[1]}`);

            // Fetch and decode data
            const response = await fetch(url.toString());
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch azimuthal integration data: ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const decodedData = decode(new Uint8Array(arrayBuffer));

            // Verify response format
            if (!isAzimuthalIntegratorResponse(decodedData)) {
                throw new Error('Invalid response format from server');
            }

            const result = decodedData;

            // Update maxQValue only on first load
            if (maxQValue === 2) {
                setMaxQValue(result.q_max);
                setGlobalQRange([0, result.q_max]);
            }

            // Update integration data
            // We filter out old data for this ID and add the new data
            setAzimuthalData1(prev => {
                const filtered = prev.filter(data => data.id !== id);
                return [...filtered, {
                    id,
                    q: result.q_1,
                    intensity: result.intensity_1,
                    qArray: result.q_array_filtered_1
                }];
            });

            setAzimuthalData2(prev => {
                const filtered = prev.filter(data => data.id !== id);
                return [...filtered, {
                    id,
                    q: result.q_2,
                    intensity: result.intensity_2,
                    qArray: result.q_array_filtered_2
                }];
            });
        } catch (error) {
            console.error('Error fetching azimuthal integration data:', error);
            throw error;
        }
    }, [calibrationParams, maxQValue]);

    // Debounced function references
    // These are stable references to debounced functions that persist across renders
    // Using useRef ensures we don't create new debounced functions on every render
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
        }, 500)  // Wait 500ms after last call before executing
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
    // This ensures we cancel any pending debounced operations when the component unmounts
    useEffect(() => {
        return () => {
            debouncedQRangeUpdate.cancel();
            debouncedAzimuthRangeUpdate.cancel();
        };
    }, [debouncedQRangeUpdate, debouncedAzimuthRangeUpdate]);

    // Function to add a new integration
    const addAzimuthalIntegration = useCallback(() => {
        const DEFAULT_AZIMUTH_RANGE: [number, number] = [-180, 180];
        const existingIds = azimuthalIntegrations.map(integration => integration.id);
        const newId = Math.max(0, ...existingIds) + 1;

        // Create new integration with default ranges
        const newIntegration: AzimuthalIntegration = {
            id: newId,
            qRange: DEFAULT_Q_RANGE,
            azimuthRange: DEFAULT_AZIMUTH_RANGE,  // Always use default range for new integrations
            leftColor: leftImageColorPalette[(newId - 1) % leftImageColorPalette.length],
            rightColor: rightImageColorPalette[(newId - 1) % rightImageColorPalette.length],
            hidden: false
        };

        setAzimuthalIntegrations(prev => [...prev, newIntegration]);

        // Reset global range to default when adding new integration
        setGlobalAzimuthRange(DEFAULT_AZIMUTH_RANGE);

        // Fetch data with default ranges
        fetchAzimuthalData(newId, globalQRange, DEFAULT_AZIMUTH_RANGE);
    }, [fetchAzimuthalData, azimuthalIntegrations, globalQRange]);

    // Update functions that use the debounced versions
    // These functions are called directly from the UI and trigger the debounced updates
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

    // Helper functions for managing integrations
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
        // Remove integration and reindex remaining ones
        setAzimuthalIntegrations(prev => {
            const updatedIntegrations = prev.filter(integration => integration.id !== id);
            return updatedIntegrations.map((integration, index) => ({
                ...integration,
                id: index + 1,
            }));
        });

        // Remove associated data
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

        // Refresh all active integrations with new parameters
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

    // Return all the necessary states and functions
    return {
        azimuthalIntegrations,
        azimuthalData1,
        azimuthalData2,
        maxQValue,
        addAzimuthalIntegration,
        updateAzimuthalQRange,
        updateAzimuthalRange,
        updateAzimuthalColor,
        deleteAzimuthalIntegration,
        toggleAzimuthalVisibility,
        globalQRange,
        setGlobalQRange,
        globalAzimuthRange,
        setGlobalAzimuthRange,
        fetchAzimuthalData,
        calibrationParams,
        updateCalibration,
    };
}
