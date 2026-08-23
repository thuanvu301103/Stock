ALTER TABLE [db_name.]table_name
ADD COLUMN <new_column_name> <Data_Type> [DEFAULT <default_value>] [AFTER <existing_column_name>];

--- Example
ALTER TABLE n8n_olap.fact_technical_indicators
    ADD COLUMN iqr_p25 Float32 AFTER macd_histogram,
    ADD COLUMN iqr_p75 Float32 AFTER iqr_p25,
    ADD COLUMN rolling_iqr Float32 AFTER iqr_p75;