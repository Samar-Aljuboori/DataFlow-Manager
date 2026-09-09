from file_manager import load_csv, save_csv
from analyzer import analyze_dataset
from cleaner import clean_data

def run_pipeline(input_path, output_path):
    print("==========================================")
    print("Starting DataFlow Manager Pipeline...")
    print("==========================================")

    # 1. Load Data
    print("\n[Step 1/4] Loading Dataset...")
    df_raw = load_csv(input_path)

    # 2. Analyze Data
    print("\n[Step 2/4] Analyzing Raw Dataset...")
    analyze_dataset(input_path)

    # 3. Clean Data
    print("\n[Step 3/4] Cleaning Dataset...")
    df_cleaned = clean_data(input_path)

    # 4. Save/Export Data
    print("\n[Step 4/4] Exporting Cleaned Dataset...")
    save_csv(df_cleaned, output_path)

    print("\n==========================================")
    print("Pipeline Execution Completed Successfully!")
    print("==========================================")

if __name__ == "__main__":
    # Define input and output paths relative to the backend directory
    input_file = "../data/sample_data.csv"
    output_file = "../data/cleaned_data/sample_data_cleaned.csv"

    run_pipeline(input_file, output_file)