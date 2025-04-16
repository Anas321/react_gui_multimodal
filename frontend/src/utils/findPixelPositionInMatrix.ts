export function findPixelPositionInMatrix(targetQ, qMatrix, isHorizontal = true) {
    if (!qMatrix || !qMatrix.length || !qMatrix[0] || !qMatrix[0].length) {
      return 0; // Default to 0 if matrix is invalid
    }

    const rows = qMatrix.length;
    const cols = qMatrix[0].length;

    // For horizontal linecuts, we search down the middle column for the closest y-position
    // For vertical linecuts, we search across the middle row for the closest x-position
    if (isHorizontal) {
      // Use the middle column index
      const midCol = Math.floor(cols / 2);

      // Search through the rows (y coordinates)
      let closestRow = 0;
      let minDiff = Infinity;

      for (let row = 0; row < rows; row++) {
        const diff = Math.abs(qMatrix[row][midCol] - targetQ);
        if (diff < minDiff) {
          minDiff = diff;
          closestRow = row;
        }
      }

      return closestRow;
    } else {
      // Use the middle row index
      const midRow = Math.floor(rows / 2);

      // Search through the columns (x coordinates)
      let closestCol = 0;
      let minDiff = Infinity;

      for (let col = 0; col < cols; col++) {
        const diff = Math.abs(qMatrix[midRow][col] - targetQ);
        if (diff < minDiff) {
          minDiff = diff;
          closestCol = col;
        }
      }

      return closestCol;
    }
  }
