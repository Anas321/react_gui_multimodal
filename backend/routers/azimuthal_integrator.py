from typing import Tuple

import msgpack
import numpy as np

# import pyFAI
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from pydantic import BaseModel
from pyFAI.integrator.azimuthal import AzimuthalIntegrator

from backend.routers.initial_scans_fetching import get_initial_scans

# OpenCL support is currently commented out but could be enabled for GPU acceleration
# import pyopencl as cl
# import pyopencl.array as cla


class CalibrationParameters(BaseModel):
    sample_detector_distance: float
    beam_center_x: float
    beam_center_y: float
    pixel_size_x: float
    pixel_size_y: float
    wavelength: float
    tilt: float = 0.0
    tilt_plan_rotation: float = 0.0


router = APIRouter()


def parse_range_parameter(
    param: str | None | Tuple[float, float], default: Tuple[float, float]
) -> Tuple[float, float]:
    """
    Parse a range parameter that can be either a string "min,max" or a tuple (min, max).

    Args:
        param: Either a string "min,max" or a tuple (min, max) or None
        default: Default tuple to return if param is None

    Returns:
        Tuple of (min, max) as floats
    """
    if param is None:
        return default

    if isinstance(param, tuple):
        return (float(param[0]), float(param[1]))

    try:
        min_val, max_val = map(float, param.split(","))
        return (min_val, max_val)
    except (ValueError, TypeError, AttributeError) as e:
        raise ValueError(
            f"Invalid range parameter format. Expected 'min,max' or (min,max), got {param}. Error: {e}"
        )


