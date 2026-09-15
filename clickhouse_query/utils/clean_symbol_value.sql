""" Create a temporary table to hold the original data """
CREATE TABLE n8n_olap.fact_market_data_temp AS n8n_olap.fact_market_data;

""" Clean the symbol values in the original table """
INSERT INTO n8n_olap.fact_market_data_temp (
    symbol,
    trade_date,
    open,
    high,
    low,
    close,
    adj_close,
    volume,
    trading_value,
    updated_at
)
SELECT
    trim(replaceRegexpAll(replaceRegexpAll(original_symbol, '[^a-zA-Z0-9\\s]', ''), '\\s+', ' ')) AS symbol
    trade_date,
    open,
    high,
    low,
    close,
    adj_close,
    volume,
    trading_value,
    updated_at
FROM n8n_olap.fact_market_data;

""" Replace the original table with the cleaned data """
EXCHANGE TABLES n8n_olap.fact_market_data AND n8n_olap.fact_market_data_temp;