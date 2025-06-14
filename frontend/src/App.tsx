import { useState } from 'react';
import { MantineProvider, Container, Accordion, Select, Menu} from '@mantine/core';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi'; // Collapsing arrows
import '@mantine/core/styles.css';
import './index.css'; // Import the CSS file
import alsLogo from '/src/als_logo.jpeg';
import ScatterSubplot from './components/ScatterSubplot';

import HorizontalLinecutWidget from './components/HorizontalLinecutWidget';
import VerticalLinecutWidget from './components/VerticalLinecutWidget';
import InclinedLinecutWidget from './components/InclinedLinecutWidget';
import AzimuthalIntegrationWidget from './components/AzimuthalIntegrationWidget';

import DataTransformationAccordion from './components/DataTransformationAccordion';
import CalibrationAccordion from './components/CalibrationAccordion';

import HorizontalLinecutFig from './components/HorizontalLinecutFig';
import VerticalLinecutFig from './components/VerticalLinecutFig';
import InclinedLinecutFig from './components/InclinedLinecutFig';
import AzimuthalIntegrationFig from './components/AzimuthalIntegrationFig';

import RawDataOverviewAccordion from './components/RawDataOverviewAccordion';

import { handleExperimentTypeChange, addLinecut } from './utils/linecutHandlers';
import { leftImageColorPalette, rightImageColorPalette } from './utils/constants';
import useMultimodal from './hooks/useMultimodal';
import { Info } from 'lucide-react';
import { Popover } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import useAzimuthalIntegration from './hooks/useAzimuthalIntegration';
import useHorizontalLinecut from './hooks/useHorizontalLinecut';
import useVerticalLinecut from './hooks/useVerticalLinecut';
import useInclinedLinecut from './hooks/useInclinedLinecut';
import useDataTransformation from './hooks/useDataTransformation';
import useRawDataOverview from './hooks/useRawDataOverview';

import { CalibrationParams } from './types';
import RawDataOverviewFig from './components/RawDataOverviewFig';


