from pathlib import Path
from fastapi import APIRouter
from backend.app.services.file_service import load_csv
from backend.app.services.search import search_data
from backend.app.services.filter import filter_by_column, filter_numeric_range

router = APIRouter(prefix="", tags=["Data Analysis & Search"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

@router.get("/analysis")
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


@router.get("/search")
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


@router.get("/filter")
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