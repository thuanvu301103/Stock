CREATE TABLE IF NOT EXISTS n8n_olap.fact_market_flow_indicators 
(
    index_id LowCardinality(String),
    time Date,
    net_breadth Int32,
    cumulative_ad Int32,
    ad_slope Float64,
    ad_slope_5 Float64,
    breadth_ratio Float64,
    index_return_differential Float64,
    updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYYYYMM(time)
ORDER BY (index_id, time);