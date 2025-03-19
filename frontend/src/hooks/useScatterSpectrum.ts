import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { decode } from "@msgpack/msgpack";
import { DisplayOption } from '../components/RawDataOverviewAccordion';

interface ScatterSpectrumData {
    max_intensities: number[];
    avg_intensities: number[];
    image_names: string[];
}

export default function useScatterSpectrum() {
    // State for the left image index with initial value of 0
    const [leftImageIndex, setLeftImageIndex] = useState<number | "">(0);

    // State for the right image index with initial value of 1
    const [rightImageIndex, setRightImageIndex] = useState<number | "">(1);

    // State for tracking loading status
    const [isLoading, setIsLoading] = useState(false);

    // Separate state for tracking data fetching vs image selection
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [isLoadingImages, setIsLoadingImages] = useState(false);

    // State for storing the total number of files
    const [numOfFiles, setNumOfFiles] = useState<number | null>(null);

    const [displayOption, setDisplayOption] = useState<DisplayOption>('both');

    // New state for spectrum data
    const [spectrumData, setSpectrumData] = useState<ScatterSpectrumData>({
        max_intensities: [],
        avg_intensities: [],
        image_names: []
    });

    // Function to fetch spectrum data from the backend
    const fetchSpectrumData = useCallback(async () => {
        try {
            setIsFetchingData(true);
            setIsLoading(true);

            notifications.show({
                id: 'loading-spectrum',
                loading: true,
                title: 'Loading Spectrum Data',
                message: 'Please wait while we fetch the spectrum data...',
                autoClose: false,
            });

            const response = await fetch('http://127.0.0.1:8000/api/scatter-spectrum');

            if (!response.ok) {
                throw new Error(`Failed to fetch spectrum data: ${response.statusText}`);
            }

            // Assuming the response is in MessagePack format
            const buffer = await response.arrayBuffer();
            const decoded = decode(new Uint8Array(buffer)) as any;

            // Set number of files
            if (decoded.max_intensities) {
                setNumOfFiles(decoded.max_intensities.length);
            }

            // Update spectrum data
            setSpectrumData({
                max_intensities: decoded.max_intensities || [],
                avg_intensities: decoded.avg_intensities || [],
                image_names: decoded.image_names || []
            });

            notifications.update({
                id: 'loading-spectrum',
                color: 'green',
                title: 'Spectrum Data Loaded',
                message: 'Successfully loaded scatter spectrum data',
                autoClose: 3000,
            });
        } catch (error) {
            let errorMessage = 'Failed to fetch spectrum data';
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            console.error('Error fetching scatter spectrum:', error);

            notifications.update({
                id: 'loading-spectrum',
                color: 'red',
                title: 'Error Loading Spectrum Data',
                message: errorMessage,
                autoClose: 5000,
            });
        } finally {
            setIsFetchingData(false);
            setIsLoading(false);
        }
    }, []);

    // Handler for image indices change
    const handleImageIndicesChange = useCallback((left: number | "", right: number | "") => {
        console.log(`Setting images: left=${left}, right=${right}`);

        // Store the new indices
        setLeftImageIndex(left);
        setRightImageIndex(right);

        // Only show loading notification if both indices are valid numbers
        if (typeof left === 'number' && typeof right === 'number') {
            // Set loading state for images specifically
            setIsLoadingImages(true);
            setIsLoading(true);

            // Only show notification for significant changes (not from context menu clicks)
            notifications.show({
                id: 'loading-images',
                loading: true,
                title: 'Loading Images',
                message: `Loading images ${left} and ${right}...`,
                autoClose: false,
            });
        }
    }, []);

    // Handler for when images are loaded
    const handleImagesLoaded = useCallback(() => {
        console.log('Images loaded successfully');
        setIsLoadingImages(false);
        setIsLoading(false);

        // Only update notification if it was a significant image load operation
        if (isLoadingImages) {
            notifications.update({
                id: 'loading-images',
                color: 'green',
                title: 'Images Loaded',
                message: `Successfully loaded images ${leftImageIndex} and ${rightImageIndex}`,
                autoClose: 3000,
            });
        }
    }, [leftImageIndex, rightImageIndex, isLoadingImages]);

    return {
        // State
        leftImageIndex,
        setLeftImageIndex,
        rightImageIndex,
        setRightImageIndex,
        isLoading,
        isFetchingData,
        isLoadingImages,
        numOfFiles,
        setNumOfFiles,

        // Spectrum data
        maxIntensities: spectrumData.max_intensities,
        avgIntensities: spectrumData.avg_intensities,
        imageNames: spectrumData.image_names,

        // Handlers
        fetchSpectrumData,
        handleImageIndicesChange,
        handleImagesLoaded,

        displayOption,
        setDisplayOption,
    };
}
