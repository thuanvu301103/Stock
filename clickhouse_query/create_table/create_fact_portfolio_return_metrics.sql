CREATE TABLE IF NOT EXISTS n8n_olap.fact_portfolio_return_metrics
(
    symbol String,
    trade_date Date,
    close_price Float64,
    log_return_t2 Float64,
    expected_return_t2_n20 Float64,
    volatility_t2_n20 Float64,
    updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
PRIMARY KEY (symbol, trade_date)
ORDER BY (symbol, trade_date);