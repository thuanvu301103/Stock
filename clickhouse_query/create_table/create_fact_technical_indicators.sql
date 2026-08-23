CREATE TABLE n8n_olap.fact_technical_indicators (
    symbol LowCardinality(String),
    trade_date Date,
    sma_20 Float32,
    sma_50 Float32,
    sma_100 Float32,
    rsi_7 Float32,
    rsi_14 Float32,
    rsi_21 Float32,
    volume_iqr_p25 Float32,
    volume_iqr_p75 Float32,
    volume_rolling_iqr Float32,
    updated_at DateTime
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYear(trade_date)
ORDER BY (symbol, trade_date);