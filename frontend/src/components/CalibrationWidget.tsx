import { useState, useEffect } from 'react';
import { NumberInput, Button, NumberInputProps } from '@mantine/core';

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

// Define props for our custom input component
interface LargeNumberInputProps extends Omit<NumberInputProps, 'label'> {
    label: string;
    description?: string;
}

// Custom wrapper component for NumberInput with large labels
const LargeNumberInput: React.FC<LargeNumberInputProps> = ({
    label,
    description,
    ...numberInputProps
}) => {
    return (
        <div className="space-y-1">
            <label className="block text-xl font-medium text-gray-700">{label}</label>
            {description && (
                <p className="text-sm text-gray-500">{description}</p>
            )}
            <NumberInput {...numberInputProps}
              size='md'
            />
        </div>
    );
};

export default function CalibrationWidget({
    calibrationParams,
    onCalibrationUpdate,
}: CalibrationWidgetProps) {
    const [isModified, setIsModified] = useState(false);
    const [localParams, setLocalParams] = useState(calibrationParams);

    useEffect(() => {
        setLocalParams(calibrationParams);
        setIsModified(false);
    }, [calibrationParams]);

    // Handler that accepts Mantine's value type (string | number)
    const handleParamChange = (paramName: keyof CalibrationParams) => (value: string | number) => {
        // Convert string to number if needed and validate
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;

        if (!isNaN(numericValue)) {
            setLocalParams(prev => ({
                ...prev,
                [paramName]: numericValue
            }));
            setIsModified(true);
        }
    };

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
            <LargeNumberInput
                label="Sample-Detector Distance (mm)"
                description="Distance between sample and detector"
                value={localParams.sample_detector_distance}
                onChange={handleParamChange('sample_detector_distance')}
                decimalScale={2}
                step={0.1}
                min={0}
                className="w-full"
            />

            {/* Beam Center Coordinates */}
            <div className="space-y-2">
                <LargeNumberInput
                    label="Beam Center X (pixels)"
                    description="X-coordinate of beam center"
                    value={localParams.beam_center_x}
                    onChange={handleParamChange('beam_center_x')}
                    decimalScale={2}
                    step={0.1}
                />
                <LargeNumberInput
                    label="Beam Center Y (pixels)"
                    description="Y-coordinate of beam center"
                    value={localParams.beam_center_y}
                    onChange={handleParamChange('beam_center_y')}
                    decimalScale={2}
                    step={0.1}
                />
            </div>

            {/* Pixel Size */}
            <div className="space-y-2">
                <LargeNumberInput
                    label="Pixel Size X (μm)"
                    description="Pixel size in X direction"
                    value={localParams.pixel_size_x}
                    onChange={handleParamChange('pixel_size_x')}
                    decimalScale={2}
                    step={1}
                    min={0}
                />
                <LargeNumberInput
                    label="Pixel Size Y (μm)"
                    description="Pixel size in Y direction"
                    value={localParams.pixel_size_y}
                    onChange={handleParamChange('pixel_size_y')}
                    decimalScale={2}
                    step={1}
                    min={0}
                />
            </div>

            {/* Wavelength */}
            <LargeNumberInput
                label="Wavelength (Å)"
                description="X-ray wavelength"
                value={localParams.wavelength}
                onChange={handleParamChange('wavelength')}
                decimalScale={2}
                step={0.0001}
                min={0}
            />

            {/* Detector Tilt */}
            <div className="space-y-2">
                <LargeNumberInput
                    label="Detector Tilt (degrees)"
                    description="Tilt angle of detector"
                    value={localParams.tilt}
                    onChange={handleParamChange('tilt')}
                    decimalScale={2}
                    step={0.1}
                />
                <LargeNumberInput
                    label="Tilt Plane Rotation (degrees)"
                    description="Rotation of tilt plane"
                    value={localParams.tilt_plan_rotation}
                    onChange={handleParamChange('tilt_plan_rotation')}
                    decimalScale={2}
                    step={0.1}
                />
            </div>

            {/* Update Button */}
            <Button
                className="w-full mt-4 text-xl"
                color={isModified ? "blue" : "gray"}
                onClick={handleSubmit}
                disabled={!isModified}
            >
                Update Calibration
            </Button>
        </div>
    );
}
