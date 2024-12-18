import { useState} from 'react';
import { MantineProvider, Container, Accordion, Select } from '@mantine/core';
// import Plot from 'react-plotly.js';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi'; // Collapsing arrows
import '@mantine/core/styles.css';
import './index.css'; // Import the CSS file
import alsLogo from '/public/als_logo.jpeg';
import ScatterSubplot from './components/ScatterSubplot';

// const scatterSubplot = lazy(() => import("./components/ScatterSubplot"));

// // Lazy load the Plot component
// const Plot = lazy(() => import('react-plotly.js'));


function App() {
  const [isSecondCollapsed, setSecondCollapsed] = useState(false);
  const [isThirdCollapsed, setThirdCollapsed] = useState(false);
  const [experimentType, setExperimentType] = useState('SAXS');

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
          flexDirection: 'row',
          height: '150vh',
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
              onChange={(value) => {
                if (value !== null) {
                  setExperimentType(value);
                }
              }}
              data={[
                { value: 'SAXS', label: 'SAXS' },
                { value: 'GISAXS', label: 'GISAXS' },
              ]}
              className="mt-4"
            />
            {/* Horizontal Line Cut Accordion */}
            <Accordion
              multiple
              defaultValue={['horizontal-linecut-accordion']} // Expanded by default
              chevronPosition="right"
              classNames={{ chevron: 'text-[1.5rem] font-bold', label: 'text-[1.5rem] font-bold' }}
              className="mt-6"
            >
              <Accordion.Item value="horizontal-linecut-accordion">
                <Accordion.Control>Horizontal Line Cut</Accordion.Control>
                <Accordion.Panel>
                  <div>
                    Placeholder for Horizontal Line Cut Controls
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
                  <ScatterSubplot/>
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
                    <Accordion.Item value="horizontal-linecut-accordion">
                      <Accordion.Control>Horizontal Linecut</Accordion.Control>
                      <Accordion.Panel>Placeholder</Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="vertical-linecut-accordion">
                      <Accordion.Control>Vertical Linecut</Accordion.Control>
                      <Accordion.Panel>Placeholder</Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="inclined-linecut-accordion">
                      <Accordion.Control>Inclined Linecut</Accordion.Control>
                      <Accordion.Panel>Placeholder</Accordion.Panel>
                    </Accordion.Item>

                    {experimentType === 'SAXS' && (
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
