// src/types.ts
export interface Linecut {
    id: number; // Unique identifier for the linecut
    position: number; // Current position of the linecut
    leftColor: string; // Color of the left image linecut
    rightColor: string; // Color of the right image linecut
    hidden: boolean; // Optional property to track if the linecut is hidden
    width: number; // Optional property to track the width of the linecut
    angle: number; // For inclined linecuts
    type: 'horizontal' | 'vertical'; // Type of linecut
  }

export interface InclinedLinecut {
    id: number;
    xPosition: number;
    yPosition: number;
    angle: number;
    width: number;
    leftColor: string;
    rightColor: string;
    hidden: boolean;
    type: 'inclined';
  }

export interface ResolutionDataType {
    array1: number[][];
    array2: number[][];
    diff: number[][];
    factor: number | null;
  }

export interface AzimuthalIntegration {
        id: number;
        qRange: [number, number] | null;  // q-range for integration
        azimuthRange: [number, number];  // azimuthal range in degrees
        leftColor: string;
        rightColor: string;
        hidden: boolean;
      }

export interface AzimuthalData {
        id: number;
        q: number[];  // q values
        intensity: number[];  // integrated intensities
        qArray: number[][];  // 2D array of q values for visualization
      }


export interface CalibrationParams {
        sample_detector_distance: number;
        beam_center_x: number;
        beam_center_y: number;
        pixel_size_x: number;
        pixel_size_y: number;
        wavelength: number;
        tilt: number;
        tilt_plan_rotation: number;
    }
