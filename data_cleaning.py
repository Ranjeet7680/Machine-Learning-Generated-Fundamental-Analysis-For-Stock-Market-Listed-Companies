# src/data_cleaning.py
import pandas as pd
import numpy as np
import re
import os

def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize column names by:
    - Lowercasing
    - Removing special characters
    - Replacing spaces with underscores
    """
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace('[^a-zA-Z0-9]', '_', regex=True)
        .str.replace('__+', '_', regex=True)
    )
    return df


def convert_to_numeric(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert all numeric-looking columns to floats.
    Example: '1,200.50' -> 1200.50, '15%' -> 0.15
    """
    for col in df.columns:
        # Only attempt conversion for string/object columns
        if df[col].dtype == "object":
            df[col] = (
                df[col]
                .astype(str)
                .replace({',': '', '₹': '', 'Rs.': '', '%': ''}, regex=True)
                .replace('nan', np.nan)
            )
            df[col] = pd.to_numeric(df[col], errors='ignore')
            
            # Convert percentage strings to decimals
            if df[col].astype(str).str.contains('%').any():
                df[col] = df[col] / 100

    return df


def remove_null_and_duplicates(df: pd.DataFrame, thresh_ratio=0.6) -> pd.DataFrame:
    """
    Removes:
    - Columns with too many nulls (less than thresh_ratio non-nulls)
    - Duplicate rows
    """
    # Drop columns where non-null ratio < threshold
    min_non_nulls = int(thresh_ratio * len(df))
    df = df.dropna(axis=1, thresh=min_non_nulls)
    
    # Drop duplicate rows
    df = df.drop_duplicates()
    
    # Drop all-null rows
    df = df.dropna(how='all')
    return df


def normalize_financial_units(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize units:
    - Converts thousands/lakhs/crores notation to base (₹)
    """
    unit_patterns = {
        'crore': 1e7,
        'cr': 1e7,
        'lakh': 1e5,
        'lac': 1e5,
        'thousand': 1e3,
        'k': 1e3,
    }

    for col in df.select_dtypes(include='object').columns:
        for unit, multiplier in unit_patterns.items():
            df[col] = df[col].replace(
                to_replace=f'([0-9\.,]+)\\s*{unit}',
                value=lambda m: float(m.group(1).replace(',', '')) * multiplier,
                regex=True
            )

    return df


def clean_financial_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Perform all cleaning steps on a given financial DataFrame.
    """
    if df.empty:
        return df

    df = clean_column_names(df)
    df = convert_to_numeric(df)
    df = remove_null_and_duplicates(df)
    df = normalize_financial_units(df)

    # Replace inf/nan with 0 for ML compatibility
    df = df.replace([np.inf, -np.inf], np.nan).fillna(0)

    return df


def preprocess_all_csvs(input_folder="data/raw_financials", output_folder="data/cleaned_data"):
    """
    Reads all company CSVs, cleans them, and saves standardized CSVs.
    """
    os.makedirs(output_folder, exist_ok=True)
    files = [f for f in os.listdir(input_folder) if f.endswith(".csv")]

    for f in files:
        path = os.path.join(input_folder, f)
        try:
            df = pd.read_csv(path)
            cleaned = clean_financial_dataframe(df)
            cleaned.to_csv(os.path.join(output_folder, f), index=False)
            print(f"✅ Cleaned: {f}")
        except Exception as e:
            print(f"⚠️ Error cleaning {f}: {e}")

    print("\n🎯 All financial data cleaned successfully!")

