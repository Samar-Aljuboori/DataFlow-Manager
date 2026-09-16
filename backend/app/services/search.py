import pandas as pd

def search_data(df, query, case_sensitive=False):
    """
    Searches for a specific text/query across all columns of the DataFrame.
    Returns rows where any column contains the query.
    """
    if df is None or df.empty:
        raise ValueError("Error: Provided DataFrame is empty or invalid.")

    if not query or not str(query).strip():
        # If the search query is empty, return the full DataFrame
        return df.copy()

    query_str = str(query).strip()

    # Create a base mask filled with False for all rows
    combined_mask = pd.Series(False, index=df.index)

    # Loop through all columns in the DataFrame
    for col in df.columns:
        # Convert the column data to string format for safe searching
        col_series = df[col].astype(str)

        if case_sensitive:
            mask = col_series.str.contains(query_str, regex=False, na=False)
        else:
            mask = col_series.str.lower().str.contains(query_str.lower(), regex=False, na=False)

        # Combine results: keep row if match is found in ANY column (OR operation)
        combined_mask = combined_mask | mask

    result_df = df[combined_mask]
    return result_df.reset_index(drop=True)