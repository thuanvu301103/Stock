CREATE OR REPLACE VIEW n8n_olap.v_pre_calculate_market_data AS
WITH price_changes AS (
    SELECT
        d.trade_date AS trade_date,
        d.symbol AS symbol,
        d.close AS close,
        d.close - any(d.close) OVER (PARTITION BY d.symbol ORDER BY d.trade_date ASC ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING) AS delta,
        d.volume AS volume,
        d.trading_value AS trading_value,
        dd.is_trading_day AS is_trading_day,
        t.signal_volume_outlier AS signal_volume_outlier,
        t.days_since_volume_outlier AS days_since_volume_outlier
    FROM n8n_olap.fact_market_data AS d
    LEFT JOIN n8n_olap.fact_technical_indicators AS t
        ON d.symbol = t.symbol AND d.trade_date = t.trade_date
    LEFT JOIN n8n_olap.dim_date AS dd
        ON d.trade_date = dd.date_key
)
SELECT
    trade_date,
    symbol AS stock_key,
    close,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS sum_close_20,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 49 PRECEDING AND CURRENT ROW) AS sum_close_50,
    SUM(close) OVER (PARTITION BY symbol ORDER BY trade_date ASC ROWS BETWEEN 99 PRECEDING AND CURRENT ROW) AS sum_close_100,
    greatest(delta, 0) AS gain,
    greatest(-delta, 0) AS loss,
    volume,
    trading_value,
    is_trading_day,
    signal_volume_outlier,
    days_since_volume_outlier
FROM price_changes;