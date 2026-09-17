import shutil
import numpy as np
from pathlib import Path
from fastapi import APIRouter, UploadFile, File
import pandas as pd
import io
from backend.app.services.file_service import load_csv

router = APIRouter(prefix="", tags=["Upload & Preview"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

def find_smart_header(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Dynamically locates the first non-empty header row in any dataset."""
    # Find the index of the first row that is not completely empty/null
    first_valid_row_idx = df_raw.dropna(how="all").index[0]
    
    # If the first row contains 'Unnamed' headers, shift header to the first populated row
    if any(str(col).startswith("Unnamed") for col in df_raw.columns):
        # Extract row as new columns header
        new_header = df_raw.iloc[first_valid_row_idx]
        df_cleaned = df_raw.iloc[first_valid_row_idx + 1:].copy()
        df_cleaned.columns = new_header
        return df_cleaned.reset_index(drop=True)
    
    return df_raw

@router.post("/upload")
def upload_file(file: UploadFile = File(...)):
    """Upload any dataset and dynamically extract headers and preview rows."""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        file_path = DATA_DIR / file.filename

        # Save incoming file payload locally
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Handle CSV Files
        if file.filename.endswith(".csv"):
            df = load_csv(str(file_path))

        # 2. Handle Excel Files (.xls, .xlsx)
        elif file.filename.endswith((".xls", ".xlsx")):
            excel_file = pd.ExcelFile(file_path)
            
            # Dynamically select the first non-empty worksheet
            selected_sheet = excel_file.sheet_names[0]
            for sheet in excel_file.sheet_names:
                temp_df = pd.read_excel(file_path, sheet_name=sheet)
                if not temp_df.empty and temp_df.dropna(how="all").shape[0] > 0:
                    selected_sheet = sheet
                    break

            # Read selected sheet raw data
            df_raw = pd.read_excel(file_path, sheet_name=selected_sheet)
            
            # Apply dynamic smart header resolution algorithm
            df = find_smart_header(df_raw)

        else:
            return {"status": "error", "message": "Unsupported file format. Please upload CSV or Excel."}

        # 3. Comprehensive sanitization for JSON compliance
        # Replace infinity and NaN float types with empty strings
        df_clean = df.head(5).replace([np.nan, np.inf, -np.inf], "").fillna("")

        # Sanitize column headers (convert to string and replace Unnamed labels)
        sanitized_columns = [
            "" if str(col).startswith("Unnamed") else str(col)
            for col in df_clean.columns
        ]
        df_clean.columns = sanitized_columns

        return {
            "status": "success",
            "filename": file.filename,
            "saved_path": str(file_path),
            "message": "File uploaded successfully!",
            "columns": sanitized_columns,
            "data": df_clean.to_dict(orient="records")
        }

    except Exception as e:
        return {"status": "error", "message": f"Failed to process file: {str(e)}"}