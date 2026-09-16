from pathlib import Path
from fastapi import APIRouter
from backend.app.services.statistics import get_mean, get_median, get_min, get_max, get_count
from backend.app.services.file_service import load_csv

router = APIRouter(prefix="", tags=["Statistics"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

@router.get("/statistics")
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