CREATE OR REPLACE VIEW n8n_olap.v_indicators_normalized AS
WITH base_indicators AS (
    SELECT 
        symbol,
        trade_date,
        close,
        ifNull(greatest(-1, least(1, (close / sma_20 - 1) / 0.05)), 0) AS n_sma,
        ifNull(greatest(-1, least(1, (close / ema_20 - 1) / 0.05)), 0) AS n_ema,
        ifNull((50 - rsi_14) / 50, 0) AS n_rsi,
        ifNull(cmf_21, 0) AS n_cmf
    FROM n8n_olap.v_indicators_base
)
SELECT
    symbol,
    trade_date,
    close,
    n_sma AS norm_sma,
    n_ema AS norm_ema,
    n_rsi AS norm_rsi,
    n_cmf AS norm_cmf,
    -- ADJUST WEIGHTS HERE (Total should be 1.0)
    (n_sma * 0.20) +  -- SMA weight (20%)
    (n_ema * 0.20) +  -- EMA weight (20%)
    (n_rsi * 0.30) +  -- RSI weight (30%) - Higher priority for momentum
    (n_cmf * 0.30)    -- CMF weight (30%) - Higher priority for smart money flow
    AS final_buy_score
FROM base_indicators;