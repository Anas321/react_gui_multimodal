import { useState, useEffect} from 'react';
import { MantineProvider, Container, Accordion, Select, Menu, MultiSelect } from '@mantine/core';
// import Plot from 'react-plotly.js';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi'; // Collapsing arrows
import '@mantine/core/styles.css';
import './index.css'; // Import the CSS file
import alsLogo from '/public/als_logo.jpeg';
import ScatterSubplot from './components/ScatterSubplot';
import LinecutSection from './components/LinecutSection';
import HorizontalLinecutFig from './components/HorizontalLinecutFig';

import { handleExperimentTypeChange, addLinecut } from './utils/linecutHandlers';

import { Linecut } from './types';


const leftImageColorPalette = [
  "red",
  "blue",
  "green",
  "orange",
  "purple",
  "teal",
  "pink",
  "brown",
  "gray",
  "cyan",
];

const rightImageColorPalette = [
  "lime",
  "gold",
  "navy",
  "magenta",
  "coral",
  "indigo",
  "olive",
  "maroon",
  "silver",
  "turquoise",
];



function App() {
  const [horizontalLinecuts, setHorizontalLinecuts] = useState<Linecut[]>([]);
  // const [verticalLinecuts, setVerticalLinecuts] = useState<{ position: number; color: string }[]>([]);
  const [isSecondCollapsed, setSecondCollapsed] = useState(false);
  const [isThirdCollapsed, setThirdCollapsed] = useState(false);
  const [experimentType, setExperimentType] = useState('SAXS');
  const [selectedLinecuts, setSelectedLinecuts] = useState<string[]>([]); // Manage multiple linecuts

  const linecutOrder = ['Horizontal', 'Vertical', 'Inclined', 'Azimuthal'];

  const [linecutPosition, setLinecutPosition] = useState(0);
  // const [linecutData1, setLinecutData1] = useState<number[]>([]); // Data from scatter image 1
  // const [linecutData2, setLinecutData2] = useState<number[]>([]); // Data from scatter image 2
  const [linecutData1, setLinecutData1] = useState<{ id: number; data: number[] }[]>([]);
  const [linecutData2, setLinecutData2] = useState<{ id: number; data: number[] }[]>([]);
  const [imageHeight, setImageHeight] = useState<number>(100); // Default value for height
  const [imageWidth, setImageWidth] = useState<number>(100);  // Default value for width
  const [imageData1, setImageData1] = useState<number[][]>([]); // Data for scatter image 1
  const [imageData2, setImageData2] = useState<number[][]>([]); // Data for scatter image 2


  const deleteHorizontalLinecut = (id: number) => {
    setHorizontalLinecuts((prev) => prev.filter((linecut) => linecut.id !== id));
  };


  const toggleHorizontalLinecutVisibility = (id: number) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id ? { ...linecut, hidden: !linecut.hidden } : linecut
      )
    );
  };


  const addHorizontalLinecut = () => {
    // Ensure unique IDs for new linecuts
    const existingIds = horizontalLinecuts.map((linecut) => linecut.id);
    const newId = Math.max(0, ...existingIds) + 1;

    const defaultPosition = Math.floor(imageHeight / 2); // Default position at the center

    const newLinecut = {
      id: newId,
      position: defaultPosition,
      color: leftImageColorPalette[newId % leftImageColorPalette.length], // Assign color dynamically
      hidden: false,
    };

    // Add the new linecut
    setHorizontalLinecuts((prev) => [...prev, newLinecut]);

    // Add to selected linecuts
    setSelectedLinecuts((prev) => [...prev, String(newLinecut.id)]);

    // Compute and set linecut data for both images
    if (imageData1.length > 0 && imageData2.length > 0) {
      const data1 = imageData1[defaultPosition];
      const data2 = imageData2[defaultPosition];

      setLinecutData1((prev) => [...prev, { id: newId, data: data1 }]);
      setLinecutData2((prev) => [...prev, { id: newId, data: data2 }]);
    }
  };


  const updateLinecutPosition = (id: number, position: number) => {
    setHorizontalLinecuts((prev) =>
      prev.map((linecut) =>
        linecut.id === id ? { ...linecut, position } : linecut
      )
    );

    // Update linecut data dynamically
    if (imageData1.length > 0 && imageData2.length > 0) {
      const newLinecutData1 = imageData1[position];
      const newLinecutData2 = imageData2[position];

      setLinecutData1((prev) =>
        prev.map((data) => (data.id === id ? { ...data, data: newLinecutData1 } : data))
      );
      setLinecutData2((prev) =>
        prev.map((data) => (data.id === id ? { ...data, data: newLinecutData2 } : data))
      );
    }
  };



  const computeLinecutData = (position: number) => {
    if (imageData1.length > 0 && imageData2.length > 0) {
      // Extract horizontal linecut data based on the position
      const data1 = imageData1[position]; // Row from scatter image 1
      const data2 = imageData2[position]; // Row from scatter image 2

      // Wrap the data in the expected structure
      const newLinecutData1 = { id: position, data: data1 };
      const newLinecutData2 = { id: position, data: data2 };

      setLinecutData1((prev) => [...prev, newLinecutData1]); // Add to the existing state
      setLinecutData2((prev) => [...prev, newLinecutData2]); // Add to the existing state
    }
  };


  useEffect(() => {
    computeLinecutData(linecutPosition);
  }, [linecutPosition, imageData1, imageData2]);


  return (
    <MantineProvider>
      {/* Title Bar */}
      <div className="flex items-center justify-center p-5 w-full h-[70px] shadow-md relative">
        {/* Icon */}
        <img
          src={alsLogo}
          alt="ALS Icon"
          className="h-10 mr-4"
        />
        {/* Title */}
        <h1 className="m-0 text-[2.5rem] font-bold text-gray-800">
          Multimodal Analysis
        </h1>
        {/* Left collapsing arrow */}
        <div
              className="absolute top-[50px] -left-0 flex items-center justify-center bg-gray-200 rounded-full w-10 h-10 cursor-pointer shadow-md z-[1000]"
              onClick={() => {
                setSecondCollapsed(!isSecondCollapsed);
                // if (!isSecondCollapsed) setThirdCollapsed(false); // Expand third column
              }}
            >
              {isSecondCollapsed ? <FiArrowRight size={20} /> : <FiArrowLeft size={20} />}
        </div>
        {/* Right collapsing arrow */}
        <div
              className="absolute top-[50px] -right-0 flex items-center justify-center bg-gray-200 rounded-full w-10 h-10 cursor-pointer shadow-md z-[1000]"
              onClick={() => {
                setThirdCollapsed(!isThirdCollapsed);
              }}
            >
              {isThirdCollapsed ? <FiArrowLeft size={20} /> : <FiArrowRight size={20} />}
        </div>
      </div>

      {/* Main Layout */}
      <Container
        fluid
        style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          padding: 0,
        }}
      >
      {/* <div className="flex flex-row h-[150vh] w-[100vw] p-0"> */}
        {/* First Column */}
        {!isSecondCollapsed && (
          <div className={`border border-gray-300 shadow-lg h-full bg-gray-100 relative transition-all duration-300 flex-shrink-0
            ${isSecondCollapsed ? 'w-0' : 'w-[14%]'}`}
          >
            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Scatter Controls</h1>
            <hr className="w-full border border-gray-300" />
            {/* Dropdown for Experiment Type */}
            <Select
              label="Select Experiment Type"
              value={experimentType}
              onChange={(value) => handleExperimentTypeChange(value, setExperimentType, setSelectedLinecuts)}
              data={[
                { value: 'SAXS', label: 'SAXS' },
                { value: 'GISAXS', label: 'GISAXS' },
              ]}
              className="mt-6 mx-auto w-[90%]" // Center it horizontally
              classNames={{
                label: 'text-xl font-bold mb-2 pl-1', // Tailwind for the label
                input: 'text-lg py-3 px-4', // Tailwind for input size and padding
                dropdown: 'p-2', // Tailwind for dropdown padding
                option: 'text-lg py-2 px-4 hover:bg-gray-100 cursor-pointer rounded', // Tailwind for dropdown items
              }}
              // styles={{
              //   label: {
              //     fontSize: '1.5rem', // Adjust label font size
              //     paddingBottom: '0.5rem', // Adjust padding for label
              //     paddingLeft: '0.1rem', // Adjust padding for label
              //   },
              //   input: {
              //     fontSize: '1.25rem', // Adjust input font size
              //     padding: '12px', // Adjust padding for larger clickable area
              //   },
              //   option: {
              //     fontSize: '1.25rem', // Adjust dropdown font size
              //   },
              // }}
            />
            {/* Horizontal Line Cut Accordion */}
            <Accordion
              multiple
              defaultValue={['horizontal-linecut-accordion']} // Expanded by default
              chevronPosition="right"
              classNames={{ chevron: 'text-[1.5rem] font-bold', label: 'text-[2rem] font-bold' }}
              className="mt-6"
            >
            <Accordion.Item value="linecuts-accordion">
              <Accordion.Control
                classNames={{label: 'text-3xl font-bold'}}
               >
                Linecuts
              </Accordion.Control>
                <Accordion.Panel>
                  {/* Add Linecut Menu */}
                  <div className="mt-4">
                    <Menu>
                      {/* Menu Button */}
                      <Menu.Target>
                        <button
                          className="w-12/12 px-12 py-3 bg-blue-500 text-white text-[1.75rem] font-semibold rounded-lg shadow hover:bg-blue-600 transition mx-auto block"
                          type="button"
                        >
                          Add Linecut
                        </button>
                      </Menu.Target>

                      {/* Dropdown Items */}
                      <Menu.Dropdown>
                        <Menu.Item
                        onClick={() => {
                          addLinecut('Horizontal', selectedLinecuts, setSelectedLinecuts);
                          addHorizontalLinecut();
                        }}
                        >
                          <span className="text-2xl font-medium">Horizontal Linecut</span>
                        </Menu.Item>
                        <Menu.Item onClick={() => addLinecut('Vertical', selectedLinecuts, setSelectedLinecuts)}>
                          <span className="text-2xl font-medium">Vertical Linecut</span>
                        </Menu.Item>
                        {/* Conditionally render Azimuthal Integration in the menu*/}
                        <Menu.Item onClick={() => addLinecut('Inclined', selectedLinecuts, setSelectedLinecuts)}>
                          <span className="text-2xl font-medium">Inclined Linecut</span>
                        </Menu.Item>
                        {/* Conditionally render Azimuthal Integration */}
                        {experimentType === 'SAXS' && (
                          <Menu.Item onClick={() => addLinecut('Azimuthal', selectedLinecuts, setSelectedLinecuts)}>
                            <span className="text-2xl font-medium">Azimuthal Integration</span>
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                    {/* Render all selected LinecutSections */}
                    {linecutOrder.filter((linecut) => selectedLinecuts.includes(linecut)).map((linecutType) => (
                      <LinecutSection
                        linecutType={linecutType}
                        imageHeight={imageHeight}
                        linecuts={horizontalLinecuts}
                        updateLinecutPosition={updateLinecutPosition}
                        deleteHorizontalLinecut={deleteHorizontalLinecut}
                        toggleHorizontalLinecutVisibility={toggleHorizontalLinecutVisibility}
                        leftImageColorPalette={leftImageColorPalette}
                        rightImageColorPalette={rightImageColorPalette}
                       />
                    ))}
                    {/* {selectedLinecuts.map((linecutType) => (
                    <LinecutSection key={linecutType} linecutType={linecutType} />
                  ))} */}
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>

      )}
        {/* Second Column */}
        <div
          className={`h-full border-r-2 border-gray-300 transition-all duration-300
            ${isSecondCollapsed
            ? 'flex-grow-0 w-0 overflow-hidden'
            : isThirdCollapsed
            ? 'flex-grow w-[86%]'
            : 'flex-grow w-[36%]'
          }`}
        >
          {/* {!isSecondCollapsed && ( */}
            <Accordion
              multiple
              defaultValue={['scatter-images-accordion', 'intensity-spectrum-accordion', 'linecuts-accordion']} // Expanded by default
              chevronPosition="right"
              classNames={{ chevron: 'text-[1.5rem] font-bold', label: 'text-[2rem] font-bold'}}
            >
              <Accordion.Item value="scatter-images-accordion">
                <Accordion.Control>Scatter Images</Accordion.Control>
                <Accordion.Panel>
                <div>
                  <ScatterSubplot
                    setImageHeight={setImageHeight}
                    setImageWidth={setImageWidth}
                    setImageData1={setImageData1}
                    setImageData2={setImageData2}
                    horizontalLinecuts={horizontalLinecuts}
                    leftImageColorPalette={leftImageColorPalette}
                    rightImageColorPalette={rightImageColorPalette}
                  />
                </div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="intensity-spectrum-accordion">
                <Accordion.Control>Scatter Spectrum</Accordion.Control>
                <Accordion.Panel>
                <div>Placeholder for Intensity Spectrum</div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="linecuts-accordion">
                <Accordion.Control>Linecuts</Accordion.Control>
                <Accordion.Panel>
                  <Accordion
                    multiple
                    defaultValue={
                      experimentType === 'SAXS'
                        ? [
                            'horizontal-linecut-accordion',
                            'vertical-linecut-accordion',
                            'inclined-linecut-accordion',
                            'azimuthal-integration-accordion',
                          ]
                        : [
                            'horizontal-linecut-accordion',
                            'vertical-linecut-accordion',
                            'inclined-linecut-accordion',
                          ]
                    }
                    chevronPosition="right"
                    classNames={{ chevron: 'text-[1.5rem] font-bold', label: 'text-[1.5rem] font-bold'}}
                  >
                    {selectedLinecuts.includes('Horizontal') && (
                    <Accordion.Item value="horizontal-linecut-accordion">
                      <Accordion.Control>Horizontal Linecut</Accordion.Control>
                      <Accordion.Panel>
                      <HorizontalLinecutFig
                        linecuts={horizontalLinecuts}
                        linecutData1={linecutData1}
                        linecutData2={linecutData2}
                        leftImageColorPalette={leftImageColorPalette}
                        rightImageColorPalette={rightImageColorPalette}
                      />
                      </Accordion.Panel>
                    </Accordion.Item>
                    )}
                    {selectedLinecuts.includes('Vertical') && (
                    <Accordion.Item value="vertical-linecut-accordion">
                      <Accordion.Control>Vertical Linecut</Accordion.Control>
                      <Accordion.Panel>Placeholder</Accordion.Panel>
                    </Accordion.Item>
                    )}
                    {selectedLinecuts.includes('Inclined') && (
                    <Accordion.Item value="inclined-linecut-accordion">
                      <Accordion.Control>Inclined Linecut</Accordion.Control>
                      <Accordion.Panel>Placeholder</Accordion.Panel>
                    </Accordion.Item>
                    )}
                    {experimentType === 'SAXS' && selectedLinecuts.includes('Azimuthal') && (
                      <Accordion.Item value="azimuthal-integration-accordion">
                        <Accordion.Control>Azimuthal Integration</Accordion.Control>
                        <Accordion.Panel>
                          Placeholder
                        </Accordion.Panel>
                      </Accordion.Item>
                    )}

                  </Accordion>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
           {/* )} */}
        </div>

        {/* Third Column */}
        <div
          className={`h-full border-r-2 border-gray-300 transition-all duration-300
            ${isThirdCollapsed
            ? 'flex-grow-0 w-0 overflow-hidden'
            : isSecondCollapsed
            ? 'flex-grow w-[86%]'
            : 'flex-grow w-[36%]'
          }`}
        >
          {!isThirdCollapsed && (
            <Accordion
              multiple
              defaultValue={['real-space-images-accordion', 'number-of-particles-accordion', 'xps-spectra-accordion']} // Expanded by default
              chevronPosition="right"
              classNames={{ chevron: 'text-[1.5rem] font-bold', label: 'text-[2rem] font-bold'}}
            >
              <Accordion.Item value="real-space-images-accordion">
                <Accordion.Control>Real Space Images</Accordion.Control>
                <Accordion.Panel>
                  <div>Placeholder for real space images.</div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="number-of-particles-accordion">
                <Accordion.Control>Number of Particles</Accordion.Control>
                <Accordion.Panel>
                  <div>Place holder for number of particles.</div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="xps-spectra-accordion">
                <Accordion.Control>XPS Spectra</Accordion.Control>
                <Accordion.Panel>
                  <div>Placeholder for XPS spectra.</div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )}
        </div>

        {/* Fourth Column */}
        {!isThirdCollapsed && (
          <div className={`border border-gray-300 shadow-lg h-full bg-gray-100 relative transition-all duration-300 flex-shrink-0
            ${isThirdCollapsed ? 'w-0' : 'w-[14%]'}`}
          >
            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">XPS Controls</h1>
            <hr className="w-full border border-gray-300" />
          </div>
    )}
      {/* </div> */}
      </Container>
    </MantineProvider>
  );
}

export default App;
