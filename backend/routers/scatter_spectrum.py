import msgpack
import numpy as np
from fastapi import APIRouter
from fastapi.responses import Response
from routers.initial_scans_fetching import get_initial_scans
from src.get_images_arrays_and_names import get_images_arrays_and_names

router = APIRouter()


@router.get("/scatter-spectrum")
async def create_scatter_spectrum():
    results_get_initial_scans = await get_initial_scans()

    num_of_files = results_get_initial_scans["num_of_files"]
    all_files_uris = results_get_initial_scans["all_files_uris"]
    mask_detector = results_get_initial_scans["mask_detector"]
    tiled_uri = results_get_initial_scans["tiled_uri"]
    data_local_path = results_get_initial_scans["data_local_path"]
    DEV_MODE = results_get_initial_scans["DEV_MODE"]

    accumulated_data = {
        "max_intensities": [],
        "avg_intensities": [],
        "image_names": [],
    }

    for i in range(num_of_files):

        image_array_full_res, image_name = get_images_arrays_and_names(
            all_files_uris,
            [i],
            mask_detector,
            tiled_uri,
            data_local_path,
            DEV_MODE,
            accumulated_data,
            initialization_mode=True,
        )

        # Convert NumPy types to Python native types
        max_intensity = float(np.nanmax(image_array_full_res))
        avg_intensity = float(np.nanmean(image_array_full_res))

        accumulated_data["max_intensities"].append(max_intensity)
        accumulated_data["avg_intensities"].append(avg_intensity)
        accumulated_data["image_names"].append(image_name)

    # Convert any remaining NumPy values to Python native types
    serializable_data = {
        "max_intensities": [float(x) for x in accumulated_data["max_intensities"]],
        "avg_intensities": [float(x) for x in accumulated_data["avg_intensities"]],
        "image_names": accumulated_data["image_names"],
    }

    packed_data = msgpack.packb(serializable_data, use_bin_type=True)

    return Response(content=packed_data, media_type="application/octet-stream")
