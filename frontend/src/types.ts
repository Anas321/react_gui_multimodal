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
