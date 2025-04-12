import asyncio
import os
import urllib.parse as urlparse

import fabio
import numpy as np
from src.preprocess_image import get_processed_image
from tiled.client import from_uri

# from functools import lru_cache


# # Cache the Tiled client connection to avoid recreating it for each image
# @lru_cache(maxsize=4)  # Adjust maxsize based on your server memory
# def get_tiled_client(uri):
#     return from_uri(uri)


# def get_single_image_array_and_name(
#     image_uri, mask_detector, tiled_uri, data_local_path, DEV_MODE
# ):
#     """Process a single image and return its array and name"""

#     if DEV_MODE:
#         # Load local image
#         image_path = os.path.join(data_local_path, image_uri)

#         # Use fabio to read .edf files
#         if image_uri.endswith(".edf"):
#             image_array = fabio.open(image_path).data  # Get image data from .edf
#         else:
#             image_array = np.load(
#                 image_path, allow_pickle=True
#             )  # For other file types like .npy

#         processed_image = get_processed_image(
#             image_array,
#             mask_detector,
#         )

#         return processed_image, image_uri

#     else:
#         # Load image from the tiled server
#         file_uri = urlparse.urljoin(tiled_uri, image_uri)
#         # image_client = from_uri(file_uri)

#         image_client = get_tiled_client(file_uri)
#         image_array = image_client.read()  # Retrieve the NumPy array

#         processed_image = get_processed_image(
#             image_array,
#             mask_detector,
#         )

#         return processed_image, image_uri


# Use a proper connection pool with a semaphore to limit concurrent connections
tiled_clients = {}
connection_lock = asyncio.Lock()
# Limit concurrent connections to avoid overwhelming the server
connection_semaphore = asyncio.Semaphore(10)  # Adjust based on server capacity


async def get_tiled_client_async(uri):
    """Get or create a client for the given URI"""
    async with connection_lock:
        if uri not in tiled_clients:
            # Create the client - we're still using the synchronous client
            # but wrapping its operations in asyncio.to_thread
            tiled_clients[uri] = from_uri(uri)
        return tiled_clients[uri]


async def get_single_image_array_and_name_async(
    image_uri, mask_detector, tiled_uri, data_local_path, DEV_MODE
):
    """Process a single image asynchronously and return its array and name"""
    # Use semaphore to limit concurrent connections
    async with connection_semaphore:
        if DEV_MODE:
            # For local files, use asyncio.to_thread to make file I/O non-blocking
            image_path = os.path.join(data_local_path, image_uri)

            if image_uri.endswith(".edf"):
                # Use asyncio.to_thread to make the synchronous operation non-blocking
                image_array = await asyncio.to_thread(
                    lambda: fabio.open(image_path).data
                )
            else:
                image_array = await asyncio.to_thread(
                    lambda: np.load(image_path, allow_pickle=True)
                )
        else:
            # Load image from the tiled server
            file_uri = urlparse.urljoin(tiled_uri, image_uri)
            client = await get_tiled_client_async(file_uri)

            # Use to_thread to make the synchronous API call non-blocking
            # This keeps the original client's behavior of returning NumPy arrays
            image_array = await asyncio.to_thread(client.read)

        # Process image asynchronously
        processed_image = await asyncio.to_thread(
            get_processed_image, image_array, mask_detector
        )

        return processed_image, image_uri
