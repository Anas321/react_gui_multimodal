import os

# import fabio
import h5py
import numpy as np
from PIL import Image

# def pad_mask(mask, target_shape):
#     pad_height = target_shape[0] - mask.shape[0]
#     pad_width = target_shape[1] - mask.shape[1]

#     # Calculate padding for top, bottom, left, and right
#     pad_top = pad_height // 2
#     pad_bottom = pad_height - pad_top
#     pad_left = pad_width // 2
#     pad_right = pad_width - pad_left

#     padded_mask = np.pad(
#         mask, ((pad_top, pad_bottom), (pad_left, pad_right)), mode="constant"
#     )
#     return padded_mask


def get_local_files_names(
    data_local_path, data_files_type, mask_file_name, pad_mask_flag=False
):
    # Get all files with the specified data file type
    files_names = [
        f for f in os.listdir(data_local_path) if f.endswith(data_files_type)
    ]

    # Check mask is not in the files
    files_names = [file for file in files_names if file != mask_file_name]

    # Load the mask file and ensure it is a numpy array
    mask_path = os.path.join(data_local_path, mask_file_name)

    if os.path.exists(mask_path):
        # mask_detector = np.load(mask_path)
        if mask_path.endswith(".hdf"):
            with h5py.File(mask_path, "r") as f:
                # Explore the file to see what datasets it contains
                keys_list = list(f.keys())
                # Assuming the mask data is stored under a dataset name 'mask'
                mask_detector = f[keys_list[0]][:]
        elif mask_path.endswith(".tiff"):
            # Using PIL to open the tiff image
            tiff_image = Image.open(mask_path)
            mask_detector = np.array(tiff_image)
        elif mask_path.endswith(".npy"):
            mask_detector = np.load(mask_path)
    else:
        raise FileNotFoundError(f"Mask file not found at: {mask_path}")

    # if pad_mask_flag:
    #     first_file_path = os.path.join(data_local_path, files_names[2])
    #     image_array = fabio.open(first_file_path).data

    #     mask_detector = pad_mask(mask_detector, image_array.shape)

    return files_names, mask_detector
