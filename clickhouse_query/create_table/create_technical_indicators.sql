CREATE TABLE n8n_olap.fact_technical_indicators (
    symbol LowCardinality(String),
    trade_date Date,
    sma_20 Float32,
    sma_50 Float32,
    sma_200 Float32,
    ema_20 Float32,
    ema_50 Float32,
    ema_200 Float32,
    rsi_14 Float32,
    macd_line Float32,
    macd_signal Float32,
    macd_histogram Float32,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYear(trade_date)
ORDER BY (symbol, trade_date);