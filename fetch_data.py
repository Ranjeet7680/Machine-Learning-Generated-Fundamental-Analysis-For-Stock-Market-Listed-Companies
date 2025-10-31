# src/fetch_data.py
import pandas as pd
import yfinance as yf
from tqdm import tqdm
import os

def fetch_financials(excel_path: str, output_dir: str = "data/raw_financials"):
    """
    Fetch Balance Sheet, Income Statement, and Cash Flow for each company
    listed in the Excel sheet.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Read company symbols
    df = pd.read_excel(excel_path)
    symbols = df['Symbol'].dropna().tolist()

    all_data = []

    for symbol in tqdm(symbols, desc="Fetching Financial Data"):
        try:
            ticker = yf.Ticker(symbol)

            balance_sheet = ticker.balance_sheet
            income_stmt = ticker.financials
            cash_flow = ticker.cashflow

            # Combine and save
            data = {
                'symbol': symbol,
                'balance_sheet': balance_sheet,
                'income_statement': income_stmt,
                'cash_flow': cash_flow
            }

            all_data.append(data)

            # Save individual CSVs
            balance_sheet.to_csv(f"{output_dir}/{symbol}_balance_sheet.csv")
            income_stmt.to_csv(f"{output_dir}/{symbol}_income_statement.csv")
            cash_flow.to_csv(f"{output_dir}/{symbol}_cash_flow.csv")

        except Exception as e:
            print(f"⚠️ Error fetching data for {symbol}: {e}")

    return all_data


if __name__ == "__main__":
    all_financials = fetch_financials("data/Nifty100Companies.xlsx")
