from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    azimuthal_integrator,
    initial_scans_fetching,
    q_vectors,
    raw_data_overview,
    scatter_subplot,
)

app = FastAPI()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Websocket
app.include_router(raw_data_overview.router, tags=["Raw Data Overview"])


# Include Routers
app.include_router(
    initial_scans_fetching.router, prefix="/api", tags=["Initial Scans Fetching"]
)
app.include_router(scatter_subplot.router, prefix="/api", tags=["Scatter Images"])
app.include_router(
    azimuthal_integrator.router, prefix="/api", tags=["Azimuthal Integrator"]
)
app.include_router(
    azimuthal_integrator.router, prefix="/api", tags=["Azimuthal Calibration"]
)
app.include_router(q_vectors.router, prefix="/api", tags=["Q Vectors"])


@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Backend"}
