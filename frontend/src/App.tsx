import { useState } from 'react';
import { MantineProvider, Container, Accordion, Select, Menu } from '@mantine/core';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi'; // Collapsing arrows
import '@mantine/core/styles.css';
import './index.css'; // Import the CSS file
import alsLogo from '/public/als_logo.jpeg';
import ScatterSubplot from './components/ScatterSubplot';
import HorizontalLinecutWidget from './components/HorizontalLinecutWidget';
import HorizontalLinecutFig from './components/HorizontalLinecutFig';
import { handleExperimentTypeChange, addLinecut } from './utils/linecutHandlers';
import { leftImageColorPalette, rightImageColorPalette } from './utils/constants';
import useMultimodal from './hooks/useMultimodal';
import VerticalLinecutWidget from './components/VerticalLinecutWidget';
import VerticalLinecutFig from './components/VerticalLinecutFig';
import { Info } from 'lucide-react';
import { Popover } from '@mantine/core';
import InclinedLinecutWidget from './components/InclinedLinecutWidget';
import InclinedLinecutFig from './components/InclinedLinecutFig';



function App() {
  const [isSecondCollapsed, setSecondCollapsed] = useState(false);
  const [isThirdCollapsed, setThirdCollapsed] = useState(false);
  const linecutOrder = ['Horizontal', 'Vertical', 'Inclined', 'Azimuthal'];

  const {
    horizontalLinecuts,
    setHorizontalLinecuts,
    experimentType,
    setExperimentType,
    selectedLinecuts,
    setSelectedLinecuts,
    horizontalLinecutData1,
    setHorizontalLinecutData1,
    horizontalLinecutData2,
    setHorizontalLinecutData2,
    imageHeight,
    setImageHeight,
    imageWidth,
    setImageWidth,
    imageData1,
    setImageData1,
    imageData2,
    setImageData2,
    updateHorizontalLinecutColor,
    deleteHorizontalLinecut,
    toggleHorizontalLinecutVisibility,
    addHorizontalLinecut,
    updateHorizontalLinecutPosition,
    updateHorizontalLinecutWidth,
    zoomedXPixelRange,
    setZoomedXPixelRange,
    // verticalLinecuts
    verticalLinecuts,
    verticalLinecutData1,
    verticalLinecutData2,
    addVerticalLinecut,
    updateVerticalLinecutPosition,
    updateVerticalLinecutWidth,
    updateVerticalLinecutColor,
    deleteVerticalLinecut,
    toggleVerticalLinecutVisibility,
    zoomedYPixelRange,
    setZoomedYPixelRange,
    // For the zoom resolution message
    resolutionMessage,
    setResolutionMessage,
    // Inclined linecut
    inclinedLinecuts,
    inclinedLinecutData1,
    inclinedLinecutData2,
    addInclinedLinecut,
    updateInclinedLinecutPosition,
    updateInclinedLinecutAngle,
    updateInclinedLinecutWidth,
    updateInclinedLinecutColor,
    deleteInclinedLinecut,
    toggleInclinedLinecutVisibility,
  } = useMultimodal();


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
            ${isSecondCollapsed ? 'w-0' : 'w-[15%]'}`}
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
                  <div className="mt-4 px-2">
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

                        <Menu.Item
                          onClick={() => {
                            addLinecut('Vertical', selectedLinecuts, setSelectedLinecuts);
                            addVerticalLinecut();
                          }}
                        >
                          <span className="text-2xl font-medium">Vertical Linecut</span>
                        </Menu.Item>

                        {/* <Menu.Item onClick={() => addLinecut('Vertical', selectedLinecuts, setSelectedLinecuts)}>
                          <span className="text-2xl font-medium">Vertical Linecut</span>
                        </Menu.Item> */}
                        {/* Conditionally render Azimuthal Integration in the menu*/}
                        <Menu.Item
                        onClick={() => {
                          addLinecut('Inclined', selectedLinecuts, setSelectedLinecuts)
                          addInclinedLinecut();
                        }}
                        >
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
                    <div className="w-full"> {/* Add container with full width */}
                    {linecutOrder.filter((linecut) => selectedLinecuts.includes(linecut)).map((linecutType) => {
                    if (linecutType === 'Horizontal' && horizontalLinecuts.length > 0) {
                      return (
                        <HorizontalLinecutWidget
                          key={`linecut-section-${linecutType}`}
                          linecutType={linecutType}
                          imageHeight={imageHeight}
                          linecuts={horizontalLinecuts}
                          updateHorizontalLinecutPosition={updateHorizontalLinecutPosition}
                          updateHorizontalLinecutWidth={updateHorizontalLinecutWidth}
                          updateHorizontalLinecutColor={updateHorizontalLinecutColor}
                          deleteHorizontalLinecut={deleteHorizontalLinecut}
                          toggleHorizontalLinecutVisibility={toggleHorizontalLinecutVisibility}
                        />
                      );
                    }

                    if (linecutType === 'Vertical' && verticalLinecuts.length > 0) {
                      return (
                        <VerticalLinecutWidget
                          key={`linecut-section-${linecutType}`}
                          linecutType={linecutType}
                          imageWidth={imageWidth}
                          linecuts={verticalLinecuts}
                          updateVerticalLinecutPosition={updateVerticalLinecutPosition}
                          updateVerticalLinecutWidth={updateVerticalLinecutWidth}
                          updateVerticalLinecutColor={updateVerticalLinecutColor}
                          deleteVerticalLinecut={deleteVerticalLinecut}
                          toggleVerticalLinecutVisibility={toggleVerticalLinecutVisibility}
                        />
                      );
                    }

                    if (linecutType === 'Inclined' && inclinedLinecuts.length > 0) {
                      return (
                        <InclinedLinecutWidget
                          key={`linecut-section-${linecutType}`}
                          linecutType={linecutType}
                          imageWidth={imageWidth}
                          imageHeight={imageHeight}
                          linecuts={inclinedLinecuts}
                          updateInclinedLinecutPosition={updateInclinedLinecutPosition}
                          updateInclinedLinecutAngle={updateInclinedLinecutAngle}
                          updateInclinedLinecutWidth={updateInclinedLinecutWidth}
                          updateInclinedLinecutColor={updateInclinedLinecutColor}
                          deleteInclinedLinecut={deleteInclinedLinecut}
                          toggleInclinedLinecutVisibility={toggleInclinedLinecutVisibility}
                        />
                      );
                    }

                    return null;
                  })}
                  </div>
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
            ? 'flex-grow w-[85%]'
            : 'flex-grow w-[35%]'
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
                <Accordion.Control>
                  Scatter Images
                </Accordion.Control>
                <Accordion.Panel>
                <div className="h-full">
                  <ScatterSubplot
                    setImageHeight={setImageHeight}
                    setImageWidth={setImageWidth}
                    setImageData1={setImageData1}
                    setImageData2={setImageData2}
                    horizontalLinecuts={horizontalLinecuts}
                    verticalLinecuts={verticalLinecuts}
                    leftImageColorPalette={leftImageColorPalette}
                    rightImageColorPalette={rightImageColorPalette}
                    setZoomedXPixelRange={setZoomedXPixelRange}
                    setZoomedYPixelRange={setZoomedYPixelRange}
                    isThirdCollapsed={isThirdCollapsed}
                    setResolutionMessage={setResolutionMessage}
                  />

                  {resolutionMessage && (
                    <div className="flex items-center text-xl text-gray-500 text-left mt-4 mb-1 whitespace-nowrap overflow-x-auto">
                      <span>{resolutionMessage}</span>
                      <Popover width={900} position="top"> {/* Increased width to 600px */}
                        <Popover.Target>
                          <div className="cursor-pointer">
                            <Info className="ml-2 w-5 h-5" />
                          </div>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <div className="text-xl space-y-4 whitespace-normal"> {/* Added whitespace-normal to allow natural text wrapping */}
                            <p className="font-medium mb-2">
                              The resolution of the displayed image changes based on the zoom level:
                            </p>
                            <ul className="space-y-3">
                              <li className="flex">
                                <span className="font-medium">• Low Resolution</span>
                                <span className="ml-1">(Downsampling factor = 4): When viewing &gt;50% of the scattering image.</span>
                              </li>
                              <li className="flex">
                                <span className="font-medium">• Medium Resolution</span>
                                <span className="ml-1">(Downsampling factor = 2): When viewing 20-50% of the scattering image.</span>
                              </li>
                              <li className="flex">
                                <span className="font-medium">• Full Resolution</span>
                                <span className="ml-1">(Downsampling factor = 1): When viewing &lt;20% of the scattering image.</span>
                              </li>
                            </ul>
                            <p className="mt-3 text-black-600">
                              <span className="text-red-600">Note:</span> When the image width or height is &gt;2000 pixels, the downsampling factor is doubled.
                            </p>
                          </div>
                        </Popover.Dropdown>
                      </Popover>
                    </div>
                  )}
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
                    {selectedLinecuts.includes('Horizontal') && horizontalLinecuts.length > 0 && (
                    <Accordion.Item value="horizontal-linecut-accordion">
                      <Accordion.Control>Horizontal Linecut</Accordion.Control>
                      <Accordion.Panel>
                        <HorizontalLinecutFig
                          linecuts={horizontalLinecuts} // Pass the entire linecuts array
                          imageData1={imageData1} // Data for left scatter image
                          imageData2={imageData2} // Data for right scatter image
                          zoomedXPixelRange={zoomedXPixelRange}
                          zoomedYPixelRange={zoomedYPixelRange}
                        />
                      </Accordion.Panel>
                    </Accordion.Item>
                    )}
                    {selectedLinecuts.includes('Vertical') && verticalLinecuts.length > 0 && (
                      <Accordion.Item value="vertical-linecut-accordion">
                        <Accordion.Control>Vertical Linecut</Accordion.Control>
                        <Accordion.Panel>
                            <VerticalLinecutFig
                              linecuts={verticalLinecuts}
                              imageData1={imageData1}
                              imageData2={imageData2}
                              zoomedXPixelRange={zoomedXPixelRange}
                              zoomedYPixelRange={zoomedYPixelRange}
                            />
                        </Accordion.Panel>
                      </Accordion.Item>
                    )}
                  {selectedLinecuts.includes('Inclined') && inclinedLinecuts.length > 0 && (
                    <Accordion.Item value="inclined-linecut-accordion">
                      <Accordion.Control>Inclined Linecut</Accordion.Control>
                      <Accordion.Panel>
                      <InclinedLinecutFig
                        linecuts={inclinedLinecuts}
                        imageData1={imageData1}
                        imageData2={imageData2}
                        inclinedLinecutData1={inclinedLinecutData1 || []}  // Provide default empty array
                        inclinedLinecutData2={inclinedLinecutData2 || []}  // Provide default empty array
                        zoomedXPixelRange={zoomedXPixelRange}
                        zoomedYPixelRange={zoomedYPixelRange}
                      />
                      </Accordion.Panel>
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
            ? 'flex-grow w-[85%]'
            : 'flex-grow w-[35%]'
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
            ${isThirdCollapsed ? 'w-0' : 'w-[15%]'}`}
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
