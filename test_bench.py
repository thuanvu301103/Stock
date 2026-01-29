import sys
import os
import pandas as pd
import json

items = [
    {"symbol": "FPT", "vn30_symbols": ["FPT", "VNM", "VIC"]},
    {"symbol": "VNM", "vn30_symbols": ["FPT", "VNM", "VIC"]},
    {"symbol": "AAA", "vn30_symbols": ["FPT", "VNM", "VIC"]}
]

class SuppressOutput:
    def __enter__(self):
        self._original_stdout = sys.stdout
        self._original_stderr = sys.stderr
        self._devnull = open(os.devnull, 'w', encoding='utf-8')
        sys.stdout = self._devnull
        sys.stderr = self._devnull
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout = self._original_stdout
        sys.stderr = self._original_stderr
        self._devnull.close()

df_list = pd.DataFrame()
df_price = pd.DataFrame()
input_symbols = []
vn30_list = set()

with SuppressOutput():

    from vnstock import Company
    
    for item in items:
        sym = item.get("symbol")
        v_list = item.get("vn30_symbols")
        
        c = Company(symbol = sym, source = 'VCI')
        df_company = c.overview()
       
        #df_price = price_board(",".join(input_symbols))

print("Company: ", df_company)
'''
results = []
if not df_coma.empty:
    if 'ticker' in df_list.columns:
        df_list = df_list.rename(columns={'ticker': 'symbol'})

    df_filtered = df_list[df_list['symbol'].isin(input_symbols)]

    if df_price is not None and not df_price.empty:
        if 'Mã CP' in df_price.columns:
            df_price = df_price.rename(columns={'Mã CP': 'symbol', 'Vốn hóa (tỷ)': 'market_cap'})
        df = pd.merge(df_filtered, df_price[['symbol', 'market_cap']], on='symbol', how='left')
    else:
        df = df_filtered
        df['market_cap'] = 0

    for _, row in df.iterrows():
        mcap = row.get('market_cap', 0)
        mcap_group = "Bluechip" if mcap >= 10000 else ("Midcap" if mcap >= 1000 else "Penny")

        results.append({
            "stock_key": row['symbol'],
            "company_name": row.get('organName', row.get('organ_name', 'N/A')),
            "sector": row.get('icbName3', row.get('icb_name_l3', 'N/A')),
            "industry": row.get('icbName4', row.get('icb_name_l4', 'N/A')),
            "exchange": row.get('comGroupCode', row.get('com_group_code', 'N/A')),
            "market_cap_group": mcap_group,
            "listing_date": str(row.get('firstListingDate', '1970-01-01')),
            "is_vn30": 1 if row['symbol'] in vn30_list else 0
        })


print(json.dumps(results, indent=4, ensure_ascii=False))
'''