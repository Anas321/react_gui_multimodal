# import asyncio
import os
import urllib.parse as urlparse
from functools import lru_cache

import fabio
import numpy as np
from src.preprocess_image import get_processed_image
from tiled.client import from_uri


# Cache the Tiled client connection to avoid recreating it for each image
@lru_cache(maxsize=4)  # Adjust maxsize based on your server memory
def get_tiled_client(uri):
    return from_uri(uri)


def get_single_image_array_and_name(
    image_uri, mask_detector, tiled_uri, data_local_path, DEV_MODE
):
    """Process a single image and return its array and name"""

    if DEV_MODE:
        # Load local image
        image_path = os.path.join(data_local_path, image_uri)

        # Use fabio to read .edf files
        if image_uri.endswith(".edf"):
            image_array = fabio.open(image_path).data  # Get image data from .edf
        else:
            image_array = np.load(
                image_path, allow_pickle=True
            )  # For other file types like .npy

        processed_image = get_processed_image(
            image_array,
            mask_detector,
        )

        return processed_image, image_uri

    else:
        # Load image from the tiled server
        tiled_uri = tiled_uri if tiled_uri.endswith("/") else tiled_uri + "/"
        file_uri = urlparse.urljoin(tiled_uri, image_uri)
        # image_client = from_uri(file_uri)

        image_client = get_tiled_client(file_uri)
        image_array = image_client.read()  # Retrieve the NumPy array

        processed_image = get_processed_image(
            image_array,
            mask_detector,
        )

        return processed_image, image_uri
