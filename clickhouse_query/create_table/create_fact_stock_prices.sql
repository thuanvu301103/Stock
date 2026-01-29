CREATE TABLE n8n_olap.fact_stock_prices (
    symbol LowCardinality(String),
    trade_date Date,
    open Float32,
    high Float32,
    low Float32,
    close Float32,
    adj_close Float32,               -- Adjusted price for technical indicators
    volume UInt64,                   -- Total shares traded
    trading_value Float64            -- Total liquidity (Volume * Price)
) ENGINE = MergeTree()
PARTITION BY toYear(trade_date)
ORDER BY (symbol, trade_date);