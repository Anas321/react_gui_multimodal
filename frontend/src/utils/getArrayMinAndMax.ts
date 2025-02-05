// Helper function to get array min and max
export const getArrayStats = (arr: number[][]) => {
    let min = arr[0][0];
    let max = arr[0][0];
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr[0].length; j++) {
        if (arr[i][j] < min) min = arr[i][j];
        if (arr[i][j] > max) max = arr[i][j];
      }
    }
    return [ min, max ];
  };
