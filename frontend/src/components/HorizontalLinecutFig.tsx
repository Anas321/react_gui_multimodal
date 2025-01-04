import React from 'react';
import Plot from 'react-plotly.js';

interface LinecutSectionProps {
  linecutType: string | null;
  linecutData1: number[]; // Linecut data from the first scatter image
  linecutData2: number[]; // Linecut data from the second scatter image
}


const HorizontalLinecutFig: React.FC<LinecutSectionProps> = ({
  linecutData1,
  linecutData2,
}) => {
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded shadow">
        <>
          {/* Plotly figure for the linecut */}
          <Plot
            data={[
              {
                x: Array.from({ length: linecutData1.length }, (_, i) => i),
                y: linecutData1,
                type: 'scatter',
                mode: 'lines',
                name: 'Left Image',
              },
              {
                x: Array.from({ length: linecutData2.length }, (_, i) => i),
                y: linecutData2,
                type: 'scatter',
                mode: 'lines',
                name: 'Right Image',
              },
            ]}
            layout={{
              xaxis: { title: 'Pixel Index' },
              yaxis: { title: 'Intensity' },
            //   height: 400,
            //   width: 600,
            }}
          />
        </>
    </div>
  );
};

export default HorizontalLinecutFig;
