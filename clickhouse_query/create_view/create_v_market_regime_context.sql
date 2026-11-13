CREATE OR REPLACE VIEW n8n_olap.v_market_regime_context AS
SELECT
    vnindex.time AS time,
    vnindex.index_id AS index_id,
    vnindex_flow.cumulative_ad AS cumulative_ad,
    vnindex_flow.ad_slope_5 AS ad_slope_5,
    vnindex.change_percent AS return,
    vnindex.all_value AS all_value,
    if(
        count() OVER (
            ORDER BY vnindex.time
            ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
        ) = 20,
        avg(vnindex.all_value) OVER (
            ORDER BY vnindex.time
            ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
        ),
        NULL
    ) AS ma20_value,
    vnindex.advances AS advances,
    vnindex.declines AS declines,
    if(
        vnindex.declines = 0,
        toFloat64(vnindex.advances),
        toFloat64(vnindex.advances) / vnindex.declines
    ) AS ratio_ad,
    vnindex.ceiling AS ceiling,
    vnindex.floor AS floor,
    vn30_flow.index_return_differential
        AS index_return_differential_vn30_vnindex
FROM
(
    SELECT
        time,
        index_id,
        change_percent,
        all_value,
        advances,
        declines,
        ceiling,
        floor
    FROM n8n_olap.fact_exchange_index_histories FINAL
    WHERE index_id = 'VNINDEX'
) AS vnindex
INNER JOIN
(
    SELECT
        time,
        cumulative_ad,
        ad_slope_5
    FROM n8n_olap.fact_market_flow_indicators FINAL
    WHERE index_id = 'VNINDEX'
) AS vnindex_flow
    ON vnindex.time = vnindex_flow.time
INNER JOIN
(
    SELECT
        time,
        index_return_differential
    FROM n8n_olap.fact_market_flow_indicators FINAL
    WHERE index_id = 'VN30'
) AS vn30_flow
    ON vnindex.time = vn30_flow.time;
