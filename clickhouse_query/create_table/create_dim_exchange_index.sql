CREATE TABLE n8n_olap.dim_exchange_indices (
    index_id String,
    exchange LowCardinality(String),
    label String,
    exchange_label String
)
ENGINE = ReplacingMergeTree()
PRIMARY KEY index_id
ORDER BY index_id;