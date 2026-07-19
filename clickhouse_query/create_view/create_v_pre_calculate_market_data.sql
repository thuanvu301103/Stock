CREATE OR REPLACE VIEW n8n_olap.v_pre_calculate_market_data AS
SELECT
    trade_date,
    symbol as stock_key,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS sum_close_20,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 49 PRECEDING AND CURRENT ROW) AS sum_close_50,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 99 PRECEDING AND CURRENT ROW) AS sum_close_100
FROM n8n_olap.fact_stock_prices;