import sqlite3
from pathlib import Path
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routers import upload, analysis, cleaning, statistics, export

# Initialize FastAPI Application
app = FastAPI(
    title="DataFlow Manager API",
    description="Backend API layer for DataFlow Manager Engine",
    version="1.0.0"
)

# Enable CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directory setup relative to project structure
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DB_FILE = BASE_DIR / "dataflow.db"
CLEANED_DIR = DATA_DIR / "cleaned_data"

# Ensure data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
CLEANED_DIR.mkdir(parents=True, exist_ok=True)

def init_db():
    """Initialize SQLite database and ensure upload_history table exists."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS upload_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            upload_date TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

@app.on_event("startup")
def startup_event():
    """Execute database setup tasks on application startup."""
    init_db()

# Include dedicated application routers
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(cleaning.router)
app.include_router(statistics.router)
app.include_router(export.router)

# Root Health Check Endpoint
@app.get("/")
def read_root():
    """Health check endpoint to verify API availability."""
    return {
        "status": "online",
        "message": "Welcome to DataFlow Manager"
    }

# Upload History Retrieval Endpoint (Calculates file stats dynamically on the fly)
@app.get("/history")
def get_upload_history():
    """Retrieve all file upload history records and dynamically compute file stats from disk."""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT filename, upload_date FROM upload_history ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        
        history_list = []
        for row in rows:
            filename = row[0]
            upload_date = row[1]
            file_path = DATA_DIR / filename
            
            size_str = "N/A"
            rows_count = 0
            cols_count = 0
            preview_data = []
            
            # Dynamically read file stats if the file exists physically
            if file_path.exists():
                try:
                    size_bytes = file_path.stat().st_size
                    size_str = f"{size_bytes / 1024:.2f} KB" if size_bytes < 1024 * 1024 else f"{size_bytes / (1024 * 1024):.2f} MB"
                    
                    if filename.endswith(".csv"):
                        df = pd.read_csv(file_path)
                    elif filename.endswith((".xls", ".xlsx")):
                        df = pd.read_excel(file_path)
                    else:
                        df = pd.DataFrame()
                    
                    if not df.empty:
                        df = df.dropna(how="all").dropna(how="all", axis=1)
                        rows_count = int(df.shape[0])
                        cols_count = int(df.shape[1])
                        df_clean = df.head(5).replace([np.nan, np.inf, -np.inf], "").fillna("")
                        preview_data = df_clean.to_dict(orient="records")
                except Exception as file_err:
                    print(f"Could not read file stats for {filename}: {file_err}")

            history_list.append({
                "filename": filename,
                "upload_date": upload_date,
                "size": size_str,
                "rowsCount": rows_count,
                "colsCount": cols_count,
                "data": preview_data
            })
        
        return {"history": history_list}
    except Exception as e:
        return {"history": [], "error": str(e)}

# Clear All Upload History Endpoint
@app.delete("/history", status_code=status.HTTP_200_OK)
def clear_all_history():
    """Delete all records from the upload history table in SQLite database."""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM upload_history")
        conn.commit()
        conn.close()
        
        return {
            "status": "success",
            "message": "All upload history has been successfully deleted from database."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while clearing history: {str(e)}"
        )

# Delete Single File from History Endpoint
@app.delete("/history/{filename}", status_code=status.HTTP_200_OK)
def delete_single_file(filename: str):
    """Delete a specific file record from the upload history table by filename."""
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM upload_history WHERE filename = ?", (filename,))
        file_item = cursor.fetchone()
        
        if not file_item:
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File '{filename}' not found in upload history."
            )

        cursor.execute("DELETE FROM upload_history WHERE filename = ?", (filename,))
        conn.commit()
        conn.close()

        return {
            "status": "success",
            "message": f"File '{filename}' has been successfully deleted.",
            "filename": filename
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting file '{filename}': {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)