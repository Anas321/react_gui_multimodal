// Extend the Plotly.Layout type to include coloraxis properties
interface CustomLayout extends Partial<Plotly.Layout> {
    coloraxis?: {
      colorscale: string;
      cmin: number;
      cmax: number;
      colorbar: {
        len: number;
        thickness: number;
        x: number;
        y?: number;
        xanchor: string;
        tickfont: {
            size: number;
            color: string;
            };
      };
    };
    coloraxis2?: {
      colorscale: string;
      cmin: number;
      cmax: number;
      colorbar: {
        len: number;
        thickness: number;
        x: number;
        y?: number;
        xanchor: string;
        tickfont: {
            size: number;
            color: string;
      };
    };
  };
}

interface ScatterSubplotInput {
    fullResArray1: number[][];
    fullResArray2: number[][];
    zmin: number;
    zmax: number;
  }

  interface ScatterSubplotOutput {
    data: Partial<Plotly.PlotData>[];
    layout: Partial<Plotly.Layout>;
  }

  interface CustomPlotData extends Partial<Plotly.PlotData> {
    coloraxis?: string;
  }

  export function createScatterSubplot(input: ScatterSubplotInput): ScatterSubplotOutput {
    const { fullResArray1, fullResArray2, zmin, zmax } = input;

    // Calculate the plain difference between the two arrays
    const fullResDiff = fullResArray1.map((row, i) =>
        row.map((value, j) => value - fullResArray2[i][j])
    );

    const data: CustomPlotData[] = [
      {
        z: fullResArray1,
        type: "heatmap",
        coloraxis: "coloraxis",
        xaxis: "x1",
        yaxis: "y",
      },
      {
        z: fullResArray2,
        type: "heatmap",
        coloraxis: "coloraxis",
        xaxis: "x2",
        yaxis: "y",
      },
      {
        z: fullResDiff,
        type: "heatmap",
        coloraxis: "coloraxis2",
        xaxis: "x3",
        yaxis: "y",
      },
    ];

    const layout: CustomLayout = {
      grid: { rows: 1, columns: 3, pattern: "independent", xgap: 0.05 },
      coloraxis: {
        colorscale: "Viridis",
        cmin: zmin,
        cmax: zmax,
        colorbar: {
          len: 1.0,
          thickness: 30,
          x: 0.6, // Position to the right of the second image
          xanchor: "left",
          tickfont: {
            size: 18, // Adjust the font size for better readability
            color: "black", // Optional: Set the font color
          },
        },
      },
      coloraxis2: {
        colorscale: "RdBu",
        cmin: -Math.max(Math.abs(zmin), Math.abs(zmax)),
        cmax: Math.max(Math.abs(zmin), Math.abs(zmax)),
        colorbar: {
          len: 1.0,
          thickness: 30,
          x: 0.95, // Position to the right of the third image
          xanchor: "left",
          tickfont: {
            size: 18, // Adjust the font size for better readability
            color: "black", // Optional: Set the font color
          },
        },
    },
      // Define the x and y axes for each subplot
      xaxis: { domain: [0, 0.3], showgrid: false, zeroline: false, ticks: "", showticklabels: false, matches: "x" },
      xaxis2: { domain: [0.35, 0.65], showgrid: false, zeroline: false, ticks: "", showticklabels: false, matches: "x" },
      xaxis3: { domain: [0.7, 1.0], showgrid: false, zeroline: false, ticks: "", showticklabels: false, matches: "x" },
      yaxis: { autorange: "reversed", ticks: "", showticklabels: false, showgrid: false, zeroline: false, scaleanchor: "x" },
      yaxis2: { autorange: "reversed", ticks: "", showticklabels: false, showgrid: false, zeroline: false, scaleanchor: "x" },
      yaxis3: { autorange: "reversed", ticks: "", showticklabels: false, showgrid: false, zeroline: false, scaleanchor: "x" },
      margin: { l: 20, r: 60, t: 20, b: 20 },
      plot_bgcolor: "rgba(0,0,0,0)",
      paper_bgcolor: "rgba(0,0,0,0)",
    };

    return { data, layout };
  }
