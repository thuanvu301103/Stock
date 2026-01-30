CREATE TABLE n8n_olap.fact_stock_prices (
    symbol LowCardinality(String),
    trade_date Date,
    open Float32,
    high Float32,
    low Float32,
    close Float32,
    adj_close Float32,
    volume UInt64,
    trading_value Float64,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYear(trade_date)
ORDER BY (symbol, trade_date);
