# ------------------------------------------------------------------------------
# BACKEND DOCKERFILE
# This file defines how to build the Python FastAPI backend container
# ------------------------------------------------------------------------------

# Start with the official Python image
# python:3.13-slim provides Python 3.13 with minimal OS dependencies
# Using slim reduces the image size compared to the full Python image
FROM python:3.13-slim

# Set the working directory inside the container
# All subsequent commands will be run from this directory
WORKDIR /app

# Copy only the requirements file first
# This takes advantage of Docker's layer caching
# If requirements.txt doesn't change, Docker will reuse the cached dependencies
COPY requirements.txt .
# Install Python dependencies specified in requirements.txt
# --no-cache-dir reduces the image size by not storing the pip cache
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
# This step is done after installing dependencies for better caching
# When you change your code but not requirements.txt, only this layer is rebuilt
COPY . .

# Inform Docker that the container will listen on port 8000
# This is for documentation - it doesn't actually publish the port
EXPOSE 8000

# Define the command to run the FastAPI application
# uvicorn is the ASGI server that will run your FastAPI app
# --host 0.0.0.0 makes the server available to all network interfaces
# --port 8000 specifies the port the server will listen on
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
