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