import { useState, useEffect } from 'react';
import { NumberInput, Button } from '@mantine/core';

interface CalibrationParams {
    sample_detector_distance: number;  // Distance in millimeters
    beam_center_x: number;            // X-coordinate in pixels
    beam_center_y: number;            // Y-coordinate in pixels
    pixel_size_x: number;             // Size in micrometers
    pixel_size_y: number;             // Size in micrometers
    wavelength: number;               // Wavelength in Angstroms
    tilt: number;                     // Detector tilt in degrees
    tilt_plan_rotation: number;       // Tilt plane rotation in degrees
}

interface CalibrationWidgetProps {
    calibrationParams: CalibrationParams;
    onCalibrationUpdate: (params: CalibrationParams) => void;
}

export default function CalibrationWidget({
    calibrationParams,
    onCalibrationUpdate,
}: CalibrationWidgetProps) {

    // Track whether any parameter has been modified
    const [isModified, setIsModified] = useState(false);

    // Create a local copy for tracking changes before submission
    const [localParams, setLocalParams] = useState(calibrationParams);

    // Update local copy when props change
    useEffect(() => {
        setLocalParams(calibrationParams);
        setIsModified(false);  // Reset modified state when new props arrive
    }, [calibrationParams]);

    // Handle parameter updates
    const handleParamChange = (paramName: keyof CalibrationParams, value: number | null) => {
        if (value !== null) {
            setLocalParams(prev => ({
                ...prev,
                [paramName]: value
            }));
            setIsModified(true);
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        const isValid = Object.values(localParams).every(value =>
            typeof value === 'number' && !isNaN(value)
        );

        if (isValid) {
            onCalibrationUpdate(localParams);
            setIsModified(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Sample-Detector Distance */}
            <div>
                <NumberInput
                    label="Sample-Detector Distance (mm)"
                    description="Distance between sample and detector"
                    value={calibrationParams.sample_detector_distance}
                    onChange={(value) => handleParamChange('sample_detector_distance', value as number)}
                    decimalScale={2}
                    step={0.1}
                    min={0}
                    className="w-full"
                />
            </div>

            {/* Beam Center Coordinates */}
            <div className="space-y-2">
                <NumberInput
                    label="Beam Center X (pixels)"
                    description="X-coordinate of beam center"
                    value={calibrationParams.beam_center_x}
                    onChange={(value) => handleParamChange('beam_center_x', value as number)}
                    decimalScale={2}
                    step={0.1}
                />
                <NumberInput
                    label="Beam Center Y (pixels)"
                    description="Y-coordinate of beam center"
                    value={calibrationParams.beam_center_y}
                    onChange={(value) => handleParamChange('beam_center_y', value as number)}
                    decimalScale={2}
                    step={0.1}
                />
            </div>

            {/* Pixel Size */}
            <div className="space-y-2">
                <NumberInput
                    label="Pixel Size X (μm)"
                    description="Pixel size in X direction"
                    value={calibrationParams.pixel_size_x}
                    onChange={(value) => handleParamChange('pixel_size_x', value as number)}
                    decimalScale={2}
                    step={1}
                    min={0}
                />
                <NumberInput
                    label="Pixel Size Y (μm)"
                    description="Pixel size in Y direction"
                    value={calibrationParams.pixel_size_y}
                    onChange={(value) => handleParamChange('pixel_size_y', value as number)}
                    decimalScale={2}
                    step={1}
                    min={0}
                />
            </div>

            {/* Wavelength */}
            <div>
                <NumberInput
                    label="Wavelength (Å)"
                    description="X-ray wavelength"
                    value={calibrationParams.wavelength}
                    onChange={(value) => handleParamChange('wavelength', value as number)}
                    decimalScale={2}
                    step={0.0001}
                    min={0}
                />
            </div>

            {/* Detector Tilt */}
            <div className="space-y-2">
                <NumberInput
                    label="Detector Tilt (degrees)"
                    description="Tilt angle of detector"
                    value={calibrationParams.tilt}
                    onChange={(value) => handleParamChange('tilt', value as number)}
                    decimalScale={2}
                    step={0.1}
                />
                <NumberInput
                    label="Tilt Plane Rotation (degrees)"
                    description="Rotation of tilt plane"
                    value={calibrationParams.tilt_plan_rotation}
                    onChange={(value) => handleParamChange('tilt_plan_rotation', value as number)}
                    decimalScale={2}
                    step={0.1}
                />
            </div>

            {/* Update Button */}
            <Button
                className="w-full mt-4"
                color={isModified ? "blue" : "gray"}
                onClick={handleSubmit}
                disabled={!isModified}
            >
                Update Calibration
            </Button>
        </div>

    );
}
