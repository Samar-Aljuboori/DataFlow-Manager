from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.app.services.file_service import load_csv, save_excel

router = APIRouter(prefix="", tags=["Export"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
CLEANED_DIR = DATA_DIR / "cleaned_data"

@router.get("/export/csv")
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


@router.get("/export/excel")
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