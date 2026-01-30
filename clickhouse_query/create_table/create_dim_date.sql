CREATE TABLE n8n_olap.dim_date (
    date_key Date,
    year UInt16,
    quarter UInt8,
    month UInt8,
    day_of_week UInt8,
    is_weekend UInt8,
    is_trading_day UInt8,
    updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY date_key;
