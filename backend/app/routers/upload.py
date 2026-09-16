import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File
from backend.app.services.file_service import load_csv

router = APIRouter(prefix="", tags=["Upload & Preview"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

@router.post("/upload")
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


@router.get("/preview")
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