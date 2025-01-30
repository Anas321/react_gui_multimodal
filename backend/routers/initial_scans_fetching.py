import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from tiled.client import from_uri

from backend.src.get_images_arrays_and_names import get_images_arrays_and_names
from backend.src.get_local_files_names import get_local_files_names
from backend.src.get_scans import get_scan_options

# from fastapi_cache import FastAPICache
# from fastapi_cache.backends.memory import MemoryCacheBackend

router = APIRouter()


@router.get("/initial-scans")
# @FastAPICache(expire=60) # Cache for 60 seconds
async def get_initial_scans():

    DEV_MODE = True

    # Load the .env file
    load_dotenv("./.env")
    # Get the values of TILED_URI and MASK_FILE_NAME
    tiled_uri = os.getenv("TILED_URI_IMAGES")
    mask_uri = os.getenv("TILED_URI_MASK")  # "MASK_FILE_NAME")
    mask_file_name = mask_uri.split("/")[-1]
    tiled_api_key = os.getenv("TILED_API_KEY")

    if not tiled_uri or not mask_uri or not tiled_api_key:
        raise HTTPException(
            status_code=500, detail="Environment variables not set correctly"
        )

    # data_local_path = "./new_camera"  # "./SALT_DATA"
    data_local_path = "./SALT_DATA"

    if DEV_MODE:
        data_files_type = ".edf"
        # mask_file_name = "new_mask.npy"  # "mask.npy"
        mask_file_name = "mask.npy"
        all_files_uris, mask_detector = get_local_files_names(
            data_local_path, data_files_type, mask_file_name
        )
    else:
        tiled_client = from_uri(tiled_uri, api_key=tiled_api_key)

        TILED_BASE_URI = tiled_client.uri
        scan_options = get_scan_options(tiled_client, TILED_BASE_URI)
        all_files_uris = scan_options

        mask_client = from_uri(mask_uri)
        mask_detector = mask_client.read()  # This retrieves the actual NumPy array
        all_files_uris = [file_name.replace("/", "", 1) for file_name in all_files_uris]
        all_files_uris = [file for file in all_files_uris if file != mask_file_name]

    num_of_files = len(all_files_uris)

    # Scatter images subplot
    left_image_index = 0
    right_image_index = 1

    # image_preprocessing_store = {
    #     "log_scale": False,
    #     "lower_clipping_percentile": 1,
    #     "upper_clipping_percentile": 99,
    # }
    accumulated_data = {
        "max_intensities": [],
        "avg_intensities": [],
        "image_names": [],
    }

    images_arrays_full_res, images_names = get_images_arrays_and_names(
        all_files_uris,
        [left_image_index, right_image_index],
        mask_detector,
        tiled_uri,
        data_local_path,
        DEV_MODE,
        accumulated_data,
        initialization_mode=False,
    )

    (
        scatter_image_array_1_full_res,
        scatter_image_array_2_full_res,
    ) = images_arrays_full_res

    left_image_name, right_image_name = images_names

    return {
        "scatter_image_array_1_full_res": scatter_image_array_1_full_res,
        "scatter_image_array_2_full_res": scatter_image_array_2_full_res,
        "left_image_name": left_image_name,
        "right_image_name": right_image_name,
        "num_of_files": num_of_files,
    }
