CREATE TABLE n8n_olap.fact_market_sentiment (
    symbol String,
    trade_date Date,
    net_foreign_value Float64,       -- Foreign buy minus foreign sell
    prop_trading_value Float64       -- Internal proprietary desk flows
) ENGINE = MergeTree()
ORDER BY (symbol, trade_date);
