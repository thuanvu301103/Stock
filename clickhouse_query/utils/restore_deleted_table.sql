-- Restore a dropped ClickHouse table:
-- 1. Find the table in system.dropped_tables; change the database filter if needed.
-- 2. Replace the database and table below with the names from the result.
-- Run UNDROP TABLE while ClickHouse still retains the dropped table.
SELECT 
    database, 
    table, 
    uuid, 
    engine, 
    table_dropped_time 
FROM system.dropped_tables 
WHERE database = 'n8n_olap';

-- Replace my_table with the dropped table's name.
UNDROP TABLE n8n_olap.my_table;