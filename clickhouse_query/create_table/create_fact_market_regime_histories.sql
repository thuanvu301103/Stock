CREATE TABLE IF NOT EXISTS n8n_olap.fact_market_regime_histories (
    market_regime_code LowCardinality(String),
    market_state LowCardinality(String),
    market_description String,
    market_conditions String,
    override_id LowCardinality(String),
    override_state LowCardinality(String),
    override_description String,
    override_conditions String,
    override_actions String,
    allocation String,
    time Date,
    baseline_index LowCardinality(String),
    largecap_index LowCardinality(String),
    updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYYYYMM(time)
ORDER BY (baseline_index, time);