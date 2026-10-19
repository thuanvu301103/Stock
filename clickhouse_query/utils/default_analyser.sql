SELECT 
    symbol as stock_key,
    trade_date as date_key,
    sma_20_slope_k1,
    sma_20_slope_k5,
    sma_50_slope_k1,
    sma_50_slope_k5,
    signal_crossover_sma_20_50,
    signal_crossover_sma_50_100,
    expected_return_t2_n20,
    volatility_t2_n20,
    rsi_7,
    rsi_14,
    signal_volume_outlier,
    days_since_volume_outlier
FROM n8n_olap.v_analytics_master_consolidated
WHERE date_key >= '2026-10-19' 
    AND date_key < '2026-10-20'
    AND signal_crossover_sma_50_100 >= 0
    AND rsi_14 BETWEEN 30 AND 70
    AND volume >= 50000
    AND sma_50_slope_k1 >= 0
    AND sma_20_slope_k1 >= 0
    AND sma_20_slope_k5 >= 0
    AND sma_50_slope_k5 >= 0
    AND volatility_t2_n20 BETWEEN 0.01 AND 0.05
    AND expected_return_t2_n20 BETWEEN 0.002 AND 0.055
    AND rsi_7 BETWEEN 40 AND 85
    AND signal_crossover_sma_20_50 >= 0
    AND signal_volume_outlier = 0
    AND close >= 15
    AND days_since_volume_outlier >= 4
ORDER BY 
    expected_return_t2_n20 DESC,
    stock_key ASC,
    date_key ASC,
    sma_20_slope_k1 ASC,
    sma_20_slope_k5 ASC,
    sma_50_slope_k1 ASC,
    sma_50_slope_k5 ASC,
    signal_crossover_sma_20_50 ASC,
    signal_crossover_sma_50_100 ASC,
    volatility_t2_n20 ASC,
    rsi_7 ASC,
    rsi_14 ASC,
    signal_volume_outlier ASC,
    days_since_volume_outlier ASC
LIMIT 501;