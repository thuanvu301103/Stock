CREATE OR REPLACE VIEW n8n_olap.v_analytics_master_consolidated AS
SELECT
    coalesce(v.symbol, p.symbol, m.symbol, t.symbol) AS symbol,
    coalesce(v.trade_date, p.trade_date, m.trade_date, t.trade_date) AS trade_date,

    -- Derived Metrics from v_derived_metrics
    v.sma_20_slope_k1,
    v.sma_20_slope_k5,
    v.sma_50_slope_k1,
    v.sma_50_slope_k5,
    v.sma_100_slope_k1,
    v.sma_100_slope_k5,
    v.signal_crossover_sma_20_50,
    v.signal_crossover_sma_50_100,
    v.volume_upper_bound,
    v.volume_lower_bound,
    v.signal_volume_outlier,

    -- Market Data from fact_market_data
    m.open,
    m.high,
    m.low,
    coalesce(m.close, p.close_price) AS close,
    m.adj_close,
    m.volume,
    m.trading_value,

    -- Technical Indicators from fact_technical_indicators
    t.sma_20,
    t.sma_50,
    t.sma_100,
    t.rsi_7,
    t.rsi_14,
    t.rsi_21,
    t.volume_iqr_p25,
    t.volume_iqr_p75,
    t.volume_rolling_iqr,

    -- Portfolio Return Metrics from fact_portfolio_return_metrics
    p.log_return_t2,
    p.expected_return_t2_n20,
    p.volatility_t2_n20

FROM n8n_olap.v_derived_metrics AS v

FULL OUTER JOIN (
    SELECT * EXCEPT (updated_at) FROM n8n_olap.fact_portfolio_return_metrics FINAL
) AS p 
    ON v.symbol = p.symbol 
   AND v.trade_date = p.trade_date

FULL OUTER JOIN (
    SELECT * EXCEPT (updated_at) FROM n8n_olap.fact_market_data FINAL
) AS m 
    ON coalesce(v.symbol, p.symbol) = m.symbol 
   AND coalesce(v.trade_date, p.trade_date) = m.trade_date

FULL OUTER JOIN (
    SELECT * EXCEPT (updated_at) FROM n8n_olap.fact_technical_indicators FINAL
) AS t 
    ON coalesce(v.symbol, p.symbol, m.symbol) = t.symbol 
   AND coalesce(v.trade_date, p.trade_date, m.trade_date) = t.trade_date;