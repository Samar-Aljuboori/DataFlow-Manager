from fastapi import FastAPI
from file_manager import load_csv, save_csv
from analyzer import analyze_dataset
from cleaner import clean_data, rename_columns, remove_columns

# Initialize FastAPI Application
app = FastAPI(
    title="DataFlow Manager API",
    description="REST API layer for DataFlow Manager Core Engine",
    version="1.0.0"
)

# Root Endpoint
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "DataFlow Manager API is running successfully!"
    }

# Execute Full Pipeline Endpoint
@app.post("/pipeline/run")
def run_pipeline_api(input_path: str = "../data/sample_data.csv", output_path: str = "../data/cleaned_data/cleaned_data.csv"):
    """
    Execute the complete data processing pipeline:
    1. Load Raw CSV
    2. Analyze Dataset
    3. Clean Data
    4. Export Cleaned CSV
    """
    try:
        # 1. Load Data
        df_raw = load_csv(input_path)

        # 2. Clean Data
        df_cleaned = clean_data(input_path)

        # 3. Save/Export Data
        save_csv(df_cleaned, output_path)

        return {
            "status": "success",
            "message": "Pipeline execution completed successfully!",
            "input_path": input_path,
            "output_path": output_path
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Pipeline execution failed: {str(e)}"
        }