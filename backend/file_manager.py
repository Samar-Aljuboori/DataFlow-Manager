import os
import pandas as pd

def load_csv(file_path):
    # Read CSV file and return DataFrame
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found at: {file_path}")
    return pd.read_csv(file_path)

def save_csv(df, output_path):
    # Ensure directory exists before saving
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save DataFrame to CSV file without index
    df.to_csv(output_path, index=False)
    print(f"File successfully saved to: {output_path}")

if __name__ == "__main__":
    # Isolated test for file_manager functions
    test_df = load_csv("../data/sample_data.csv")
    print("Loaded Data Preview:")
    print(test_df.head(2))
    
    save_csv(test_df, "../data/cleaned_data/test_output.csv")