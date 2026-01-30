SELECT * FROM n8n_olap.v_indicators_base 
WHERE symbol = 'BTC/USDT'
ORDER BY trade_date DESC;

SELECT * FROM n8n_olap.v_indicators_normalized 
WHERE symbol = 'BTC/USDT'
ORDER BY trade_date DESC;