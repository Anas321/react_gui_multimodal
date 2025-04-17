import os

# import fabio
import h5py
import numpy as np
from PIL import Image


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

    return files_names, mask_detector
