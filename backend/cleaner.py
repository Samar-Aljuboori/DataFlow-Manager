import pandas as pd

def remove_duplicates(df):
    # Remove duplicate rows from the DataFrame
    return df.drop_duplicates()

def remove_missing_values(df):
    # Drop rows that contain any missing (NaN) values
    return df.dropna()

def fill_missing_values(df, fill_value="N/A"):
    # Fill missing values with a specified default value
    return df.fillna(fill_value)

def clean_data(file_path):
    # Load the raw dataset
    df = pd.read_csv(file_path)
    
    # 1. Remove duplicate rows
    df_cleaned = remove_duplicates(df)
    
    # 2. Fill missing values with a default text (or you can use remove_missing_values if needed)
    df_cleaned = fill_missing_values(df_cleaned, fill_value="Unknown")
    
    print("Data cleaned successfully!")
    print(f"Original rows: {len(df)}, Cleaned rows: {len(df_cleaned)}")
    
    return df_cleaned

if __name__ == "__main__":
    cleaned_df = clean_data("../data/sample_data.csv")