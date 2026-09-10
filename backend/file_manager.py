import os
import pandas as pd

def load_csv(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Error: The file path '{file_path}' does not exist.")

    if not file_path.endswith('.csv'):
        raise ValueError(f"Error: Unsupported file format for '{file_path}'. Only .csv is allowed.")

    try:
        df = pd.read_csv(file_path)
        if df.empty:
            raise ValueError(f"Error: The file '{file_path}' is completely empty.")
        return df
    except pd.errors.EmptyDataError:
        raise ValueError(f"Error: The file '{file_path}' is empty and contains no data.")
    except pd.errors.ParserError:
        raise ValueError(f"Error: The file '{file_path}' is corrupt or improperly formatted CSV.")


def save_csv(df, output_path):
    try:
        if df is None or df.empty:
            raise ValueError("Error: Cannot save an empty or invalid DataFrame.")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)
        print(f"File successfully saved to CSV: {output_path}")

    except Exception as e:
        print(f"Failed to save CSV file: {e}")
        raise


# ==========================================
# Excel Support Functions (Stage 13)
# ==========================================

def load_excel(file_path, sheet_name=0):
    """Loads an Excel file (.xlsx, .xls) safely into a DataFrame."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Error: The file path '{file_path}' does not exist.")

    if not (file_path.endswith('.xlsx') or file_path.endswith('.xls')):
        raise ValueError(f"Error: Unsupported file format for '{file_path}'. Only .xlsx or .xls are allowed.")

    try:
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        if df.empty:
            raise ValueError(f"Error: The Excel file '{file_path}' is completely empty.")
        return df
    except Exception as e:
        print(f"Failed to load Excel file: {e}")
        raise


def save_excel(df, output_path, sheet_name="Sheet1"):
    """Saves a DataFrame into an Excel file (.xlsx) without index."""
    try:
        if df is None or df.empty:
            raise ValueError("Error: Cannot save an empty or invalid DataFrame.")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_excel(output_path, index=False, sheet_name=sheet_name)
        print(f"File successfully saved to Excel: {output_path}")

    except Exception as e:
        print(f"Failed to save Excel file: {e}")
        raise