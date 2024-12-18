import msgpack
import numpy as np
import plotly.graph_objects as go
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from plotly.subplots import make_subplots

from backend.routers.initial_scans_fetching import get_initial_scans

router = APIRouter()


@router.get("/scatter-subplot")
def create_scatter_subplot(scans=Depends(get_initial_scans)):

    # scatter_image_array_1 = np.array(scans["scatter_image_array_1_full_res"])
    # scatter_image_array_2 = np.array(scans["scatter_image_array_2_full_res"])

    # Convert arrays to NumPy
    scatter_image_array_1 = np.array(scans["scatter_image_array_1_full_res"])
    scatter_image_array_2 = np.array(scans["scatter_image_array_2_full_res"])

    # Compute absolute difference
    abs_difference_array = np.abs(scatter_image_array_1 - scatter_image_array_2)

    # scatter_image_array_1 = scatter_image_array_1.astype(np.uint8)
    # scatter_image_array_2 = scatter_image_array_2.astype(np.uint8)
    # abs_difference_array = abs_difference_array.astype(np.uint8)

    scatter_image_array_1 = scatter_image_array_1.astype(np.float32)
    scatter_image_array_2 = scatter_image_array_2.astype(np.float32)
    abs_difference_array = abs_difference_array.astype(np.float32)

    zmin = float(min(np.min(scatter_image_array_1), np.min(scatter_image_array_2)))
    zmax = float(max(np.max(scatter_image_array_1), np.max(scatter_image_array_2)))

    # Create the subplots figure
    scatter_subplot_fig = make_subplots(
        rows=1,
        cols=3,
        shared_xaxes=True,
        shared_yaxes=True,
        horizontal_spacing=0.05,  # Adjust spacing between subplots
    )

    # Add the scatter image figures to the subplots with a shared coloraxis
    scatter_subplot_fig.add_trace(
        go.Heatmap(
            # z=scatter_image_array_1.tolist(),
            z=[],
            colorscale="viridis",
            coloraxis="coloraxis",  # Use shared color axis
        ),
        row=1,
        col=1,
    )
    scatter_subplot_fig.add_trace(
        go.Heatmap(
            z=[],
            colorscale="viridis",
            coloraxis="coloraxis",  # Use shared color axis
        ),
        row=1,
        col=2,
    )

    scatter_subplot_fig.add_trace(
        go.Heatmap(
            z=[],  # Add the absolute difference heatmap
            colorscale="viridis",
            coloraxis="coloraxis",  # Use shared color axis
        ),
        row=1,
        col=3,
    )

    # Update layout for the subplots, setting zmin and zmax for coloraxis
    scatter_subplot_fig.update_layout(
        annotations=[
            dict(
                text="|Difference|",  # Title for the third image
                x=0.5,  # Center of the x-axis for the third subplot
                y=1.06,  # Slightly above the plot
                xref="x3 domain",  # Reference the x domain of the third subplot
                yref="paper",  # Reference the y domain of the entire figure
                showarrow=False,
                font=dict(size=18, color="black"),
            ),
        ],
        coloraxis=dict(
            colorscale="viridis",
            cmin=zmin,
            cmax=zmax,
            colorbar=dict(
                len=1.0,  # Adjust the height of the colorbar
                thickness=30,  # Adjust the thickness of the colorbar
                x=1.05,  # Position it to the right of the subplots
                xanchor="left",
            ),
        ),
        yaxis=dict(autorange="reversed"),  # Reverse y-axis
        yaxis2=dict(autorange="reversed"),
        yaxis3=dict(autorange="reversed"),
        margin=dict(l=20, r=60, b=20, t=20),
        plot_bgcolor="rgba(0,0,0,0)",  # Transparent background
        paper_bgcolor="rgba(0,0,0,0)",  # Transparent paper background
    )
    scatter_subplot_fig.update_xaxes(
        showticklabels=False,
        showgrid=False,
        zeroline=False,
        matches="x",
        scaleanchor="y",
    )
    scatter_subplot_fig.update_yaxes(
        showticklabels=False,
        showgrid=False,
        zeroline=False,
    )

    # Serialize arrays to bytes
    array_1_bytes = scatter_image_array_1.tobytes()
    array_2_bytes = scatter_image_array_2.tobytes()
    abs_diff_bytes = abs_difference_array.tobytes()

    # Prepare metadata for reconstruction
    metadata = {
        "shape_1": scatter_image_array_1.shape,
        "dtype_1": str(scatter_image_array_1.dtype),
        "shape_2": scatter_image_array_2.shape,
        "dtype_2": str(scatter_image_array_2.dtype),
        "shape_diff": abs_difference_array.shape,
        "dtype_diff": str(abs_difference_array.dtype),
        "zmin": zmin,
        "zmax": zmax,
        "plotly": scatter_subplot_fig.to_plotly_json(),  # Serialize Plotly structure
    }

    print(metadata["dtype_1"])

    # Pack metadata and binary data
    packed_data = msgpack.packb(
        {
            "metadata": metadata,
            "array_1": msgpack.ExtType(1, array_1_bytes),
            "array_2": msgpack.ExtType(2, array_2_bytes),
            "array_diff": msgpack.ExtType(3, abs_diff_bytes),
        }
    )

    return Response(content=packed_data, media_type="application/octet-stream")
