import os
import urllib.parse as urlparse

import fabio
import numpy as np
from src.preprocess_image import get_processed_image
from tiled.client import from_uri


def fetch_image_uri_by_index(index, files_uris, accumulated_data, initialization_mode):
    if initialization_mode or not accumulated_data["image_names"]:
        return files_uris[index]
    else:
        # Step 1: Retrieve the image name from accumulated_data["image_names"]
        try:
            image_name = accumulated_data["image_names"][index]
        except IndexError:
            print("Invalid index: No image exists at this position.")
            return None

        # Step 2: Find the image URI in files_uris
        try:
            # Locate the position of image_name in files_uris
            # image_uri = next(uri for uri in files_uris if image_name in uri)
            for uri in files_uris:
                if image_name == uri:
                    image_uri = image_name
                    break
        except StopIteration:
            print(f"Image name '{image_name}' not found in files_uris.")
            return None

        # Step 3: Return or fetch the URI as needed
        return image_uri


def get_images_arrays_and_names(
    files_uris,
    images_indices,
    mask_detector,
    tiled_uri,
    data_local_path,
    DEV_MODE,
    accumulated_data,
    initialization_mode=False,
):

    image_arrays = []
    image_names = []

    if DEV_MODE:

        # if downsample_factor != 1:
        #     mask_detector = zoom(mask_detector, downsample_factor)

        # Load local images
        for i in range(len(images_indices)):

            if initialization_mode or not accumulated_data["image_names"]:
                image_name = files_uris[images_indices[i]]
            else:
                print("images_indices[i]: ", images_indices[i])
                print("i: ", i)
                image_name = accumulated_data["image_names"][images_indices[i]]
            image_path = os.path.join(data_local_path, image_name)

            # Use fabio to read .edf files
            if image_name.endswith(".edf"):
                image_array = fabio.open(image_path).data  # Get image data from .edf
            else:
                image_array = np.load(
                    image_path, allow_pickle=True
                )  # For other file types like .npy

            processed_image = get_processed_image(
                image_array,
                mask_detector,
            )

            image_arrays.append(processed_image)
            image_names.append(image_name)

    else:

        all_images_uris = []
        for index in images_indices:
            all_images_uris.append(
                fetch_image_uri_by_index(
                    index, files_uris, accumulated_data, initialization_mode
                )
            )

        # Load images from the tiled server
        for i in range(len(all_images_uris)):

            image_uri = all_images_uris[i]
            file_uri = urlparse.urljoin(tiled_uri, image_uri)
            image_client = from_uri(file_uri)
            image_array = image_client.read()  # Retrieve the NumPy array

            processed_image = get_processed_image(
                image_array,
                mask_detector,
            )

            image_arrays.append(processed_image)
            image_names.append(image_uri)

    return image_arrays, image_names
