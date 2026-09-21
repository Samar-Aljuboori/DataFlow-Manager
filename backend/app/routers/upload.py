import shutil
import sqlite3
from datetime import datetime
import numpy as np
from pathlib import Path
from fastapi import APIRouter, UploadFile, File
import pandas as pd
import io
from backend.app.services.file_service import load_csv

router = APIRouter(prefix="", tags=["Upload & Preview"])

BASE_DIR = Path(__file__).resolve().parents[3] 
DATA_DIR = BASE_DIR / "data"
DB_FILE = BASE_DIR / "dataflow.db"

def find_smart_header(df_raw: pd.DataFrame) -> pd.DataFrame:
    """Dynamically locates the first non-empty header row in any dataset."""
    first_valid_row_idx = df_raw.dropna(how="all").index[0]
    
    if any(str(col).startswith("Unnamed") for col in df_raw.columns):
        new_header = df_raw.iloc[first_valid_row_idx]
        df_cleaned = df_raw.iloc[first_valid_row_idx + 1:].copy()
        df_cleaned.columns = new_header
        return df_cleaned.reset_index(drop=True)
    
    return df_raw

@router.post("/upload")
def upload_file(file: UploadFile = File(...)):
    """Upload dataset, clean headers, log metadata to SQLite, and return preview."""
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        file_path = DATA_DIR / file.filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 1. Handle CSV Files
        if file.filename.endswith(".csv"):
            df = load_csv(str(file_path))

        # 2. Handle Excel Files (.xls, .xlsx)
        elif file.filename.endswith((".xls", ".xlsx")):
            excel_file = pd.ExcelFile(file_path)
            
            selected_sheet = excel_file.sheet_names[0]
            for sheet in excel_file.sheet_names:
                temp_df = pd.read_excel(file_path, sheet_name=sheet)
                if not temp_df.empty and temp_df.dropna(how="all").shape[0] > 0:
                    selected_sheet = sheet
                    break

            df_raw = pd.read_excel(file_path, sheet_name=selected_sheet)
            df = find_smart_header(df_raw)

        else:
            return {"status": "error", "message": "Unsupported file format. Please upload CSV or Excel."}

        # -------------------------------------------------------------------
        # Clean dataset: Drop completely empty rows and columns
        # -------------------------------------------------------------------
        df = df.dropna(how="all")          # Drop empty rows
        df = df.dropna(how="all", axis=1)   # Drop empty columns

        # ===================================================================
        # Clean & Sanitize Column Names (Fix nan / Unnamed columns issue)
        # ===================================================================
        df.columns = [str(col).strip() for col in df.columns]

        valid_columns = [
            col for col in df.columns 
            if col != "" and col.lower() != "nan" and not col.startswith("Unnamed")
        ]
        
        df = df[valid_columns]

        # Calculate dataset statistics for Dashboard Cards
        total_rows = int(df.shape[0])
        total_columns = int(df.shape[1])
        missing_values = int(df.isna().sum().sum())
        duplicate_rows = int(df.duplicated().sum())

        # Comprehensive sanitization for JSON preview response
        df_clean = df.head(5).replace([np.nan, np.inf, -np.inf], "").fillna("")

        # -------------------------------------------------------------------
        # Insert file record into SQLite database (dataflow.db)
        # -------------------------------------------------------------------
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute(
                "INSERT INTO upload_history (filename, upload_date) VALUES (?, ?)",
                (file.filename, current_date)
            )
            conn.commit()
            conn.close()
        except Exception as db_err:
            print(f"Failed to record upload history: {db_err}")
        # -------------------------------------------------------------------

        return {
            "status": "success",
            "filename": file.filename,
            "saved_path": str(file_path),
            "message": "File uploaded successfully!",
            "columns": valid_columns,
            "stats": {
                "total_rows": total_rows,
                "total_columns": total_columns,
                "missing_values": missing_values,
                "duplicate_rows": duplicate_rows
            },
            "data": df_clean.to_dict(orient="records")
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to process file: {str(e)}"}