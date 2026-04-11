SELECT DISTINCT symbol 
FROM n8n_olap.fact_stock_prices
WHERE symbol NOT IN (SELECT stock_key FROM n8n_olap.dim_stock);