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

# Preview Dataset Endpoint (Stage 24)
@app.get("/preview")
def preview_dataset(filename: str = "sample_data.csv", rows: int = 10):
    """
    Get the first N rows of a dataset for quick preview.
    """
    try:
        file_path = DATA_DIR / filename

        # 1. Check if file exists
        if not file_path.exists():
            return {
                "status": "error",
                "message": f"File '{filename}' not found. Please upload it first."
            }

        # 2. Load dataset and slice first N rows
        df = load_csv(str(file_path))
        df_preview = df.head(rows)

        # 3. Convert DataFrame to dict (JSON friendly format)
        preview_data = df_preview.to_dict(orient="records")

        return {
            "status": "success",
            "filename": filename,
            "preview_rows": len(preview_data),
            "columns": list(df.columns),
            "data": preview_data
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to generate preview: {str(e)}"
        }

# Analysis Endpoint 
@app.get("/analysis")
def get_dataset_analysis(filename: str = "sample_data.csv"):
    """
    Get detailed structural analysis of a dataset:
    - Number of rows and columns
    - Data types per column
    - Missing values count per column
    - Total duplicate rows
    """
    try:
        file_path = DATA_DIR / filename

        if not file_path.exists():
            return {
                "status": "error",
                "message": f"File '{filename}' not found. Please upload it first."
            }

        df = load_csv(str(file_path))

        # Perform Analysis
        data_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        missing_values = df.isnull().sum().to_dict()
        duplicate_count = int(df.duplicated().sum())

        return {
            "status": "success",
            "filename": filename,
            "rows": len(df),
            "columns": len(df.columns),
            "data_types": data_types,
            "missing_values": missing_values,
            "duplicates": duplicate_count
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to perform analysis: {str(e)}"
        }


# Clean API Endpoints

@app.post("/clean/remove-duplicates")
def remove_duplicates(filename: str = "sample_data.csv"):
    """
    Remove all duplicate rows from the dataset and save the updated file.
    """
    try:
        file_path = DATA_DIR / filename
        if not file_path.exists():
            return {"status": "error", "message": f"File '{filename}' not found."}

        df = load_csv(str(file_path))
        initial_rows = len(df)

        # Drop duplicates
        df_cleaned = df.drop_duplicates()
        removed_count = initial_rows - len(df_cleaned)

        # Save cleaned data back to CSV
        df_cleaned.to_csv(file_path, index=False)

        return {
            "status": "success",
            "message": f"Removed {removed_count} duplicate rows.",
            "remaining_rows": len(df_cleaned)
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to remove duplicates: {str(e)}"}


@app.post("/clean/remove-missing")
def remove_missing(filename: str = "sample_data.csv"):
    """
    Remove rows that contain missing values (NaN) from the dataset.
    """
    try:
        file_path = DATA_DIR / filename
        if not file_path.exists():
            return {"status": "error", "message": f"File '{filename}' not found."}

        df = load_csv(str(file_path))
        initial_rows = len(df)

        # Drop missing values
        df_cleaned = df.dropna()
        removed_count = initial_rows - len(df_cleaned)

        # Save cleaned data back to CSV
        df_cleaned.to_csv(file_path, index=False)

        return {
            "status": "success",
            "message": f"Removed {removed_count} rows with missing values.",
            "remaining_rows": len(df_cleaned)
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to remove missing values: {str(e)}"}


@app.post("/clean/fill-missing")
def fill_missing(filename: str = "sample_data.csv", value: str = "N/A"):
    """
    Fill missing values (NaN) in the dataset with a specified fallback value.
    """
    try:
        file_path = DATA_DIR / filename
        if not file_path.exists():
            return {"status": "error", "message": f"File '{filename}' not found."}

        df = load_csv(str(file_path))
        missing_before = int(df.isnull().sum().sum())

        # Fill missing values
        df_cleaned = df.fillna(value)

        # Save cleaned data back to CSV
        df_cleaned.to_csv(file_path, index=False)

        return {
            "status": "success",
            "message": f"Filled {missing_before} missing values with '{value}'.",
            "fill_value": value
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to fill missing values: {str(e)}"}


# Statistics API Endpoint 

@app.get("/statistics")
def get_statistics(filename: str = "sample_data.csv"):
    """
    Get summary statistics (mean, median, std, min, max, count) for numeric columns.
    """
    try:
        file_path = DATA_DIR / filename
        if not file_path.exists():
            return {"status": "error", "message": f"File '{filename}' not found."}

        df = load_csv(str(file_path))

        # Calculate summary statistics for numeric columns
        stats_df = df.describe()

        # Convert to dictionary format compatible with JSON
        stats_dict = stats_df.to_dict()

        return {
            "status": "success",
            "filename": filename,
            "statistics": stats_dict
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to compute statistics: {str(e)}"}


# Search API Endpoint (Universal Search)

@app.get("/search")
def search_data(query: str, filename: str = "sample_data.csv"):
    """
    Search for a query string across ALL columns (strings, numbers, dates) in the dataset.
    """
    try:
        file_path = DATA_DIR / filename
        if not file_path.exists():
            return {"status": "error", "message": f"File '{filename}' not found."}

        df = load_csv(str(file_path))

        # Create a boolean mask for rows matching the query in ANY column (converted to string)
        mask = False
        for col in df.columns:
            mask = mask | df[col].astype(str).str.contains(query, case=False, na=False)

        results_df = df[mask]

        return {
            "status": "success",
            "query": query,
            "results_count": len(results_df),
            "data": results_df.to_dict(orient="records")
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to execute search: {str(e)}"}