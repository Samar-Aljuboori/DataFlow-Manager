from file_manager import load_csv

def clean_data(file_path):
    try:
        # Load data safely using load_csv
        df = load_csv(file_path)

        # Clean duplicates
        df_cleaned = df.drop_duplicates()

        # Fill missing values if needed
        df_cleaned = df_cleaned.fillna("Unknown")

        return df_cleaned

    except Exception as e:
        print(f"Cleaning Process Failed: {e}")
        raise



def rename_columns(df, columns_map):
    """
    Rename specified columns in the DataFrame.
    columns_map: dict mapping old column names to new column names (e.g., {"Salary": "Monthly_Salary"})
    """
    if df is None or df.empty:
        return df

    # Return a safe copy with renamed columns
    return df.copy().rename(columns=columns_map)



def remove_columns(df, columns_to_drop):
    """
    Remove specified columns from the DataFrame.
    columns_to_drop: list of column names to remove (e.g., ["City", "Address"])
    """
    if df is None or df.empty:
        return df

    # Drop specified columns safely ignoring missing labels
    return df.copy().drop(columns=columns_to_drop, errors='ignore')