function App() {
  const [isSecondCollapsed, setSecondCollapsed] = useState(false);
  // const [isThirdCollapsed, setThirdCollapsed] = useState(false);
  const isThirdCollapsed = true; // Set to true to collapse the third column by default
  const linecutOrder = ['Horizontal', 'Vertical', 'Inclined', 'Azimuthal'];

  const {
    experimentType,
    setExperimentType,
    selectedLinecuts,
    setSelectedLinecuts,
    imageHeight,
    setImageHeight,
    imageWidth,
    setImageWidth,
    imageData1,
    setImageData1,
    imageData2,
    setImageData2,
    zoomedXPixelRange,
    setZoomedXPixelRange,
    zoomedYPixelRange,
    setZoomedYPixelRange,
    resolutionMessage,
    setResolutionMessage,
    calibrationParams,
    updateCalibration,
    qXMatrix,
    qYMatrix,
  } = useMultimodal();

  // get the first row of qXMatrix as qXVector
  const qXVector = qXMatrix[0];
  // get the first column of qYMatrix as qYVector
  const qYVector = qYMatrix.map(row => row[0]);

  const {
      azimuthalIntegrations,
      azimuthalData1,
      azimuthalData2,
      maxQValue,
      globalQRange,
      isProcessing,
      addAzimuthalIntegration,
      updateAzimuthalQRange,
      updateAzimuthalRange,
      updateAzimuthalColor,
      deleteAzimuthalIntegration,
      toggleAzimuthalVisibility,
  } = useAzimuthalIntegration(calibrationParams);


  const {
    horizontalLinecuts,
    addHorizontalLinecut,
    updateHorizontalLinecutPosition,
    updateHorizontalLinecutWidth,
    updateHorizontalLinecutColor,
    deleteHorizontalLinecut,
    toggleHorizontalLinecutVisibility,
  } = useHorizontalLinecut(imageHeight, imageData1, imageData2, qYMatrix);


  const {
    verticalLinecuts,
    addVerticalLinecut,
    updateVerticalLinecutPosition,
    updateVerticalLinecutWidth,
    updateVerticalLinecutColor,
    deleteVerticalLinecut,
    toggleVerticalLinecutVisibility,
  } = useVerticalLinecut(imageWidth, imageData1, imageData2, qXMatrix);



  const {
    inclinedLinecuts,
    inclinedLinecutData1,
    inclinedLinecutData2,
    addInclinedLinecut,
    updateInclinedLinecutAngle,
    updateInclinedLinecutWidth,
    updateInclinedLinecutColor,
    deleteInclinedLinecut,
    toggleInclinedLinecutVisibility,
    zoomedXQRange,
  } = useInclinedLinecut(
    imageData1,
    imageData2,
    qXVector,
    qYVector,
    // qXMatrix[0], // First row as X vector
    // qYMatrix.map(row => row[0]), // First column as Y vector
    zoomedXPixelRange,
    zoomedYPixelRange,
  );


  const {
    isLogScale,
    setIsLogScale,
    lowerPercentile,
    setLowerPercentile,
    upperPercentile,
    setUpperPercentile,
    normalization,
    setNormalization,
    imageColormap,
    setImageColormap,
    differenceColormap,
    setDifferenceColormap,
    normalizationMode,
    setNormalizationMode,
    mainTransformDataFunction,
  } = useDataTransformation();


  const {
    leftImageIndex,
    setLeftImageIndex,
    rightImageIndex,
    setRightImageIndex,
    isFetchingData,
    isLoadingImages,
    setIsLoadingImages,
    numOfFiles,

    progress,
    progressMessage,

    maxIntensities,
    avgIntensities,
    imageNames,

    fetchSpectrumData,
    handleImageIndicesChange,

    displayOption,
    setDisplayOption,

  } = useRawDataOverview();



    const handleCalibrationUpdate = async (params: CalibrationParams) => {
      try {
          notifications.show({
              id: 'calibration-update',
              loading: true,
              title: 'Updating Calibration',
              message: 'Please wait while calibration parameters are updated...',
              autoClose: false,
          });

          // Update the calibration parameters in the hook
          updateCalibration(params);

          notifications.update({
              id: 'calibration-update',
              color: 'green',
              title: 'Calibration Updated',
              message: 'Calibration parameters have been updated successfully',
              autoClose: 2000,
          });

      } catch (error) {
          let errorMessage: string;
          if (error instanceof Error) {
              errorMessage = error.message;
          } else if (typeof error === 'string') {
              errorMessage = error;
          } else {
              errorMessage = 'An unexpected error occurred during calibration update';
          }

          console.error('Error updating calibration:', error);

          notifications.update({
              id: 'calibration-update',
              color: 'red',
              title: 'Calibration Update Failed',
              message: errorMessage,
              autoClose: 4000,
          });
      }
  };



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
        <h1 className="m-0 text-[2.5rem] text-sky-900">
          Scattering Analysis
        </h1>
        {/* Left collapsing arrow */}
        {/* <div
              className="absolute top-[50px] -left-0 flex items-center justify-center bg-gray-200 rounded-full w-10 h-10 cursor-pointer shadow-md z-[1000]"
              onClick={() => {
                setSecondCollapsed(!isSecondCollapsed);
                // if (!isSecondCollapsed) setThirdCollapsed(false); // Expand third column
              }}
            >
              {isSecondCollapsed ? <FiArrowRight size={20} /> : <FiArrowLeft size={20} />}
        </div> */}
        {/* Right collapsing arrow */}
        {/* <div
              className="absolute top-[50px] -right-0 flex items-center justify-center bg-gray-200 rounded-full w-10 h-10 cursor-pointer shadow-md z-[1000]"
              onClick={() => {
                setThirdCollapsed(!isThirdCollapsed);
              }}
            >
              {isThirdCollapsed ? <FiArrowLeft size={20} /> : <FiArrowRight size={20} />}
        </div> */}
      </div>

      {/* Main Layout */}
      <Container
        fluid
        style={{
          display: 'flex',
          // height: '100vh',
          height: 'calc(100vh - 70px)',
          width: '100%',
          padding: 0,
        }}
      >
      {/* <div className="flex flex-row h-[150vh] w-[100vw] p-0"> */}
        {/* First Column */}
        {!isSecondCollapsed && (
          // <div className={`border border-gray-300 shadow-lg h-full bg-gray-100 relative transition-all duration-300 flex-shrink-0 flex flex-col h-[calc(100vh-70px)]
          //   ${isSecondCollapsed ? 'w-0' : 'w-[15%]'}`}
          // >
          <div className={`border border-gray-300 shadow-lg bg-gray-100 relative transition-all duration-300 flex-shrink-0 flex flex-col h-full overflow-y-auto
            ${isSecondCollapsed ? 'w-0' : 'w-[15%]'}`}
            style={{ height: 'calc(100vh - 70px)', maxHeight: 'calc(100vh - 70px)' }} // Force height with style
          >
            {/* Fixed Header Section */}
            <div className="flex-shrink-0 sticky top-0 bg-gray-100 z-10">
              <h1 className="text-xl mb-4 mt-4 text-center">Controls</h1>
              <hr className="w-full border border-gray-300" />
            </div>
          {/* Scrollable Content Section */}
          {/* <div className="flex-1 overflow-y-auto overflow-x-hidden"> */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden h-full">
            {/* Dropdown for Experiment Type */}
            <Select
              label="Experiment Type"
              value={experimentType}
              onChange={(value) => handleExperimentTypeChange(value, setExperimentType, setSelectedLinecuts)}
              data={[
                { value: 'SAXS', label: 'SAXS' },
                { value: 'GISAXS', label: 'GISAXS' },
              ]}
              className="mt-6 mx-auto w-[90%]" // Center it horizontally
              classNames={{
                // label: 'text-xl font-bold mb-2 pl-1', // Tailwind for the label
                // input: 'text-lg py-3 px-4', // Tailwind for input size and padding
                label: 'text-sm font-bold mb-2 pl-1', // Tailwind for the label
                input: 'text-sm py-3 px-4', // Tailwind for input size and padding
                dropdown: 'p-2', // Tailwind for dropdown padding
                option: 'text-lg py-2 px-4 hover:bg-gray-100 cursor-pointer rounded', // Tailwind for dropdown items
              }}
            />
            {/* Horizontal Line Cut Accordion */}
            <Accordion
              multiple
              defaultValue={['horizontal-linecut-accordion']} // Expanded by default
              chevronPosition="right"
              // classNames={{ chevron: 'text-[1.5rem] font-bold', label: 'text-[2rem] font-bold' }}
              classNames={{ chevron: 'text-sm font-bold', label: 'text-base font-bold' }}
              className="mt-6"
            >

            {/* Scatter Spectrum Accordion */}
            <Accordion.Item value="scatter-spectrum-accordion">
              {/* <Accordion.Control classNames={{label: 'text-3xl font-bold'}}> */}
              <Accordion.Control classNames={{label: 'text-lg font-bold'}}>
                Raw Data Overview
              </Accordion.Control>
              <Accordion.Panel>
                <RawDataOverviewAccordion
                  leftImageIndex={leftImageIndex}
                  rightImageIndex={rightImageIndex}
                  setLeftImageIndex={setLeftImageIndex}
                  setRightImageIndex={setRightImageIndex}
                  numOfFiles={numOfFiles}
                  displayOption={displayOption}
                  setDisplayOption={setDisplayOption}
                  fetchSpectrumData={fetchSpectrumData}
                  isFetchingData={isFetchingData}
                  imageNames={imageNames}
                />
              </Accordion.Panel>
            </Accordion.Item>

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
                          // className="w-12/12 px-12 py-3 bg-blue-500 text-white text-[1.75rem] font-semibold rounded-lg shadow hover:bg-blue-600 transition mx-auto block"
                          className="w-full px-4 py-2 bg-blue-500 text-white text-base font-semibold rounded-lg shadow hover:bg-blue-600 transition mx-auto block"
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
                          {/* <span className="text-2xl font-medium">Horizontal Linecut</span> */}
                        <span className="text-base font-medium">Horizontal Linecut</span>
                        </Menu.Item>

                        <Menu.Item
                          onClick={() => {
                            addLinecut('Vertical', selectedLinecuts, setSelectedLinecuts);
                            addVerticalLinecut();
                          }}
                        >
                          {/* <span className="text-2xl font-medium">Vertical Linecut</span> */}
                          <span className="text-base font-medium">Vertical Linecut</span>
                        </Menu.Item>

                        {/* Conditionally render Azimuthal Integration in the menu*/}
                        <Menu.Item
                        onClick={() => {
                          addLinecut('Inclined', selectedLinecuts, setSelectedLinecuts)
                          addInclinedLinecut();
                        }}
                        >
                          {/* <span className="text-2xl font-medium">Inclined Linecut</span> */}
                          <span className="text-base font-medium">Inclined Linecut</span>
                        </Menu.Item>
                        {/* Conditionally render Azimuthal Integration */}
                        {experimentType === 'SAXS' && (
                          <Menu.Item
                          onClick={() => {
                            addLinecut('Azimuthal', selectedLinecuts, setSelectedLinecuts)
                            addAzimuthalIntegration();
                          }}
                          >
                          {/* <span className="text-2xl font-medium">Azimuthal Integration</span> */}
                          <span className="text-base font-medium">Azimuthal Integration</span>
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
                          linecuts={horizontalLinecuts}
                          qYMatrix={qYMatrix}
                          // qYVector={qYVector}
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
                          linecuts={verticalLinecuts}
                          qXMatrix={qXMatrix}
                          // qXVector={qXVector}
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
                          linecuts={inclinedLinecuts}
                          units="nm⁻¹"
                          updateInclinedLinecutAngle={updateInclinedLinecutAngle}
                          updateInclinedLinecutWidth={updateInclinedLinecutWidth}
                          updateInclinedLinecutColor={updateInclinedLinecutColor}
                          deleteInclinedLinecut={deleteInclinedLinecut}
                          toggleInclinedLinecutVisibility={toggleInclinedLinecutVisibility}
                        />
                      );
                    }

                    // Azimuthal integration
                    if (linecutType === 'Azimuthal' && azimuthalIntegrations.length > 0) {
                      return (
                        <AzimuthalIntegrationWidget
                          key={`linecut-section-${linecutType}`}
                          integrations={azimuthalIntegrations}
                          maxQValue={maxQValue}
                          updateAzimuthalQRange={updateAzimuthalQRange}
                          updateAzimuthalRange={updateAzimuthalRange}
                          updateAzimuthalColor={updateAzimuthalColor}
                          deleteAzimuthalIntegration={deleteAzimuthalIntegration}
                          toggleAzimuthalVisibility={toggleAzimuthalVisibility}
                        />
                      );
                    }

                    return null;
                  })}
                  </div>
                </Accordion.Panel>
              </Accordion.Item>


              {/* Data transformation accordion */}
              <Accordion.Item value="data-transformation-accordion">
                {/* <Accordion.Control classNames={{label: 'text-3xl font-bold'}}> */}
                <Accordion.Control classNames={{label: 'text-lg font-bold'}}>
                  Data Transformation
                </Accordion.Control>
                <Accordion.Panel>
                  <DataTransformationAccordion
                    isLogScale={isLogScale}
                    setIsLogScale={setIsLogScale}
                    lowerPercentile={lowerPercentile}
                    setLowerPercentile={setLowerPercentile}
                    upperPercentile={upperPercentile}
                    setUpperPercentile={setUpperPercentile}
                    normalization={normalization}
                    setNormalization={setNormalization}
                    imageColormap={imageColormap}
                    setImageColormap={setImageColormap}
                    differenceColormap={differenceColormap}
                    setDifferenceColormap={setDifferenceColormap}
                    normalizationMode={normalizationMode}
                    setNormalizationMode={setNormalizationMode}
                  />
                </Accordion.Panel>
              </Accordion.Item>


                {/* Data transformation accordion */}
                <Accordion.Item value="calibration accordion">
                {/* <Accordion.Control classNames={{label: 'text-3xl font-bold'}}> */}
                <Accordion.Control classNames={{label: 'text-lg font-bold'}}>
                  Calibration
                </Accordion.Control>
                <Accordion.Panel>
                  <CalibrationAccordion
                    onCalibrationUpdate={handleCalibrationUpdate}
                    calibrationParams={calibrationParams}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
            </div>
          </div>

      )}
        {/* Second Column */}
        {/* <div
          className={`h-[calc(100vh-70px)] border-r-2 border-gray-300 transition-all duration-300
            ${isSecondCollapsed
            ? 'flex-grow-0 w-0 overflow-hidden'
            : 'flex-grow w-[85%]' // Always use 85% when visible
            // : isThirdCollapsed
            // ? 'flex-grow w-[85%]'
            // : 'flex-grow w-[35%]'
          }`}
        > */}
        <div
            className={`transition-all duration-300 border-r-2 border-gray-300
              ${isSecondCollapsed
              ? 'flex-grow-0 w-0 overflow-hidden'
              : 'flex-grow w-[85%]'
            }`}
            style={{ height: 'calc(100vh - 70px)', maxHeight: 'calc(100vh - 70px)', overflow: 'auto' }} // Match the exact same height
          >
          {/* {!isSecondCollapsed && ( */}
          <div className="flex-1 overflow-y-auto">
            <Accordion
              multiple
              defaultValue={['scatter-images-accordion', 'intensity-spectrum-accordion', 'linecuts-accordion-second-col']} // Expanded by default
              chevronPosition="right"
              classNames={{ chevron: 'text-[1.5rem] font-bold', label: 'text-[1.5rem] font-bold'}}
            >
            <Accordion.Item value="scatter-images-accordion">
              <Accordion.Control>
                Images
              </Accordion.Control>
               <Accordion.Panel>
                <div className="flex flex-col h-[40vh]">
                <div className="flex-1" style={{ height: 'calc(40vh - 30px)' }}>
                  <ScatterSubplot
                    setImageHeight={setImageHeight}
                    setImageWidth={setImageWidth}
                    setImageData1={setImageData1}
                    setImageData2={setImageData2}
                    horizontalLinecuts={horizontalLinecuts}
                    verticalLinecuts={verticalLinecuts}
                    inclinedLinecuts={inclinedLinecuts}
                    leftImageColorPalette={leftImageColorPalette}
                    rightImageColorPalette={rightImageColorPalette}
                    setZoomedXPixelRange={setZoomedXPixelRange}
                    setZoomedYPixelRange={setZoomedYPixelRange}
                    isThirdCollapsed={isThirdCollapsed}
                    setResolutionMessage={setResolutionMessage}
                    isLogScale={isLogScale}
                    lowerPercentile={lowerPercentile}
                    upperPercentile={upperPercentile}
                    normalization={normalization}
                    imageColormap={imageColormap}
                    differenceColormap={differenceColormap}
                    normalizationMode={normalizationMode}
                    azimuthalIntegrations={azimuthalIntegrations}
                    azimuthalData1={azimuthalData1}
                    azimuthalData2={azimuthalData2}
                    maxQValue={maxQValue}
                    calibrationParams={calibrationParams}
                    qYMatrix={qYMatrix}
                    qXMatrix={qXMatrix}
                    units="nm⁻¹"
                    mainTransformDataFunction={mainTransformDataFunction}
                    leftImageIndex={leftImageIndex}
                    rightImageIndex={rightImageIndex}
                    isLoadingImages={isLoadingImages}
                    setIsLoadingImages={setIsLoadingImages}
                    isAzimuthalProcessing={isProcessing}
                  />
                </div>
                  {/* Image Selection */}
                  {resolutionMessage && (
                    <div className="flex-shrink-0 flex items-center text-sm text-gray-500 text-left whitespace-nowrap overflow-x-auto">
                      <span>{resolutionMessage}</span>
                      <Popover width={670} position="top"> {/* Increased width to 600px */}
                        <Popover.Target>
                          <div className="cursor-pointer">
                            <Info className="ml-2 w-4 h-4" />
                          </div>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <div className="text-sm space-y-4 whitespace-normal"> {/* Added whitespace-normal to allow natural text wrapping */}
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
                <Accordion.Control>Raw Data Overview</Accordion.Control>
                <Accordion.Panel>
                <div className="h-[25vh] flex items-center justify-center">
                  <RawDataOverviewFig
                    maxIntensities={maxIntensities}
                    avgIntensities={avgIntensities}
                    leftImageIndex={leftImageIndex}
                    rightImageIndex={rightImageIndex}
                    onSelectImages={handleImageIndicesChange}
                    isFetchingData={isFetchingData}
                    displayOption={displayOption}
                    imageNames={imageNames}
                    progress={progress}
                    progressMessage={progressMessage}
                  ></RawDataOverviewFig>
                </div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="linecuts-accordion-second-col">
                <Accordion.Control>Linecuts</Accordion.Control>
                <Accordion.Panel>
                <div className="max-h-[45vh] overflow-y-auto">
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
                          qXMatrix={qXMatrix}
                          qYMatrix={qYMatrix}
                          // qXVector={qXVector}
                          // qYVector={qYVector}
                          units="nm⁻¹"
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
                              // qYMatrix={qYMatrix}
                              // qYVector={qYVector}
                              // qXVector={qXVector}
                              qXMatrix={qXMatrix}
                              qYMatrix={qYMatrix}
                              units="nm⁻¹"
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
                        inclinedLinecutData1={inclinedLinecutData1 || []}  // Provide default empty array
                        inclinedLinecutData2={inclinedLinecutData2 || []}  // Provide default empty array
                        beamCenterX={calibrationParams.beam_center_x}
                        beamCenterY={calibrationParams.beam_center_y}
                        zoomedXQRange={zoomedXQRange}
                        qXVector={qXVector} // First row as X vector
                        qYVector={qYVector} // First column as Y vector
                        // qXVector={qXMatrix[0]} // First row as X vector
                        // qYVector={qYMatrix.map(row => row[0])} // First column as Y vector
                        units="nm⁻¹"
                      />
                      </Accordion.Panel>
                    </Accordion.Item>
                    )}
                    {experimentType === 'SAXS' &&
                    selectedLinecuts.includes('Azimuthal') &&
                    azimuthalIntegrations.length > 0
                    && (
                      <Accordion.Item value="azimuthal-integration-accordion">
                        <Accordion.Control>Azimuthal Integration</Accordion.Control>
                        <Accordion.Panel>
                          <AzimuthalIntegrationFig
                            integrations={azimuthalIntegrations}
                            azimuthalData1={azimuthalData1}
                            azimuthalData2={azimuthalData2}
                            zoomedQRange={globalQRange}
                          />
                        </Accordion.Panel>
                      </Accordion.Item>
                    )}

                  </Accordion>
                </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
           </div>
        </div>

        {/* Third Column
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
        */}

        {/* Fourth Column
        {!isThirdCollapsed && (
          <div className={`border border-gray-300 shadow-lg h-full bg-gray-100 relative transition-all duration-300 flex-shrink-0
            ${isThirdCollapsed ? 'w-0' : 'w-[15%]'}`}
          >
            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">XPS Controls</h1>
            <hr className="w-full border border-gray-300" />
          </div>
    )}
    */}
      {/* </div> */}
      </Container>
    </MantineProvider>
  );
}

export default App;
