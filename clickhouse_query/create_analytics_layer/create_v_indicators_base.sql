CREATE OR REPLACE VIEW n8n_olap.v_indicators_base AS
WITH raw_data AS (
    SELECT 
        symbol, trade_date, close, high, low, volume 
    FROM n8n_olap.fact_stock_prices FINAL
),
numbered_data AS (
    SELECT 
        *,
        -- Money Flow Volume: avoid division by zero if high equals low
        IF(high = low, 0, ((close - low) - (high - close)) / (high - low) * volume) AS mfv,
        -- Daily price change for RSI
        close - any(close) OVER (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING) AS delta,
        row_number() OVER (PARTITION BY symbol ORDER BY trade_date) - 1 AS rn
    FROM raw_data
),
indicator_parts AS (
    SELECT
        *,
        IF(delta > 0, delta, 0) AS gain,
        IF(delta < 0, abs(delta), 0) AS loss
    FROM numbered_data
),
indicators AS (
    SELECT
        symbol,
        trade_date,
        close,
        rn,
        -- SMA 20: returns NULL if less than 20 periods available
        IF(rn + 1 < 20, NULL, avg(close) OVER w20) AS sma_20,
        -- CMF 21: returns NULL if less than 21 periods available
        IF(rn + 1 < 21, NULL, sum(mfv) OVER w21 / sum(volume) OVER w21) AS cmf_21,
        -- RSI 14: comprehensive handling for insufficient data or zero volatility
        CASE 
            WHEN rn + 1 < 14 THEN NULL 
            WHEN avg(loss) OVER w14 = 0 AND avg(gain) OVER w14 > 0 THEN 100
            WHEN avg(loss) OVER w14 = 0 AND avg(gain) OVER w14 = 0 THEN 50
            ELSE 100 - (100 / (1 + (avg(gain) OVER w14 / avg(loss) OVER w14))) 
        END AS rsi_14
    FROM indicator_parts
    WINDOW 
        w14 AS (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 13 PRECEDING AND CURRENT ROW),
        w20 AS (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW),
        w21 AS (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 20 PRECEDING AND CURRENT ROW),
        w_unbounded AS (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
)
SELECT
    *,
    -- Calculate daily acceleration (momentum)
    -- Using ifNull to handle the very first record of each symbol
    ifNull(sma_20 - any(sma_20) OVER (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING), 0) AS sma_20_accel,
    ifNull(cmf_21 - any(cmf_21) OVER (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING), 0) AS cmf_21_accel,
    ifNull(rsi_14 - any(rsi_14) OVER (PARTITION BY symbol ORDER BY trade_date ROWS BETWEEN 1 PRECEDING AND 1 PRECEDING), 0) AS rsi_14_accel
FROM indicators;