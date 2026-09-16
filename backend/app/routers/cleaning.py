from pathlib import Path
from fastapi import APIRouter
from backend.app.services.cleaner import clean_data, rename_columns, remove_columns
from backend.app.services.file_service import load_csv, save_csv

router = APIRouter(prefix="", tags=["Data Cleaning"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
CLEANED_DIR = DATA_DIR / "cleaned_data"

@router.post("/pipeline/run")
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


@router.post("/clean/remove-duplicates")
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


@router.post("/clean/fill-missing")
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


@router.post("/clean/rename-column")
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


@router.post("/clean/remove-column")
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