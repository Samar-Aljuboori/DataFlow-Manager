import shutil
from pathlib import Path
from fastapi import FastAPI, UploadFile, File


# Import core engine modules with exact signatures
from cleaner import clean_data, rename_columns, remove_columns
from search import search_data
from filter import filter_by_column, filter_numeric_range
from statistics import get_mean, get_median, get_min, get_max, get_count

# Import file handling utilities including Excel saver
from file_manager import load_csv, save_csv, load_excel, save_excel

# Import HTTP exceptions and specialized file response handlers for file export/download endpoints
from fastapi import HTTPException  # For HTTP error handling (e.g. 404)
from fastapi.responses import FileResponse  # For file streaming and downloads (not as JSON File )

# Initialize FastAPI Application
app = FastAPI(
    title="DataFlow Manager API",
    description="Backend API layer for DataFlow Manager Engine",
    version="1.0.0"
)

# Base directory setup relative to project structure
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CLEANED_DIR = DATA_DIR / "cleaned_data"

# Ensure data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
CLEANED_DIR.mkdir(parents=True, exist_ok=True)


# Root Health Check Endpoint
@app.get("/")
def read_root():
    """Health check endpoint to verify API availability."""
    return {
        "status": "online",
        "message": "Welcome to DataFlow Manager"
    }


# File Upload Endpoint
@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    """Upload CSV datasets to the data directory."""
    try:
        file_path = DATA_DIR / file.filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "status": "success",
            "filename": file.filename,
            "saved_path": str(file_path),
            "message": "File uploaded successfully!"
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to upload file: {str(e)}"}


# Dataset Preview Endpoint
@app.get("/preview")
def preview_dataset(filename: str = "sample_data.csv", rows: int = 10):
    """Preview the first N rows of a dataset."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))
        df_preview = df.head(rows)

        return {
            "status": "success",
            "filename": filename,
            "preview_rows": len(df_preview),
            "columns": list(df.columns),
            "data": df_preview.to_dict(orient="records")
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to preview data: {str(e)}"}


# Dataset Overview & Structure Endpoint
@app.get("/analysis")
def get_dataset_analysis(filename: str = "sample_data.csv"):
    """Retrieve statistical summary, shape, missing values, and duplicates."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))

        return {
            "status": "success",
            "filename": filename,
            "analysis": {
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": list(df.columns),
                "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "missing_values": df.isnull().sum().to_dict(),
                "duplicate_rows": int(df.duplicated().sum())
            }
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to perform analysis: {str(e)}"}


# Full Automated Data Cleaning Pipeline Endpoint
@app.post("/pipeline/run")
def run_pipeline_api(filename: str = "sample_data.csv"):
    """Execute the complete data cleaning pipeline and export result."""
    try:
        input_path = DATA_DIR / filename
        output_path = CLEANED_DIR / f"cleaned_{filename}"

        df_cleaned = clean_data(str(input_path))
        save_csv(df_cleaned, str(output_path))

        return {
            "status": "success",
            "message": "Pipeline execution completed successfully!",
            "cleaned_file_path": str(output_path)
        }
    except Exception as e:
        return {"status": "error", "message": f"Pipeline execution failed: {str(e)}"}


# Remove Duplicates Endpoint
@app.post("/clean/remove-duplicates")
def remove_duplicates_endpoint(filename: str = "sample_data.csv"):
    """Drop duplicate rows from the dataset."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))

        df_cleaned = df.drop_duplicates()
        save_csv(df_cleaned, str(file_path))

        return {
            "status": "success",
            "message": "Duplicate rows removed successfully."
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to remove duplicates: {str(e)}"}


# Fill Missing Values Endpoint
@app.post("/clean/fill-missing")
def fill_missing_endpoint(fill_value: str = "Unknown", filename: str = "sample_data.csv"):
    """Fill missing or NaN values across dataset columns."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))

        df_cleaned = df.fillna(fill_value)
        save_csv(df_cleaned, str(file_path))

        return {
            "status": "success",
            "message": f"Missing values filled with '{fill_value}' successfully."
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to fill missing values: {str(e)}"}


# Rename Column Endpoint
@app.post("/clean/rename-column")
def rename_column_endpoint(old_name: str, new_name: str, filename: str = "sample_data.csv"):
    """Rename a specific column in the dataset."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))

        df_updated = rename_columns(df, {old_name: new_name})
        save_csv(df_updated, str(file_path))

        return {
            "status": "success",
            "message": f"Renamed column '{old_name}' to '{new_name}' successfully."
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to rename column: {str(e)}"}


# Remove Column Endpoint
@app.post("/clean/remove-column")
def remove_column_endpoint(column_name: str, filename: str = "sample_data.csv"):
    """Remove a target column from the dataset."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))

        df_updated = remove_columns(df, [column_name])
        save_csv(df_updated, str(file_path))

        return {
            "status": "success",
            "message": f"Removed column '{column_name}' successfully."
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to remove column: {str(e)}"}


# Search Dataset Endpoint
@app.get("/search")
def search_endpoint(query: str, case_sensitive: bool = False, filename: str = "sample_data.csv"):
    """Search for matching records across all columns in dataset."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))

        results_df = search_data(df, query=query, case_sensitive=case_sensitive)

        return {
            "status": "success",
            "query": query,
            "results_count": len(results_df),
            "data": results_df.to_dict(orient="records")
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to search: {str(e)}"}


# Filter Dataset Endpoint
@app.get("/filter")
def filter_endpoint(
    column: str,
    value: str = None,
    min_val: float = None,
    max_val: float = None,
    case_sensitive: bool = False,
    filename: str = "sample_data.csv"
):
    """Filter records by specific column value or numeric range."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))

        if min_val is not None or max_val is not None:
            filtered_df = filter_numeric_range(df, column_name=column, min_val=min_val, max_val=max_val)
        else:
            filtered_df = filter_by_column(df, column_name=column, value=value, case_sensitive=case_sensitive)

        return {
            "status": "success",
            "column": column,
            "results_count": len(filtered_df),
            "data": filtered_df.to_dict(orient="records")
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to filter data: {str(e)}"}


# Calculate Column / Dataset Statistics Endpoint
@app.get("/statistics")
def get_statistics(column: str = None, filename: str = "sample_data.csv"):
    """Compute summary statistics for a column or the full dataset."""
    try:
        file_path = DATA_DIR / filename
        df = load_csv(str(file_path))

        if column:
            return {
                "status": "success",
                "column": column,
                "statistics": {
                    "mean": get_mean(df, column),
                    "median": get_median(df, column),
                    "min": get_min(df, column),
                    "max": get_max(df, column),
                    "count": get_count(df, column)
                }
            }

        return {
            "status": "success",
            "filename": filename,
            "statistics": df.describe(include="all").fillna("N/A").to_dict()
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to calculate statistics: {str(e)}"}

# Export CSV Endpoint
@app.get("/export/csv")
def export_csv(filename: str = "sample_data.csv"):
    """Export and download dataset directly as a CSV file."""
    file_path = DATA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="text/csv"
    )


# Export Excel Endpoint
@app.get("/export/excel")
def export_excel(filename: str = "sample_data.csv"):
    """Convert CSV dataset to Excel format (.xlsx) and download."""
    file_path = DATA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    try:
        df = load_csv(str(file_path))
        excel_filename = file_path.stem + ".xlsx"
        excel_path = CLEANED_DIR / excel_filename

        save_excel(df, str(excel_path))

        return FileResponse(
            path=str(excel_path),
            filename=excel_filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export Excel file: {str(e)}")