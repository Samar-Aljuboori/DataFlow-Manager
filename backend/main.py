import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File
from file_manager import load_csv, save_csv
from analyzer import analyze_dataset
from cleaner import clean_data, rename_columns, remove_columns

# Initialize FastAPI Application
app = FastAPI(
    title="DataFlow Manager API",
    description="REST API layer for DataFlow Manager Core Engine",
    version="1.0.0"
)

# Define Data Directories
DATA_DIR = Path("../data")
CLEANED_DIR = Path("../data/cleaned_data")

DATA_DIR.mkdir(parents=True, exist_ok=True)
CLEANED_DIR.mkdir(parents=True, exist_ok=True)

# Root Endpoint
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "DataFlow Manager API is running successfully!"
    }

# File Upload Endpoint (Stage 23)
@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    """
    Upload a CSV dataset to the backend server.
    """
    try:
        file_path = DATA_DIR / file.filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "status": "success",
            "filename": file.filename,
            "saved_path": str(file_path),
            "message": "File uploaded successfully! You can now pass this path to /pipeline/run"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to upload file: {str(e)}"
        }

# Dynamic Pipeline Execution Endpoint
@app.post("/pipeline/run")
def run_pipeline_api(filename: str = "sample_data.csv"):
    """
    Execute the complete data processing pipeline on any uploaded dataset:
    1. Resolve File Paths Dynamically
    2. Load Raw CSV
    3. Analyze & Clean Dataset
    4. Export Cleaned Dataset
    """
    try:
        input_path = DATA_DIR / filename
        output_path = CLEANED_DIR / f"cleaned_{filename}"

        # 1. Check if file exists
        if not input_path.exists():
            return {
                "status": "error",
                "message": f"File '{filename}' not found in data directory. Please upload it first via /upload"
            }

        # 2. Load & Clean Data
        df_raw = load_csv(str(input_path))
        df_cleaned = clean_data(str(input_path))

        # 3. Save Cleaned Output
        save_csv(df_cleaned, str(output_path))

        return {
            "status": "success",
            "message": "Pipeline execution completed successfully!",
            "input_file": filename,
            "cleaned_file_path": str(output_path)
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Pipeline execution failed: {str(e)}"
        }