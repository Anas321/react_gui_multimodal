// src/types.ts
export interface Linecut {
    id: number; // Unique identifier for the linecut
    position: number; // Current position of the linecut
    leftColor: string; // Color of the left image linecut
    rightColor: string; // Color of the right image linecut
    hidden?: boolean; // Optional property to track if the linecut is hidden
    width?: number; // Optional property to track the width of the linecut
  }
