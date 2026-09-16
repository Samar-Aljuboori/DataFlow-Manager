import pandas as pd

def filter_by_column(df, column_name, value, case_sensitive=False):
    """
    Filters the DataFrame based on a specific column and matching value.
    Supports string matching (case-insensitive option) and exact matching for numeric types.
    """
    if df is None or df.empty:
        raise ValueError("Error: Provided DataFrame is empty or invalid.")

    if column_name not in df.columns:
        raise KeyError(f"Error: Column '{column_name}' not found in DataFrame.")

    # Drop null values in the target column to allow safe comparison
    valid_mask = df[column_name].notna()     # the values will be (true,false)
    filtered_df = df[valid_mask]

    # Check if the column data type is text/object
    if pd.api.types.is_string_dtype(df[column_name]) or df[column_name].dtype == 'object':
        val_str = str(value)
        if case_sensitive:
            result_df = filtered_df[filtered_df[column_name].astype(str) == val_str]
        else:
            result_df = filtered_df[filtered_df[column_name].astype(str).str.lower() == val_str.lower()]
    else:
        # Numeric or boolean exact match comparison
        result_df = filtered_df[filtered_df[column_name] == value]

    return result_df.reset_index(drop=True)


def filter_numeric_range(df, column_name, min_val=None, max_val=None):
    """Filters a numeric column within a specified min/max range."""
    if df is None or df.empty:
        raise ValueError("Error: Provided DataFrame is empty or invalid.")

    if column_name not in df.columns:
        raise KeyError(f"Error: Column '{column_name}' not found in DataFrame.")

    if not pd.api.types.is_numeric_dtype(df[column_name]):
        raise TypeError(f"Error: Column '{column_name}' is not numeric.")

    result_df = df.copy()
    if min_val is not None:
        result_df = result_df[result_df[column_name] >= min_val]
    if max_val is not None:
        result_df = result_df[result_df[column_name] <= max_val]

    return result_df.reset_index(drop=True)