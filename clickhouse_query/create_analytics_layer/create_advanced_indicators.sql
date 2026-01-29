CREATE TABLE n8n_olap.analytics_indicators (
    symbol LowCardinality(String),
    trade_date Date,
    close Float32,
    sma_20 Float32,
    ema_20 Float32,
    cmf_20 Float32,
    updated_at DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY (symbol, trade_date);
