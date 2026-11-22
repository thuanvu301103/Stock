-- Parent table using a composite primary key without a surrogate id column
CREATE TABLE orders (
    account_id VARCHAR(50) NOT NULL,
    trade_date TIMESTAMPTZ NOT NULL,
    trade_type VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (account_id, trade_date, trade_type)
);

-- Child table referencing the composite key of stock_orders
CREATE TABLE order_items (
    account_id VARCHAR(50) NOT NULL,
    trade_date TIMESTAMPTZ NOT NULL,
    trade_type VARCHAR(10) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    price NUMERIC(18, 2) NOT NULL CHECK (price >= 0),
    total_amount NUMERIC(20, 2) GENERATED ALWAYS AS (quantity * price) STORED,
    PRIMARY KEY (account_id, trade_date, trade_type, symbol),
    FOREIGN KEY (account_id, trade_date, trade_type)
        REFERENCES stock_orders (account_id, trade_date, trade_type)
        ON DELETE CASCADE
);