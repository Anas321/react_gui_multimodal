import concurrent.futures

import msgpack
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from routers.initial_scans_fetching import get_initial_scans

# from src.get_images_arrays_and_names import get_images_arrays_and_names
from src.get_single_image_array_and_name import get_single_image_array_and_name

router = APIRouter()

# Store active WebSocket connections
active_connections = []


@router.websocket("/ws/progress")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Keep connection alive until client disconnects
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        active_connections.remove(websocket)


async def send_progress_update(progress_percentage, message=""):
    """Send progress updates to all connected clients"""
    if active_connections:
        for connection in active_connections:
            try:
                await connection.send_json(
                    {"progress": progress_percentage, "message": message}
                )
            except Exception:
                # Handle any connection errors silently
                pass


# Process a single image and return its metrics
def process_single_image(args):
    index, uri, mask_detector, tiled_uri, data_local_path, DEV_MODE = args
    try:
        # Get the image array and name
        image_array, image_name = get_single_image_array_and_name(
            uri, mask_detector, tiled_uri, data_local_path, DEV_MODE
        )

        # Calculate metrics
        max_intensity = np.nanmax(image_array)
        avg_intensity = np.nanmean(image_array)

        return index, max_intensity, avg_intensity, image_name, True
    except Exception as e:
        print(f"Error processing image {index}: {str(e)}")
        return index, 0.0, 0.0, f"Error: {uri}", False


# @router.get("/api/raw-data-overview")
# async def create_raw_data_overview():
#     results_get_initial_scans = await get_initial_scans()

#     num_of_files = results_get_initial_scans["num_of_files"]
#     all_files_uris = results_get_initial_scans["all_files_uris"]
#     mask_detector = results_get_initial_scans["mask_detector"]
#     tiled_uri = results_get_initial_scans["tiled_uri"]
#     data_local_path = results_get_initial_scans["data_local_path"]
#     DEV_MODE = results_get_initial_scans["DEV_MODE"]

#     # Send initial progress
#     await send_progress_update(0, f"Processing 0/{num_of_files} images")

#     # Preallocate arrays for efficiency
#     max_intensities = np.zeros(num_of_files, dtype=float)
#     avg_intensities = np.zeros(num_of_files, dtype=float)
#     image_names = []

#     # Chunk processing to manage memory and provide progress updates
#     chunk_size = 10  # Adjust based on your memory constraints
#     for chunk_start in range(0, num_of_files, chunk_size):
#         chunk_end = min(chunk_start + chunk_size, num_of_files)
#         chunk_indices = list(range(chunk_start, chunk_end))

#         # Batch process images in the current chunk
#         image_arrays, chunk_image_names = get_images_arrays_and_names(
#             all_files_uris,
#             chunk_indices,
#             mask_detector,
#             tiled_uri,
#             data_local_path,
#             DEV_MODE,
#             {},  # accumulated_data can be an empty dict for batch processing
#             initialization_mode=True,
#         )

#         # Compute max and average intensities for the chunk
#         max_intensities[chunk_start:chunk_end] = np.nanmax(image_arrays, axis=(1, 2))
#         avg_intensities[chunk_start:chunk_end] = np.nanmean(image_arrays, axis=(1, 2))
#         image_names.extend(chunk_image_names)

#         # Calculate and send progress update
#         progress = ((chunk_end) / num_of_files) * 100
#         await send_progress_update(
#             progress, f"Processing {chunk_end}/{num_of_files} images"
#         )

#     # Prepare serializable data
#     serializable_data = {
#         "max_intensities": max_intensities.tolist(),
#         "avg_intensities": avg_intensities.tolist(),
#         "image_names": image_names,
#     }

#     # Send completion notification
#     await send_progress_update(100, "Data processing complete")

#     # Pack data using msgpack
#     packed_data = msgpack.packb(serializable_data, use_bin_type=True)

#     return Response(content=packed_data, media_type="application/octet-stream")


@router.get("/api/raw-data-overview")
async def create_raw_data_overview():
    results_get_initial_scans = await get_initial_scans()

    num_of_files = results_get_initial_scans["num_of_files"]
    all_files_uris = results_get_initial_scans["all_files_uris"]
    mask_detector = results_get_initial_scans["mask_detector"]
    tiled_uri = results_get_initial_scans["tiled_uri"]
    data_local_path = results_get_initial_scans["data_local_path"]
    DEV_MODE = results_get_initial_scans["DEV_MODE"]

    # Send initial progress
    await send_progress_update(0, f"Initializing processing for {num_of_files} images")

    # Preallocate arrays for efficiency
    max_intensities = np.zeros(num_of_files, dtype=float)
    avg_intensities = np.zeros(num_of_files, dtype=float)
    image_names = [""] * num_of_files  # Pre-allocate with empty strings

    # Prepare arguments for the worker function
    args_list = [
        (i, all_files_uris[i], mask_detector, tiled_uri, data_local_path, DEV_MODE)
        for i in range(num_of_files)
    ]

    # Process images with a thread pool
    processed_count = 0
    max_workers = 16  # Adjust based on your server capabilities

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_index = {
            executor.submit(process_single_image, args): args[0] for args in args_list
        }

        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_index):
            index, max_intensity, avg_intensity, image_name, success = future.result()

            if success:
                max_intensities[index] = max_intensity
                avg_intensities[index] = avg_intensity
                image_names[index] = image_name

            # Update progress
            processed_count += 1
            progress = (processed_count / num_of_files) * 100
            await send_progress_update(
                progress, f"Processing {processed_count}/{num_of_files} images"
            )

    # Prepare serializable data
    serializable_data = {
        "max_intensities": max_intensities.tolist(),
        "avg_intensities": avg_intensities.tolist(),
        "image_names": image_names,
    }

    # Send completion notification
    await send_progress_update(100, "Data processing complete")

    # Pack data using msgpack
    packed_data = msgpack.packb(serializable_data, use_bin_type=True)

    return Response(content=packed_data, media_type="application/octet-stream")
