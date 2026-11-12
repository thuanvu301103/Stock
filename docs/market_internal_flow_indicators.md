## Market Breadth

Market breadth measures how broadly an index's constituent securities participate in a market move. The source fields are `advances`, `declines`, and `nochanges` from `n8n_olap.fact_exchange_index_histories`. Calculations are performed per `index_id` and exchange trading date (`time`, stored as `Date`).

### Net Breadth

Calculates the difference between advancing and declining constituents for index $j$ at session $t$:

$$\text{NetBreadth}_{j,t} = \text{Advances}_{j,t} - \text{Declines}_{j,t}$$

**Where:**

* $j$: The exchange index being measured.
* $t$: The trading session being measured.
* $\text{Advances}_{j,t}$: Number of constituents whose prices advanced during session $t$.
* $\text{Declines}_{j,t}$: Number of constituents whose prices declined during session $t$.

Interpretation:

* $\text{NetBreadth}_{j,t} > 0$: More constituents advanced than declined.
* $\text{NetBreadth}_{j,t} = 0$: Advances and declines were equal.
* $\text{NetBreadth}_{j,t} < 0$: More constituents declined than advanced.

### Cumulative Advance/Decline Line

Accumulates daily net breadth to show whether participation is strengthening or weakening over time:

$$\text{CumulativeAD}_{j,t} = \text{CumulativeAD}_{j,t-1} + \text{NetBreadth}_{j,t}$$

Keep the baseline and history start date consistent when rebuilding the series; changing either shifts the line. The workflow loads 30 calendar days before the requested start date as calculation history.

### Breadth Ratio

Normalizes net breadth by the number of advancing and declining constituents, making breadth more comparable across indices with different constituent counts:

$$\text{BreadthRatio}_{j,t} = \frac{\text{Advances}_{j,t} - \text{Declines}_{j,t}}{\text{Advances}_{j,t} + \text{Declines}_{j,t}}$$

The ratio ranges from $-1$ to $1$. Unchanged constituents are not included in the denominator.

> *Technical Constraint:* If there are no advancing or declining constituents, the denominator is zero and the ratio is undefined. Represent this observation as missing or define a consistent sentinel before storing it.

---

## Advance/Decline Line Slope

Measures the direction and rate of change of the cumulative Advance/Decline Line over a lookback window of $k$ sessions:

$$\text{ADSlope}_{j,t,k} = \frac{\text{CumulativeAD}_{j,t} - \text{CumulativeAD}_{j,t-k}}{k}$$

The table stores the one-session slope as `ad_slope` ($k=1$) and the five-session slope as `ad_slope_5` ($k=5$).

Directional Interpretation:

* $\text{ADSlope}_{j,t,k} > 0$: Participation is improving.
* $\text{ADSlope}_{j,t,k} = 0$: Net participation is unchanged over the lookback window.
* $\text{ADSlope}_{j,t,k} < 0$: Participation is weakening.

> *Technical Constraint:* Calculating a $k$-session slope requires at least $k+1$ daily observations of the cumulative A/D Line. The five-session slope is measured across five session intervals, from $t-5$ to $t$.

---

## Index Return Differential

Compares an index's return with a benchmark's return over the same interval:

$$\text{Return}_{j,t} = 100 \times \left(\frac{\text{IndexValue}_{j,t}}{\text{IndexValue}_{j,t-1}} - 1\right)$$

$$\text{IndexReturnDifferential}_{j,t} = \text{Return}_{j,t} - \text{Return}_{b(j),t}$$

**Where:**

* $j$: The index being measured.
* $b(j)$: The benchmark configured for index $j$.
* $\text{IndexValue}_{j,t}$: Closing index value for session $t$.
* $\text{Return}_{j,t}$: One-session percentage return for index $j$.

The tracking workflow currently uses `VNINDEX` as the benchmark for every index. The result is expressed in percentage points. A positive value means the index outperformed `VNINDEX` during the interval; a negative value means it underperformed.

> *Technical Constraint:* Align the index and `VNINDEX` to the same trading sessions and return interval. The workflow currently stores `0.0` when the return differential is unavailable, so zero may mean either no relative return or unavailable input. A zero prior index value also makes the return undefined.

---

## Calculation Notes

* Calculate each indicator independently for each `index_id`, in chronological order.
* Use one observation per exchange trading date. Do not sum repeated intraday snapshots of advances and declines.
* These indicators describe market participation and relative index performance. They are not direct measures of investor or institutional cash flows.

## Storage

The indicator records are stored in `n8n_olap.fact_market_flow_indicators`:

| Column | Type | Description |
|---|---|---|
| `index_id` | `LowCardinality(String)` | Exchange index identifier. |
| `time` | `Date` | Exchange trading date. |
| `net_breadth` | `Int32` | Advances minus declines. |
| `cumulative_ad` | `Int32` | Cumulative net breadth. |
| `ad_slope` | `Float64` | One-session change in the cumulative A/D line. |
| `ad_slope_5` | `Float64` | Five-session change per session in the cumulative A/D line. |
| `breadth_ratio` | `Float64` | Normalized net breadth. |
| `index_return_differential` | `Float64` | Index return minus the `VNINDEX` return, in percentage points. |
| `updated_at` | `DateTime` | Time the row was written or replaced. |

The table definition is in [`clickhouse_query/create_table/create_fact_market_flow_indicators.sql`](../clickhouse_query/create_table/create_fact_market_flow_indicators.sql). Source index history is documented in [`exchange_indices.md`](exchange_indices.md).

## Workflow

Run the standalone n8n workflow with `POST /webhook/track-market-flow-indicators`. Optional `start_date` and `end_date` query parameters use `YYYY-MM-DD`; when omitted, both default to the current date. The SSI full workflow also runs market-flow tracking after mining exchange-index history.
