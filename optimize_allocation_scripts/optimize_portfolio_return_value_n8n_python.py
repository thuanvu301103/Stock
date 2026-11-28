import warnings
warnings.filterwarnings('ignore')
import os
os.environ['PYTHONWARNINGS'] = 'ignore'

try:
    import numpy as np
    import pandas as pd
    from scipy.optimize import minimize

    DEFAULT_N_DAYS = 60

    # --- Get data from Prev Node ---
    input_items = items

    if not input_items:
        raise ValueError("No input items received from upstream nodes.")

    total_budget = None
    raw_data = []

    for item in input_items:
        val = item.get("json", item) if isinstance(item, dict) else item
        
        if isinstance(val, dict):
            # Get checking total_investment
            if "total_investment" in val and total_budget is None:
                total_budget = float(val.get("total_investment"))

            # Get data 
            if "data" in val and isinstance(val["data"], list):
                raw_data.extend(val["data"])
            elif "symbol" in val and ("close_price" in val or "trade_date" in val):
                raw_data.append(val)
                
        elif isinstance(val, list):
            raw_data.extend(val)

    if total_budget is None:
        raise ValueError("Missing required field: 'total_investment' was not found in the input payload.")

    if not raw_data:
        raise ValueError("Missing required data: No trade records or 'data' array found from upstream nodes.")

    df = pd.DataFrame(raw_data)

    if df.empty or 'symbol' not in df.columns:
        raise ValueError("DataFrame is empty or missing the 'symbol' column.")

    # --- Normalize columns and data ---
    df.columns = [str(col).strip().lower() for col in df.columns]

    date_col = next((c for c in df.columns if 'date' in c), 'trade_date')
    symbol_col = next((c for c in df.columns if 'symbol' in c), 'symbol')
    price_col = next((c for c in df.columns if 'price' in c or 'close' in c), 'close_price')
    return_col = next((c for c in df.columns if 'expected' in c or 'return' in c), 'expected_return_t2_n20')
    vol_col = next((c for c in df.columns if 'vol' in c), 'volatility_t2_n20')

    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col, symbol_col])

    # --- Get N nearest session ---
    unique_dates = sorted(df[date_col].unique(), reverse=True)
    recent_dates = unique_dates[:DEFAULT_N_DAYS]
    df_recent = df[df[date_col].isin(recent_dates)].copy()
    del df 

    # --- Extract observation metrics for the specified date ---
    latest_date = max(recent_dates) if len(recent_dates) > 0 else df_recent[date_col].max()
    latest_df = df_recent[df_recent[date_col] == latest_date][[symbol_col, price_col, return_col, vol_col]].drop_duplicates(subset=[symbol_col], keep='last')

    symbols = latest_df[symbol_col].values
    returns = latest_df[return_col].values
    prices = latest_df[price_col].values
    volatilities = latest_df[vol_col].values
    num_assets = len(symbols)

    if num_assets == 0:
        raise ValueError("No assets found for the latest trade date.")
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
                return 0.0
            return -(port_return / port_volatility)

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
        
        raw_weights = optimization_result.x
        sum_w = np.sum(raw_weights)
        normalized_weights = raw_weights / sum_w if sum_w > 0 else initial_weights

        weights = np.round(normalized_weights, 4)
        weights[-1] = np.round(1.0 - np.sum(weights[:-1]), 4)

    # --- Calculate investment amounts and share quantities ---
    allocated_amount = np.round(weights * total_budget, 2)
    suggested_shares = np.where(prices > 0, (allocated_amount / prices), 0).astype(float)

    result_df = pd.DataFrame({
        'calculated_for_date': [str(pd.to_datetime(latest_date).date())] * num_assets,
        'symbol': symbols,
        'close_price': prices,
        'expected_return': returns,
        'optimal_weight': weights,
        'allocated_amount': allocated_amount,
        'suggested_shares': suggested_shares
    })
    
    output = result_df.to_dict(orient="records")

except Exception as e:
    import traceback
    # Return error as JSON
    output = [{
        "status": "error",
        "error_type": type(e).__name__,
        "error_message": str(e),
        "traceback": traceback.format_exc()
    }]

return output