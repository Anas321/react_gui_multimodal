// src/types.ts
export interface Linecut {
    id: number; // Unique identifier for the linecut
    position: number; // Current position of the linecut
    color: string; // Color of the linecut
    hidden?: boolean; // Optional property to track if the linecut is hidden
  }
