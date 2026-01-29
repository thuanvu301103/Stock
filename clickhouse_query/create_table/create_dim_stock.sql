CREATE TABLE n8n_olap.dim_stock (
    stock_key String,                -- Ticker symbol (FPT, VNM, etc.)
    company_name String,             -- Full corporate name
    sector String,                   -- Broad sector
    industry String,                 -- Specific industry
    exchange LowCardinality(String), -- HOSE, HNX, UPCOM
    market_cap_group String,         -- Bluechip, Midcap, Penny
    listing_date Date,               -- Initial listing date
    is_vn30 UInt8 DEFAULT 0,         -- 1 if in VN30 index, else 0
    updated_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY stock_key;