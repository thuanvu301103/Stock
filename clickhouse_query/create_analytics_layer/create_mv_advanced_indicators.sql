CREATE MATERIALIZED VIEW mv_indicators_base
TO n8n_olap.analytics_indicators
AS
SELECT
    symbol,
    trade_date,
    close,
    avg(close) OVER w AS sma_20,
    sum(volume) OVER w AS vol_20
FROM n8n_olap.fact_stock_prices
WINDOW w AS (
    PARTITION BY symbol
    ORDER BY trade_date
    ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
);
