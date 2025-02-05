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

  export interface ScatterSubplotProps {
    setImageHeight: (height: number) => void;
    setImageWidth: (width: number) => void;
    setImageData1: (data: number[][]) => void;
    setImageData2: (data: number[][]) => void;
    horizontalLinecuts: Linecut[];
    verticalLinecuts: Linecut[];
    inclinedLinecuts: InclinedLinecut[];
    leftImageColorPalette: string[];
    rightImageColorPalette: string[];
    setZoomedXPixelRange: (range: [number, number] | null) => void;
    setZoomedYPixelRange: (range: [number, number] | null) => void;
    isThirdCollapsed: boolean;
    setResolutionMessage: (message: string) => void;
    isLogScale: boolean;
    lowerPercentile: number;
    upperPercentile: number;
    computeInclinedLinecutData: (
      imageData: number[][],
      xPos: number,
      yPos: number,
      angle: number,
      width: number
    ) => number[];
    setInclinedLinecutData1: (data: { id: number; data: number[] }[]) => void;
    setInclinedLinecutData2: (data: { id: number; data: number[] }[]) => void;
  }
