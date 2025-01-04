import numpy as np


def get_processed_image(
    image, mask_detector, image_preprocessing_store, normalize=False
):

    log_transform = image_preprocessing_store["log_scale"]
    lower_clipping_percentile = image_preprocessing_store["lower_clipping_percentile"]
    upper_clipping_percentile = image_preprocessing_store["upper_clipping_percentile"]

    # Get NaN, negative values and detector mask
    mask_neg = np.array(image < 0.0)
    mask_nan = np.isnan(image)
    mask = (mask_nan + mask_neg + mask_detector) > 0
    # mask_2 = (mask - 1) * -1

    # Apply mask
    masked_image = np.ma.array(image, mask=mask)
    # Make a writable version of the masked array
    masked_image = np.copy(masked_image)

    epsilon = 1e-6
    # Ensure no values are zero or negative before applying log
    masked_image[masked_image <= 0] = epsilon
    if log_transform:
        masked_image = np.log(masked_image + epsilon)
        # Replace or mask any NaN values that might result from log transform
        masked_image = np.nan_to_num(
            masked_image, nan=epsilon, posinf=None, neginf=None
        )
        p99 = None
    else:
        p99 = np.percentile(masked_image, upper_clipping_percentile)

    # Get percentiles
    p1 = np.percentile(masked_image, lower_clipping_percentile)
    # p99 = np.percentile(masked_image, 99)
    masked_image = np.clip(masked_image, p1, p99)

    if normalize:
        masked_image = (masked_image - np.min(masked_image)) / (
            np.max(masked_image) - np.min(masked_image)
        )

    # Apply mask
    # masked_image = (masked_image - 1.0) * (-1.0)

    return masked_image[::2, ::2]
