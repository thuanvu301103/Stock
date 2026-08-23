CREATE OR REPLACE VIEW n8n_olap.v_pre_calculate_market_data AS
WITH price_changes AS (
    SELECT
        trade_date,
        symbol,
        close,
        close - any(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING) AS delta,
        volume,
        trading_value
    FROM n8n_olap.fact_market_data
)
SELECT
    trade_date,
    symbol as stock_key,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS sum_close_20,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 49 PRECEDING AND CURRENT ROW) AS sum_close_50,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 99 PRECEDING AND CURRENT ROW) AS sum_close_100,
    greatest(delta, 0) AS gain,
    greatest(-delta, 0) AS loss,
    volume,
    trading_value
FROM price_changes;