@router.get("/azimuthal-integrator")
async def azimuthal_integration(
    # Calibration parameters as query parameters with defaults
    sample_detector_distance: float = Query(
        default=274.83,
        description="Distance between sample and detector in millimeters",
    ),
    beam_center_x: float = Query(
        default=317.8, description="X-coordinate of beam center in pixels"
    ),
    beam_center_y: float = Query(
        default=1245.28, description="Y-coordinate of beam center in pixels"
    ),
    pixel_size_x: float = Query(
        default=172, description="Pixel size in X direction (micrometers)"
    ),
    pixel_size_y: float = Query(
        default=172, description="Pixel size in Y direction (micrometers)"
    ),
    wavelength: float = Query(
        default=1.2398, description="X-ray wavelength in Angstroms"
    ),
    tilt: float = Query(default=0.0, description="Detector tilt angle in degrees"),
    tilt_plan_rotation: float = Query(
        default=0.0, description="Rotation of tilt plane in degrees"
    ),
    # Other parameters
    scans=Depends(get_initial_scans),
    azimuth_range_deg: str | None = None,
    q_range: str | None = None,
):
    """
    Performs azimuthal integration on two scatter images to convert 2D detector images
    into 1D intensity vs. q plots. This process averages the intensity around circles
    centered on the beam position, accounting for the experimental geometry.
    """

    # # Parse the range parameters
    azimuth_range = parse_range_parameter(azimuth_range_deg, None)
    q_range_tuple = parse_range_parameter(q_range, None)

    # print(f"Azimuthal range: {azimuth_range}", type(azimuth_range))
    # print(f"Q range: {q_range_tuple}")

    # Convert the input scatter images to NumPy arrays for processing
    # The full resolution images are used to maintain maximum data quality
    scatter_image_array_1 = np.array(scans["scatter_image_array_1_full_res"])
    scatter_image_array_2 = np.array(scans["scatter_image_array_2_full_res"])

    # # Define experimental geometry parameters
    # # These parameters describe the physical setup of the X-ray scattering experiment
    # sample_detector_distance = 274.83  # Distance from sample to detector in millimeters
    # beam_center_x = 317.8  # X-coordinate of beam center in pixels
    # beam_center_y = 1245.28  # Y-coordinate of beam center in pixels
    # tilt = 0  # Detector tilt angle (if any)
    # tilt_plan_rotation = 0  # Rotation of tilt plane
    # pixel_size_x = 172  # Pixel size in micrometers (X direction)
    # pixel_size_y = 172  # Pixel size in micrometers (Y direction)
    # wavelength = 1.2398  # X-ray wavelength in Angstroms

    # params = update_calibration()

    # Package all calibration parameters into a dictionary for easier handling
    azimuthal_integration_calibration_params = {
        "sample_detector_distance": sample_detector_distance,
        "beam_center_x": beam_center_x,
        "beam_center_y": beam_center_y,
        "pixel_size_x": pixel_size_x,
        "pixel_size_y": pixel_size_y,
        "wavelength": wavelength,
        "tilt": tilt,
        "tilt_plan_rotation": tilt_plan_rotation,
    }

    # # Initialize the azimuthal integrator with our experimental geometry
    ai = AzimuthalIntegrator()
    ai.setFit2D(
        directDist=azimuthal_integration_calibration_params["sample_detector_distance"],
        centerX=azimuthal_integration_calibration_params["beam_center_x"],
        centerY=azimuthal_integration_calibration_params["beam_center_y"],
        tilt=azimuthal_integration_calibration_params["tilt"],
        tiltPlanRotation=azimuthal_integration_calibration_params["tilt_plan_rotation"],
        pixelX=azimuthal_integration_calibration_params["pixel_size_x"],
        pixelY=azimuthal_integration_calibration_params["pixel_size_y"],
        wavelength=azimuthal_integration_calibration_params["wavelength"],
    )

    # # Get the current calibrated integrator instead of creating a new one
    # state = IntegratorState()
    # ai = state.integrator

    # Set integration parameters
    number_of_integration_points = 500  # Number of points in output 1D pattern
    method = ("full", "csr", "cython")  # Integration method using CPU optimization
    # Alternative GPU-accelerated method (commented out):
    # method=("full", "csr", "opencl", (0,0))

    # Perform integration for first scatter image
    res_1 = ai.integrate1d(
        scatter_image_array_1,
        number_of_integration_points,
        method=method,
        azimuth_range=azimuth_range,
        radial_range=q_range_tuple,
    )

    # Perform integration for second scatter image
    res_2 = ai.integrate1d(
        scatter_image_array_2,
        number_of_integration_points,
        method=method,
        azimuth_range=azimuth_range,
        radial_range=q_range_tuple,
    )

    # Access the integration engine for additional processing
    engine = ai.engines[res_1.method].engine

    # Perform advanced integration using the engine directly
    res_1 = engine.integrate_ng(scatter_image_array_1)
    res_2 = engine.integrate_ng(scatter_image_array_2)

    # Extract q values and intensities from the integration results
    q_1 = res_1.position  # q values for first image
    intensity_1 = res_1.intensity  # Integrated intensities for first image
    q_2 = res_2.position  # q values for second image
    intensity_2 = res_2.intensity  # Integrated intensities for second image

    q_max = max(q_1.max(), q_2.max())

    # Generate 2D arrays of q and chi values for visualization and masking
    # Process first image
    q_array_initial_1 = ai.qArray(scatter_image_array_1.shape)
    chi_array_1 = ai.chiArray(scatter_image_array_1.shape)

    # Process second image
    q_array_initial_2 = ai.qArray(scatter_image_array_2.shape)
    chi_array_2 = ai.chiArray(scatter_image_array_2.shape)

    # Convert azimuthal range to radians for the chi array calculations
    azimuth_range_rad = np.radians(azimuth_range)

    # Create masks for both images based on the azimuthal range
    # Create a boolean mask that selects only the pixels within our desired azimuthal range
    # True values in the mask indicate pixels we want to keep
    # False values indicate pixels outside our angular region of interest
    mask_1 = (chi_array_1 >= azimuth_range_rad[0]) & (
        chi_array_1 <= azimuth_range_rad[1]
    )
    mask_2 = (chi_array_2 >= azimuth_range_rad[0]) & (
        chi_array_2 <= azimuth_range_rad[1]
    )

    # Apply the mask to our q-array. This creates an array where:
    # - Pixels within our desired angular range maintain their q-values
    # - Pixels outside our range are set to NaN (Not a Number)
    # This filtered array can be used for subsequent analysis or visualization
    q_array_filtered_1 = np.where(mask_1, q_array_initial_1, np.nan)
    q_array_filtered_2 = np.where(mask_2, q_array_initial_2, np.nan)

    # Package the results for frontend using msgpack
    # Convert NumPy arrays to lists for serialization
    result_data = {
        "q_1": q_1.tolist(),
        "q_2": q_2.tolist(),
        "intensity_1": intensity_1.tolist(),
        "intensity_2": intensity_2.tolist(),
        "q_array_filtered_1": q_array_filtered_1.tolist(),
        "q_array_filtered_2": q_array_filtered_2.tolist(),
        "q_max": q_max,
    }

    # Serialize the data using msgpack
    packed_data = msgpack.packb(result_data)

    # Return the packed data with appropriate media type
    return Response(content=packed_data, media_type="application/x-msgpack")
