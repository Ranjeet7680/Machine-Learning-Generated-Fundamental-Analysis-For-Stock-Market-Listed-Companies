# src/ml_analysis.py

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

def categorize_metrics(df: pd.DataFrame, threshold: float = 10.0) -> dict:
    """
    Categorize numerical columns into Pros and Cons based on threshold.
    
    Parameters:
        df (pd.DataFrame): Cleaned financial dataframe
        threshold (float): Percentage threshold for classification (default: 10%)
    
    Returns:
        dict: { "pros": [...], "cons": [...], "neutral": [...] }
    """
    pros, cons, neutral = [], [], []

    for col in df.select_dtypes(include=[np.number]).columns:
        mean_val = df[col].mean()

        # Skip near-zero or empty columns
        if np.isnan(mean_val) or mean_val == 0:
            continue

        # Convert to percentage if values look small (<1)
        val = mean_val * 100 if abs(mean_val) < 1 else mean_val

        if val > threshold:
            pros.append((col, val))
        elif val < threshold:
            cons.append((col, val))
        else:
            neutral.append((col, val))

    return {
        "pros": sorted(pros, key=lambda x: -x[1]),
        "cons": sorted(cons, key=lambda x: x[1]),
        "neutral": neutral
    }


def calculate_financial_scores(df: pd.DataFrame) -> pd.DataFrame:
    """
    Use PCA to compute a simplified 'financial health score' for each company.
    - Standardizes features
    - Applies PCA to reduce dimensionality
    - Returns normalized score (0–100)
    """
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.empty:
        return pd.DataFrame()

    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(numeric_df)

    pca = PCA(n_components=1)
    principal_component = pca.fit_transform(scaled_data)

    df_scores = pd.DataFrame({
        "Company": df.get("company_name", pd.Series(range(len(df)))),
        "Financial_Score": np.interp(principal_component, 
                                     (principal_component.min(), principal_component.max()), 
                                     (0, 100))
    })

    return df_scores


def analyze_company_financials(df: pd.DataFrame, threshold: float = 10.0) -> dict:
    """
    Full analysis pipeline:
    1. Categorize Pros & Cons
    2. Calculate Financial Score
    3. Summarize Key Insights
    """
    categories = categorize_metrics(df, threshold)
    scores_df = calculate_financial_scores(df)

    avg_score = scores_df["Financial_Score"].mean() if not scores_df.empty else 0
    summary = {
        "total_metrics": len(df.columns),
        "pros_count": len(categories["pros"]),
        "cons_count": len(categories["cons"]),
        "avg_financial_score": round(avg_score, 2)
    }

    return {
        "categories": categories,
        "scores": scores_df.to_dict(orient="records"),
        "summary": summary
    }


# Example usage
if __name__ == "__main__":
    # Example: financial data per company
    sample_data = {
        "company_name": ["Reliance", "Infosys", "ITC"],
        "net_profit_margin": [12.4, 8.6, 14.1],
        "operating_margin": [15.3, 9.9, 10.5],
        "debt_to_equity": [0.4, 0.8, 1.2],
        "return_on_equity": [18.2, 14.9, 9.5],
    }

    df = pd.DataFrame(sample_data)
    result = analyze_company_financials(df, threshold=10)

    print("✅ ML Analysis Completed:")
    print("Summary:", result["summary"])
    print("Pros:", result["categories"]["pros"])
    print("Cons:", result["categories"]["cons"])
