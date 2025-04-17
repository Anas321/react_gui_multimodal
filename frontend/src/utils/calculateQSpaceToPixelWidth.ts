import { findPixelPositionForQValue } from "./findPixelPositionForQValue";

/**
 * Calculates width in pixel space from a q-space position and width
 * @param qPosition - Position in q-space
 * @param qWidth - Width in q-space units
 * @param qVector - Vector mapping q-values to pixel positions
 * @returns Width in pixel units
 */
export const calculateQSpaceToPixelWidth = (
  qPosition: number,
  qWidth: number,
  qVector: number[]
): number => {
  // If width is zero or qVector is empty, return 0
  if (qWidth <= 0 || !qVector || qVector.length === 0) return 0;

  // Find pixel positions for both edges of the width band
  const upperQValue = qPosition + qWidth / 2;
  const lowerQValue = qPosition - qWidth / 2;
  const upperPixel = findPixelPositionForQValue(upperQValue, qVector);
  const lowerPixel = findPixelPositionForQValue(lowerQValue, qVector);

  return Math.abs(upperPixel - lowerPixel);
};
