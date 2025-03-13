// hooks/useScatterSpectrum.ts
import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';

export default function useScatterSpectrum() {
    // State for the left image index with initial value of 0
    const [leftImageIndex, setLeftImageIndex] = useState<number | "">(0);

    // State for the right image index with initial value of 1
    const [rightImageIndex, setRightImageIndex] = useState<number | "">(1);

    // State for tracking loading status
    const [isLoading, setIsLoading] = useState(false);

    // State for storing the total number of files
    const [numOfFiles, setNumOfFiles] = useState<number | null>(null);

    // Handler for image indices change - now actually sets the indices
    const handleImageIndicesChange = useCallback((left: number, right: number) => {
        // Store the new indices
        setLeftImageIndex(left);
        setRightImageIndex(right);
        // Set loading state
        setIsLoading(true);
    }, []);

    // Handler for when images are loaded
    const handleImagesLoaded = useCallback(() => {
        setIsLoading(false);

        // Update notifications
        notifications.update({
            id: 'loading-images',
            color: 'green',
            title: 'Images Loaded',
            message: `Successfully loaded images ${leftImageIndex} and ${rightImageIndex}`,
            autoClose: 3000,
        });
    }, [leftImageIndex, rightImageIndex]);

    return {
        // State
        leftImageIndex,
        setLeftImageIndex,
        rightImageIndex,
        setRightImageIndex,
        isLoading,
        numOfFiles,
        setNumOfFiles,

        // Handlers
        handleImageIndicesChange,
        handleImagesLoaded
    };
}
