from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from routers import image_processing, data_fetching
from backend.routers import (
    azimuthal_integrator,
    initial_scans_fetching,
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


# Include Routers
app.include_router(initial_scans_fetching.router, prefix="/api", tags=["Initial Scans"])
app.include_router(scatter_subplot.router, prefix="/api", tags=["Scatter Images"])
app.include_router(
    azimuthal_integrator.router, prefix="/api", tags=["Azimuthal Integrator"]
)


@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Backend"}
