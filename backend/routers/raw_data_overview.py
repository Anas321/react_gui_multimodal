# import msgpack
# import numpy as np
# from fastapi import APIRouter
# from fastapi.responses import Response
# from routers.initial_scans_fetching import get_initial_scans
# from src.get_images_arrays_and_names import get_images_arrays_and_names

# router = APIRouter()


# @router.get("/raw-data-overview")
# async def create_raw_data_overview():
#     results_get_initial_scans = await get_initial_scans()

#     num_of_files = results_get_initial_scans["num_of_files"]
#     all_files_uris = results_get_initial_scans["all_files_uris"]
#     mask_detector = results_get_initial_scans["mask_detector"]
#     tiled_uri = results_get_initial_scans["tiled_uri"]
#     data_local_path = results_get_initial_scans["data_local_path"]
#     DEV_MODE = results_get_initial_scans["DEV_MODE"]

#     accumulated_data = {
#         "max_intensities": [],
#         "avg_intensities": [],
#         "image_names": [],
#     }

#     for i in range(num_of_files):

#         image_array_full_res, image_name = get_images_arrays_and_names(
#             all_files_uris,
#             [i],
#             mask_detector,
#             tiled_uri,
#             data_local_path,
#             DEV_MODE,
#             accumulated_data,
#             initialization_mode=True,
#         )

#         # Convert NumPy types to Python native types
#         max_intensity = float(np.nanmax(image_array_full_res))
#         avg_intensity = float(np.nanmean(image_array_full_res))

#         accumulated_data["max_intensities"].append(max_intensity)
#         accumulated_data["avg_intensities"].append(avg_intensity)
#         accumulated_data["image_names"].append(image_name)

#     print("Inside create_raw_data_overview")
#     print(accumulated_data["image_names"][:5])
#     print(accumulated_data["max_intensities"][:5])
#     print(accumulated_data["avg_intensities"][:5])

#     # Convert any remaining NumPy values to Python native types
#     serializable_data = {
#         "max_intensities": [float(x) for x in accumulated_data["max_intensities"]],
#         "avg_intensities": [float(x) for x in accumulated_data["avg_intensities"]],
#         "image_names": accumulated_data["image_names"],
#     }

#     packed_data = msgpack.packb(serializable_data, use_bin_type=True)

#     return Response(content=packed_data, media_type="application/octet-stream")


import msgpack
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from routers.initial_scans_fetching import get_initial_scans
from src.get_images_arrays_and_names import get_images_arrays_and_names

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


@router.get("/api/raw-data-overview")
async def create_raw_data_overview():
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

    # Send initial progress
    await send_progress_update(0, f"Processing 0/{num_of_files} images")

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

        # Calculate and send progress update after each image is processed
        progress = ((i + 1) / num_of_files) * 100
        await send_progress_update(progress, f"Processing {i+1}/{num_of_files} images")

    # Convert any remaining NumPy values to Python native types
    serializable_data = {
        "max_intensities": [float(x) for x in accumulated_data["max_intensities"]],
        "avg_intensities": [float(x) for x in accumulated_data["avg_intensities"]],
        "image_names": accumulated_data["image_names"],
    }

    # Send completion notification
    await send_progress_update(100, "Data processing complete")

    packed_data = msgpack.packb(serializable_data, use_bin_type=True)

    return Response(content=packed_data, media_type="application/octet-stream")
