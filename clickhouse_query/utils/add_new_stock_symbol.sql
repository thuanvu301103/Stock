INSERT INTO n8n_olap.dim_stock (
    stock_key, company_name, sector, industry, exchange, market_cap_group, listing_date, is_vn30
) VALUES (
    'ACE', 
    'Công ty Cổ phần Bê tông Ly tâm An Giang', 
    'Materials', 
    'Building Materials', 
    CAST('UPCOM' AS LowCardinality(String)), 
    'Micro Cap', 
    '2009-11-10', 
    0
);