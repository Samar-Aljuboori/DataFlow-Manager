import pandas as pd

def _get_numeric_series(df, column_name):    # private func.   /  helper func.
    """Internal helper to validate DataFrame and column type."""
    if df is None or df.empty:
        raise ValueError("Error: Provided DataFrame is empty or invalid.")

    if column_name not in df.columns:
        raise KeyError(f"Error: Column '{column_name}' not found in DataFrame.")

    # Select column and ensure it is numeric
    series = df[column_name]
    if not pd.api.types.is_numeric_dtype(series):
        raise TypeError(f"Error: Column '{column_name}' is not numeric. Statistics can only be calculated on numeric columns.")

    return series


def get_mean(df, column_name):
    """Calculates the mean (average) of a numeric column."""
    series = _get_numeric_series(df, column_name)
    return float(series.mean())


def get_median(df, column_name):
    """Calculates the median of a numeric column."""
    series = _get_numeric_series(df, column_name)
    return float(series.median())


def get_min(df, column_name):
    """Calculates the minimum value of a numeric column."""
    series = _get_numeric_series(df, column_name)
    return float(series.min())


def get_max(df, column_name):
    """Calculates the maximum value of a numeric column."""
    series = _get_numeric_series(df, column_name)
    return float(series.max())


def get_count(df, column_name):
    """Calculates the total count of valid (non-null) numeric values."""
    series = _get_numeric_series(df, column_name)
    return int(series.count())