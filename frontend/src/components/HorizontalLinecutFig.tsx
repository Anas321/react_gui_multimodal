

// import React from 'react';
// import Plot from 'react-plotly.js';

// interface LinecutSectionProps {
//   linecutType: string | null;
//   linecutData1: number[]; // Linecut data from the first scatter image
//   linecutData2: number[]; // Linecut data from the second scatter image
//   leftImageColorPalette: string[];
//   rightImageColorPalette: string[];
//   horizontalLinecuts: { id: number; position: number; color: string }[]; // Linecuts with positions and colors
// }

// const HorizontalLinecutFig: React.FC<LinecutSectionProps> = ({
//   linecutData1,
//   linecutData2,
//   leftImageColorPalette,
//   rightImageColorPalette,
//   horizontalLinecuts,
// }) => {
//   return (
//     <div className="mt-4 p-4 bg-gray-100 rounded shadow">
//       <Plot
//         data={[
//           {
//             x: Array.from({ length: linecutData1.length }, (_, i) => i),
//             y: linecutData1,
//             type: 'scatter',
//             mode: 'lines',
//             name: 'Left Image',
//             line: {
//               color: horizontalLinecuts.length
//                 ? leftImageColorPalette[
//                     (horizontalLinecuts[0].id - 1) % leftImageColorPalette.length
//                   ]
//                 : 'black', // Default color if no linecuts are available
//               width: 2,
//             },
//           },
//           {
//             x: Array.from({ length: linecutData2.length }, (_, i) => i),
//             y: linecutData2,
//             type: 'scatter',
//             mode: 'lines',
//             name: 'Right Image',
//             line: {
//               color: horizontalLinecuts.length
//                 ? rightImageColorPalette[
//                     (horizontalLinecuts[1].id - 1) % rightImageColorPalette.length
//                   ]
//                 : 'black', // Default color if no linecuts are available
//               width: 2,
//             },
//           },
//         ]}
//         layout={{
//           xaxis: { title: 'Pixel Index' },
//           yaxis: { title: 'Intensity' },
//         }}
//       />
//     </div>
//   );
// };

// export default HorizontalLinecutFig;

import React from 'react';
import Plot from 'react-plotly.js';

interface LinecutSectionProps {
  linecutType: string | null;
  linecuts: { id: number; position: number; color: string }[];
  linecutData1: { id: number; data: number[] }[]; // Array of data for left scatter image
  linecutData2: { id: number; data: number[] }[]; // Array of data for right scatter image
  leftImageColorPalette: string[];
  rightImageColorPalette: string[];
}

const HorizontalLinecutFig: React.FC<LinecutSectionProps> = ({
  linecuts,
  linecutData1,
  linecutData2,
  leftImageColorPalette,
  rightImageColorPalette,
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded shadow">
      <Plot
        data={[
          ...linecuts.map((linecut, index) => {
            const linecutDataLeft = linecutData1.find((d) => d.id === linecut.id);
            const linecutDataRight = linecutData2.find((d) => d.id === linecut.id);

            return [
              // Left image linecut
              {
                x: Array.from(
                  { length: linecutDataLeft?.data.length || 0 },
                  (_, i) => i
                ),
                y: linecutDataLeft?.data || [],
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: `Left Linecut ${linecut.id}`,
                line: {
                  color: leftImageColorPalette[index % leftImageColorPalette.length],
                  width: 2,
                },
              },
              // Right image linecut
              {
                x: Array.from(
                  { length: linecutDataRight?.data.length || 0 },
                  (_, i) => i
                ),
                y: linecutDataRight?.data || [],
                type: 'scatter' as const,
                mode: 'lines' as const,
                name: `Right Linecut ${linecut.id}`,
                line: {
                  color: rightImageColorPalette[index % rightImageColorPalette.length],
                  width: 2,
                },
              },
            ];
          }).flat(), // Flatten the array to combine left and right linecuts
        ]}
        layout={{
          xaxis: { title: 'Pixel Index' },
          yaxis: { title: 'Intensity' },
          showlegend: true,
        }}
      />
    </div>
  );
};


export default HorizontalLinecutFig;









// import React from 'react';
// import Plot from 'react-plotly.js';

// interface LinecutSectionProps {
//   linecutType: string | null;
//   linecutData1: number[]; // Linecut data from the first scatter image
//   linecutData2: number[]; // Linecut data from the second scatter image
//   leftImageColorPalette: string[];
//   rightImageColorPalette: string[];
// }


// const HorizontalLinecutFig: React.FC<LinecutSectionProps> = ({
//   linecutData1,
//   linecutData2,
//   leftImageColorPalette,
//   rightImageColorPalette,
// }) => {
//   return (
//     <div className="mt-4 p-4 bg-gray-100 rounded shadow">
//         <>
//           {/* Plotly figure for the linecut */}
//           <Plot
//             data={[
//               {
//                 x: Array.from({ length: linecutData1.length }, (_, i) => i),
//                 y: linecutData1,
//                 type: 'scatter',
//                 mode: 'lines',
//                 name: 'Left Image',
//               },
//               {
//                 x: Array.from({ length: linecutData2.length }, (_, i) => i),
//                 y: linecutData2,
//                 type: 'scatter',
//                 mode: 'lines',
//                 name: 'Right Image',
//               },
//             ]}
//             layout={{
//               xaxis: { title: 'Pixel Index' },
//               yaxis: { title: 'Intensity' },
//             //   height: 400,
//             //   width: 600,
//             }}
//           />
//         </>
//     </div>
//   );
// };

// export default HorizontalLinecutFig;
