from pathlib import Path
from fastapi import FastAPI
from backend.app.routers import upload, analysis, cleaning, statistics, export

# Initialize FastAPI Application
app = FastAPI(
    title="DataFlow Manager API",
    description="Backend API layer for DataFlow Manager Engine",
    version="1.0.0"
)

# Base directory setup relative to project structure
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
CLEANED_DIR = DATA_DIR / "cleaned_data"

# Ensure data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
CLEANED_DIR.mkdir(parents=True, exist_ok=True)

# Include Routers
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(cleaning.router)
app.include_router(statistics.router)
app.include_router(export.router)


# Root Health Check Endpoint
@app.get("/")
def read_root():
    """Health check endpoint to verify API availability."""
    return {
        "status": "online",
        "message": "Welcome to DataFlow Manager"
    }