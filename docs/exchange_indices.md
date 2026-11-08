### 1. Market Segmentation Across Vietnam's Three Main Exchanges
The index dataset incorporates core representatives from the entire Vietnamese stock market structure, including:

* **HOSE (Ho Chi Minh City Stock Exchange):** Represented by **VNINDEX** (broad market index), **VN30** (top 30 stocks by market capitalization and liquidity), and **VNXALL** (joint broad market index covering both HOSE and HNX).
* **HNX (Hanoi Stock Exchange):** Represented by **HNXIndex** and **HNX30**.
* **UPCoM (Unlisted Public Company Market):** Represented by **HNXUpcomIndex**.

Utilizing this set of indices ensures comprehensive coverage across total market liquidity, capitalization, and price action across all three exchanges without omitting any market segment.

---

### 2. Measuring Liquidity and Capital Concentration (Market Breadth & Liquidity Concentration)
* **Large-Cap Indices (`VN30`, `HNX30`):** Reflect capital flows within blue-chip equities. These indices account for a major share of total market trading value (`all_value`, `total_value`), acting as primary sentiment drivers for institutional liquidity.
* **Broad Market Indices (`VNINDEX`, `HNXIndex`, `HNXUpcomIndex`):** Provide a macro view of overall advance/decline trends across listed equities, serving as foundational inputs for computing market breadth metrics such as the Advance/Decline Line (A/D Line).

---

### 3. ClickHouse Table Schema
The historical index data is stored in `n8n_olap.fact_exchange_index_histories`. Each row contains one daily index observation, along with its price movement, market breadth, and trading activity:

| Column | Type | Description |
|---|---|---|
| `index_id` | `LowCardinality(String)` | Exchange index identifier. |
| `time` | `Date` | Exchange trading date. |
| `index_value` | `Float64` | Index value for the trading date. |
| `change` | `Float64` | Change in index value. |
| `change_percent` | `Float64` | Percentage change in index value. |
| `chart_open` | `Float64` | Opening value used for the index chart. |
| `chart_high` | `Float64` | High value used for the index chart. |
| `chart_low` | `Float64` | Low value used for the index chart. |
| `advances` | `Int32` | Number of advancing constituents. |
| `declines` | `Int32` | Number of declining constituents. |
| `nochanges` | `Int32` | Number of unchanged constituents. |
| `ceiling` | `Int32` | Number of constituents at ceiling price. |
| `floor` | `Int32` | Number of constituents at floor price. |
| `total_qtty` | `UInt64` | Total traded quantity. |
| `total_qtty_pt` | `UInt64` | Total negotiated (put-through) traded quantity. |
| `total_value` | `Float64` | Total traded value. |
| `total_value_pt` | `Float64` | Total negotiated (put-through) traded value. |
| `all_qty` | `UInt64` | Aggregate traded quantity across the market. |
| `all_value` | `Float64` | Aggregate traded value across the market. |

The table uses `ReplacingMergeTree`, partitions records by month with `toYYYYMM(time)`, and orders them by `(index_id, time)`. Market breadth and index returns from this table are used to calculate daily market-flow indicators; see [market internal flow indicators](market_internal_flow_indicators.md).