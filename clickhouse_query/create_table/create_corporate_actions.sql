CREATE TABLE n8n_olap.corporate_actions
(
    symbol LowCardinality(String),          -- Stock symbol (e.g., X20, TSJ, NSC)
    event_type LowCardinality(String),      -- Type of event (e.g., Cash Dividend, Stock Dividend)
    description String,                     -- Detailed event description
    ex_rights_date Date,                    -- Ex-rights date
    record_date Date,                       -- Record date / Closing date
    payment_date Nullable(Date),            -- Payment date (nullable if not announced yet)
    created_at DateTime DEFAULT now()       -- Ingestion timestamp
)
ENGINE = ReplacingMergeTree(created_at)
PRIMARY KEY (symbol, ex_rights_date)
ORDER BY (symbol, ex_rights_date, event_type);