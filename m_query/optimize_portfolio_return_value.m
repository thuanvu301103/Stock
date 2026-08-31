let
    // Data source
    Source = fact_portfolio_return_metrics,

    // Filter data
    TargetDate = Date.From(SelectedTradeDate),
    SymbolList = List.Transform(Text.Split(SelectedSymbols, ","), Text.Trim),
    FilteredData = Table.SelectRows(Source, each 
        List.Contains(SymbolList, [symbol]) and [trade_date] <= TargetDate
    ),

    // Run Python script
    RunPythonScript = Python.Execute("
import numpy as np
import pandas as pd
from scipy.optimize import minimize

DEFAULT_N_DAYS = 60
total_budget = float(" & Text.From(TotalInvestment) & ")

df = dataset.copy()
df.columns = [str(col).strip().lower() for col in df.columns]

date_col = next((c for c in df.columns if 'date' in c), 'trade_date')
symbol_col = next((c for c in df.columns if 'symbol' in c), 'symbol')
price_col = next((c for c in df.columns if 'price' in c or 'close' in c), 'close_price')
return_col = next((c for c in df.columns if 'expected' in c or 'return' in c), 'expected_return_t2_n20')
vol_col = next((c for c in df.columns if 'vol' in c), 'volatility_t2_n20')

# Extract N trading sessions relative to TargetDate
unique_dates = sorted(df[date_col].unique(), reverse=True)
recent_dates = unique_dates[:DEFAULT_N_DAYS]
df_recent = df[df[date_col].isin(recent_dates)].copy()

# Extract observation metrics for the specified date
latest_date = max(recent_dates) if len(recent_dates) > 0 else df[date_col].max()
latest_df = df[df[date_col] == latest_date][[symbol_col, price_col, return_col, vol_col]].drop_duplicates(subset=[symbol_col], keep='last')

symbols = latest_df[symbol_col].values
returns = latest_df[return_col].values
prices = latest_df[price_col].values
volatilities = latest_df[vol_col].values
num_assets = len(symbols)

if num_assets == 0:
    weights = np.array([])
elif num_assets == 1:
    weights = np.array([1.0])
else:
    df_clean = df_recent.drop_duplicates(subset=[date_col, symbol_col], keep='last')
    pivot_returns = df_clean.pivot_table(
        index=date_col,
        columns=symbol_col,
        values=return_col,
        aggfunc='mean'
    )[symbols].dropna()

    if len(pivot_returns) >= 2:
        cov_matrix = pivot_returns.cov().values
    else:
        cov_matrix = np.diag(volatilities**2)

    def negative_sharpe(w):
        port_return = np.sum(w * returns)
        port_volatility = np.sqrt(np.dot(w.T, np.dot(cov_matrix, w)))
        if port_volatility == 0:
            return 0
        return -(port_return / port_volatility)

    # Dynamic bounds definition to guarantee global optimization feasibility
    min_w = min(0.05, 1.0 / num_assets)
    max_w = 1.0 if num_assets < 3 else max(0.35, 1.0 / num_assets)
    bounds = tuple((min_w, max_w) for _ in range(num_assets))
    
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
    initial_weights = np.array(num_assets * [1.0 / num_assets])

    optimization_result = minimize(
        negative_sharpe,
        initial_weights,
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )
    
    # Weight re-normalization and rounding adjustment
    raw_weights = optimization_result.x
    sum_w = np.sum(raw_weights)
    normalized_weights = raw_weights / sum_w if sum_w > 0 else initial_weights

    weights = np.round(normalized_weights, 4)
    weights[-1] = np.round(1.0 - np.sum(weights[:-1]), 4)

# Calculate investment amounts and share quantities
if num_assets > 0:
    allocated_amount = np.round(weights * total_budget, 2)
    # Calculate whole shares (floor division) based on close_price
    suggested_shares = np.where(prices > 0, np.floor(allocated_amount / prices), 0).astype(int)

    result_df = pd.DataFrame({
        'calculated_for_date': [latest_date] * num_assets,
        'symbol': symbols,
        'close_price': prices,
        'expected_return': returns,
        'optimal_weight': weights,
        'allocated_amount': allocated_amount,
        'suggested_shares': suggested_shares
    })
else:
    result_df = pd.DataFrame(columns=[
        'calculated_for_date', 'symbol', 'close_price', 
        'expected_return', 'optimal_weight', 'allocated_amount', 'suggested_shares'
    ])
", [dataset=FilteredData]),

    ResultTable = RunPythonScript{[Name="result_df"]}[Value]
in
    ResultTable

/*
Here are the field descriptions for `result_df` in concise English:

* **`calculated_for_date`**: The execution date used for portfolio optimization.
* **`symbol`**: The stock ticker symbol.
* **`close_price`**: The closing price of the stock on `calculated_for_date`.
* **`expected_return`**: The expected return rate of the asset.
* **`optimal_weight`**: The optimized portfolio weight determined by the Sharpe ratio maximization algorithm (sum of weights = 1.0).
* **`allocated_amount`**: The target capital allocated to the asset ($\text{optimal\_weight} \times \text{TotalInvestment}$).
* **`suggested_shares`**: The target number of shares to purchase ($\lfloor \text{allocated\_amount} / \text{close\_price} \rfloor$).
*/