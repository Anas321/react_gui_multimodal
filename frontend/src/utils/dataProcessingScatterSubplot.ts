import { ExtData } from "@msgpack/msgpack";

export function extractBinary(ext: ExtData | Uint8Array): Uint8Array {
  return ext instanceof Uint8Array ? ext : new Uint8Array(ext.data);
}

export function reconstructFloat32Array(buffer: Uint8Array, shape: [number, number]): number[][] {
  const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  return Array.from({ length: shape[0] }, (_, i) =>
    Array.from(float32Array.slice(i * shape[1], (i + 1) * shape[1]))
  );
}

export function processInitialData(fullArray1: number[][], fullArray2: number[][], fullDiff: number[][]) {
  const lowFactor = fullArray1[0].length > 2000 ? 10 : 4;
  const mediumFactor = fullArray1[0].length > 2000 ? 4 : 2;

  return {
    lowFactor,
    mediumFactor,
    dimensions: {
      height: fullArray1.length,
      width: fullArray1[0].length
    }
  };
}
