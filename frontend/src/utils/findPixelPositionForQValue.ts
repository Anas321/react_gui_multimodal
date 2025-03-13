// Helper function to find pixel position from q-value
export function findPixelPositionForQValue(qValue: number, qVector: number[]): number {
  if (!qVector || qVector.length === 0) {
    return qValue; // Fallback to using the value directly if no mapping is available
  }

  // Find the index of the closest q-value in the qVector
  let closestIndex = 0;
  let smallestDifference = Math.abs(qVector[0] - qValue);

  for (let i = 1; i < qVector.length; i++) {
    const difference = Math.abs(qVector[i] - qValue);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestIndex = i;
    }
  }

  return closestIndex; // Return the corresponding pixel position
}
