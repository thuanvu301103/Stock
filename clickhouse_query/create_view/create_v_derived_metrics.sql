CREATE OR REPLACE VIEW n8n_olap.v_derived_metrics AS
WITH base_data AS (
    SELECT
        symbol,
        trade_date,
        sma_20,
        sma_50,
        sma_100,
        
        -- Historical values for SMA 20
        lagInFrame(sma_20, 1) OVER w AS sma_20_lag_1,
        lagInFrame(sma_20, 5) OVER w AS sma_20_lag_5,
        
        -- Historical values for SMA 50
        lagInFrame(sma_50, 1) OVER w AS sma_50_lag_1,
        lagInFrame(sma_50, 5) OVER w AS sma_50_lag_5,
        
        -- Historical values for SMA 100
        lagInFrame(sma_100, 1) OVER w AS sma_100_lag_1,
        lagInFrame(sma_100, 5) OVER w AS sma_100_lag_5,

        -- Differential values for Crossover (Current t and Previous t-1)
        (sma_20 - sma_50) AS delta_sma_20_50,
        (lagInFrame(sma_20, 1) OVER w - lagInFrame(sma_50, 1) OVER w) AS delta_sma_20_50_lag_1,

        (sma_50 - sma_100) AS delta_sma_50_100,
        (lagInFrame(sma_50, 1) OVER w - lagInFrame(sma_100, 1) OVER w) AS delta_sma_50_100_lag_1,
    
        -- Volume and Volume IQR Metrics
        p.volume AS volume,
        volume_iqr_p25,
        volume_iqr_p75,
        volume_rolling_iqr,

        -- Volume Bounds
        (volume_iqr_p75 + 1.5 * volume_rolling_iqr) AS volume_upper_bound,
        (volume_iqr_p25 - 1.5 * volume_rolling_iqr) AS volume_lower_bound

        -- Current Price Values for Pivot Point Calculations (Lag 0)
        p.high AS high_price,
        p.low AS low_price,
        p.close AS close_price
    
    FROM n8n_olap.fact_technical_indicators AS t
    INNER JOIN n8n_olap.fact_stock_prices AS p
        ON t.symbol = p.symbol AND t.trade_date = p.trade_date
    WINDOW w AS (PARTITION BY symbol ORDER BY trade_date ASC)
)
SELECT
    symbol,
    trade_date,

    -- SMA 20 Slopes
    (sma_20 - sma_20_lag_1) / 1.0 AS sma_20_slope_k1,
    (sma_20 - sma_20_lag_5) / 5.0 AS sma_20_slope_k5,

    -- SMA 50 Slopes
    (sma_50 - sma_50_lag_1) / 1.0 AS sma_50_slope_k1,
    (sma_50 - sma_50_lag_5) / 5.0 AS sma_50_slope_k5,

    -- SMA 100 Slopes
    (sma_100 - sma_100_lag_1) / 1.0 AS sma_100_slope_k1,
    (sma_100 - sma_100_lag_5) / 5.0 AS sma_100_slope_k5,

    -- Crossover Signal SMA 20/50
    CASE
        WHEN (delta_sma_20_50 > 0 AND delta_sma_20_50_lag_1 <= 0) THEN 1
        WHEN (delta_sma_20_50 < 0 AND delta_sma_20_50_lag_1 >= 0) THEN -1
        ELSE 0
    END AS signal_crossover_sma_20_50,

    -- Crossover Signal SMA 50/100
    CASE
        WHEN (delta_sma_50_100 > 0 AND delta_sma_50_100_lag_1 <= 0) THEN 1
        WHEN (delta_sma_50_100 < 0 AND delta_sma_50_100_lag_1 >= 0) THEN -1
        ELSE 0
    END AS signal_crossover_sma_50_100,

    -- Volume IQR Outer Bounds
    volume_upper_bound,
    volume_lower_bound,

    -- Volume Outlier Signal
    CASE
        WHEN volume > volume_upper_bound THEN 1
        WHEN volume < volume_lower_bound THEN -1
        ELSE 0
    END AS signal_volume_outlier,

    -- Pivot Point Metrics for Next Session (t+1) calculated from Current Session (t)
    (high_price + low_price + close_price) / 3.0 AS pivot_point_plus_1,
    (2.0 * ((high_price + low_price + close_price) / 3.0)) - high_price AS pivot_s1_plus_1,
    ((high_price + low_price + close_price) / 3.0) - (high_price - low_price) AS pivot_s2_plus_1

FROM base_data;