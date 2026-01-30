CREATE OR REPLACE VIEW n8n_olap.v_indicators_base AS
WITH raw_data AS (
    SELECT 
        symbol, trade_date, close, high, low, volume 
    FROM n8n_olap.fact_stock_prices FINAL
),
numbered_data AS (
    SELECT 
        *,
        IF(high = low, 0, ((close - low) - (high - close)) / (high - low) * volume) AS mfv,
        row_number() OVER (PARTITION BY symbol ORDER BY trade_date) - 1 AS rn
    FROM raw_data
),
ema_calc AS (
    SELECT
        *,
        2 / (20 + 1) AS alpha,
        pow(1 - alpha, rn) AS weight,
        close * weight AS weighted_close
    FROM numbered_data
),
indicators AS (
    SELECT
        symbol,
        trade_date,
        close,
        rn,
        IF(rn + 1 < 20, NULL, avg(close) OVER w20) AS sma_20,
        IF(rn + 1 < 20, NULL, sum(weighted_close) OVER w_unbounded / sum(weight) OVER w_unbounded) AS ema_20,
        IF(rn + 1 < 21, NULL, sum(mfv) OVER w21 / sum(volume) OVER w21) AS cmf_21
    FROM ema_calc
    WINDOW 
        w20 AS (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW),
        w21 AS (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 20 PRECEDING AND CURRENT ROW),
        w_unbounded AS (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
)
SELECT
    *,
    sma_20 - any(sma_20) OVER (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING) AS sma_20_accel,
    ema_20 - any(ema_20) OVER (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING) AS ema_20_accel,
    cmf_21 - any(cmf_21) OVER (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING) AS cmf_21_accel
FROM indicators;