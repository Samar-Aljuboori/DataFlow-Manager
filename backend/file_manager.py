import os
import pandas as pd

def load_csv(file_path):
    # 1. Check if file path exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Error: The file path '{file_path}' does not exist.")

    # 2. Check extension (Unsupported file)
    if not file_path.endswith('.csv'):
        raise ValueError(f"Error: Unsupported file format for '{file_path}'. Only .csv is allowed.")

    try:
        # Read CSV file
        df = pd.read_csv(file_path)

        # 3. Check if file is empty
        if df.empty:
            raise ValueError(f"Error: The file '{file_path}' is completely empty.")

        return df

    except pd.errors.EmptyDataError:
        # 3. Handles empty file with no columns/header
        raise ValueError(f"Error: The file '{file_path}' is empty and contains no data.")

    except pd.errors.ParserError:
        # 4. Handles Invalid CSV formatting
        raise ValueError(f"Error: The file '{file_path}' is corrupt or improperly formatted CSV.")


def save_csv(df, output_path):
    try:
        if df is None or df.empty:
            raise ValueError("Error: Cannot save an empty or invalid DataFrame.")

        # Ensure target directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Export CSV without index
        df.to_csv(output_path, index=False)
        print(f"File successfully saved to: {output_path}")

    except Exception as e:
        print(f"Failed to save file: {e}")
        raise