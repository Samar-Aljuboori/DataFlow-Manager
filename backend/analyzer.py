import pandas as pd

def analyze_dataset(file_path):
    # Load the dataset
    df = pd.read_csv(file_path)
    
    # Get shape (rows and columns)
    rows, cols = df.shape
    
    # Get column names
    column_names = list(df.columns)
    
    # Get missing values count per column
    missing_values = df.isnull().sum()
    
    # Get total duplicate rows
    duplicate_rows = df.duplicated().sum()

    # Get data types for each column
    data_types = df.dtypes
    
    # Print formatted output
    print("Dataset Information\n")
    print(f"Rows: {rows}")
    print(f"Columns: {cols}\n")
    
    print("Column Names:")
    for col in column_names:
        print(f"- {col}")
    print()

    print("Column Names & Data Types:")
    for col in column_names:
        print(f"- {col}: {data_types[col]}")
    print()
    
    print("Missing Values:")
    for col, count in missing_values.items():
        if count > 0:
            print(f"- {col}: {count}")
    print()
    
    print(f"Duplicate Rows: {duplicate_rows}")

# Test the analyzer module directly
if __name__ == "__main__":
    analyze_dataset("../data/sample_data.csv")