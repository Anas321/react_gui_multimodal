import msgpack
import numpy as np
import plotly.graph_objects as go
from fastapi import APIRouter
from fastapi.responses import Response
from plotly.subplots import make_subplots
from routers.initial_scans_fetching import get_initial_scans

router = APIRouter()


@router.get("/scatter-subplot")
async def create_scatter_subplot(left_image_index: int = 0, right_image_index: int = 1):

    scans = await get_initial_scans(
        left_image_index=left_image_index, right_image_index=right_image_index
    )

    # Convert arrays to NumPy
    scatter_image_array_1 = np.array(scans["scatter_image_array_1_full_res"])
    scatter_image_array_2 = np.array(scans["scatter_image_array_2_full_res"])

    # print("num_of_files: ", num_of_files)

    # Compute absolute difference
    difference_array = scatter_image_array_1 - scatter_image_array_2

    scatter_image_array_1 = scatter_image_array_1.astype(np.float32)
    scatter_image_array_2 = scatter_image_array_2.astype(np.float32)
    difference_array = difference_array.astype(np.float32)

    zmin = float(min(np.min(scatter_image_array_1), np.min(scatter_image_array_2)))
    zmax = float(max(np.max(scatter_image_array_1), np.max(scatter_image_array_2)))

    # Divergent color scale for the difference plot
    diff_min = float(-max(abs(np.min(difference_array)), abs(np.max(difference_array))))
    diff_max = float(max(abs(np.min(difference_array)), abs(np.max(difference_array))))

    # diff_min = float(np.min(difference_array))
    # diff_max = float(np.max(difference_array))

    # Create the subplots figure
    scatter_subplot_fig = make_subplots(
        rows=1,
        cols=3,
        shared_xaxes=True,
        shared_yaxes=True,
        horizontal_spacing=0.1,  # Adjust spacing between subplots
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
            colorscale="RdBu",
            coloraxis="coloraxis2",  # Use shared color axis
        ),
        row=1,
        col=3,
    )

    # Update layout for the subplots, setting zmin and zmax for coloraxis
    scatter_subplot_fig.update_layout(
        coloraxis=dict(
            colorscale="viridis",
            cmin=zmin,
            cmax=zmax,
            colorbar=dict(
                len=1.0,  # Adjust the height of the colorbar
                thickness=30,  # Adjust the thickness of the colorbar
                x=0.63,  # Position it to the right of the subplots
                xanchor="left",
                tickfont=dict(
                    size=19, color="black"
                ),  # Adjust the font size of the colorbar ticks
            ),
        ),
        coloraxis2=dict(
            colorscale="RdBu",
            cmin=diff_min,
            cmax=diff_max,
            cmid=0,
            colorbar=dict(
                len=1.0,  # Adjust the height of the colorbar
                thickness=30,  # Adjust the thickness of the colorbar
                x=1.01,  # Position it to the right of the subplots
                xanchor="left",
                tickfont=dict(
                    size=19, color="black"
                ),  # Adjust the font size of the colorbar ticks
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
    )

    # Update x-axes matching explicitly
    scatter_subplot_fig.update_layout(
        xaxis=dict(
            domain=[0, 0.26666666666666666],
            anchor="y",
        ),
        xaxis2=dict(
            domain=[0.36666666666666666, 0.63333333333333333],
            anchor="y2",
            matches="x",  # Match with first x-axis
        ),
        xaxis3=dict(
            domain=[0.73333333333333333, 1],
            anchor="y3",
            matches="x",  # Match with first x-axis
        ),
        yaxis=dict(
            autorange="reversed",
            domain=[0, 1],
            anchor="x",
            scaleanchor="x",
            showgrid=False,
            zeroline=False,
            showticklabels=False,
        ),
        yaxis2=dict(
            autorange="reversed",
            domain=[0, 1],
            anchor="x2",
            matches="y",  # Match with first y-axis
            showgrid=False,
            zeroline=False,
            showticklabels=False,
        ),
        yaxis3=dict(
            autorange="reversed",
            domain=[0, 1],
            anchor="x3",
            matches="y",  # Match with first y-axis
            showgrid=False,
            zeroline=False,
            showticklabels=False,
        ),
    )

    # Serialize arrays to bytes
    array_1_bytes = scatter_image_array_1.tobytes()
    array_2_bytes = scatter_image_array_2.tobytes()
    # diff_bytes = difference_array.tobytes()

    # Prepare metadata for reconstruction
    metadata = {
        "shape_1": scatter_image_array_1.shape,
        "dtype_1": str(scatter_image_array_1.dtype),
        "shape_2": scatter_image_array_2.shape,
        "dtype_2": str(scatter_image_array_2.dtype),
        "plotly": scatter_subplot_fig.to_plotly_json(),  # Serialize Plotly structure
    }

    # Pack metadata and binary data
    packed_data = msgpack.packb(
        {
            "metadata": metadata,
            "array_1": msgpack.ExtType(1, array_1_bytes),
            "array_2": msgpack.ExtType(2, array_2_bytes),
        }
    )

    return Response(content=packed_data, media_type="application/octet-stream")
