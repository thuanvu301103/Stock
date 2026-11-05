CREATE TABLE n8n_olap.fact_exchange_index_histories (
    index_id LowCardinality(String),
    time DateTime64(3, 'UTC'),
    index_value Float64,
    change Float64,
    change_percent Float64,
    chart_open Float64,
    chart_high Float64,
    chart_low Float64,
    advances Int32,
    declines Int32,
    nochanges Int32,
    ceiling Int32,
    floor Int32,
    total_qtty UInt64,
    total_qtty_pt UInt64,
    total_value Float64,
    total_value_pt Float64,
    all_qty UInt64,
    all_value Float64
)
ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(time)
ORDER BY (index_id, time);