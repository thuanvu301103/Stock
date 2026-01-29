CREATE TABLE n8n_olap.dim_date (
    date_key Date,
    year UInt16,
    quarter UInt8,
    month UInt8,
    day_of_week UInt8,         -- 1 (Monday) to 7 (Sunday)
    is_weekend UInt8,          -- 1 for weekend, 0 for weekday
    is_trading_day UInt8       -- Useful for filtering out holidays/weekends
) ENGINE = MergeTree()
ORDER BY date_key;