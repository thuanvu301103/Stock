import json

items = [
    {"symbol": "FPT", "vn30_symbols": ["FPT", "VNM", "VIC"]},
    {"symbol": "VNM", "vn30_symbols": ["FPT", "VNM", "VIC"]},
    {"symbol": "AAA", "vn30_symbols": ["FPT", "VNM", "VIC"]}
]
from datetime import datetime, timedelta
import sys
import os

sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

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

processed_items = []

with SuppressOutput():
    from vnstock import Quote
    
    end_date = datetime.today().strftime("%Y-%m-%d")
    start_date = (datetime.today() - timedelta(days=120)).strftime("%Y-%m-%d")

    for item in items:
        try:
            symbol = item["symbol"]
            quote = Quote(symbol=symbol, source="VCI")
            df = quote.history(start=start_date, end=end_date)

            if df.empty:
                continue

            for _, row in df.iterrows():
                close_price = float(row["close"])
                volume = int(row["volume"])

                processed_items.append({
                    "symbol": symbol,
                    "trade_date": row["time"].strftime("%Y-%m-%d"),
                    "open": float(row["open"]),
                    "high": float(row["high"]),
                    "low": float(row["low"]),
                    "close": close_price,
                    "adj_close": close_price,
                    "volume": volume,
                    "trading_value": close_price * volume
                })

        except Exception:
            continue

print(json.dumps(processed_items, indent=4, ensure_ascii=False))