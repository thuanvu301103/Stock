# Market Regime Engine

This document combines the market regime classifier, its capital allocation matrix, and sample risk overrides. The rules and allocations are illustrative configurations, not investment recommendations or automatically executed trading instructions.

## 1. Market Regime Classification

The classifier defines five market regimes using market breadth, the Advance/Decline (A/D) Line, and the VN30–VNINDEX return differential. See [`market_regime_rules_sample.json`](../scripts/samples/market_regime_rules_sample.json) for the sample rules and [`market_regime_classify.js`](../scripts/market_regime_classify.js) for the classifier implementation.

### Input variables

| Variable | Definition | Unit / usage |
|---|---|---|
| $\Delta AD_5$ | Five-session slope of the cumulative A/D Line, corresponding to `ad_slope_5` in the market-flow indicators table | Breadth units per session; at least six session observations are required to calculate a five-session slope. |
| $R_{AD}$ | Ratio of advancing to declining stocks: $\text{Advances}/\text{Declines}$ | A ratio, not a percentage. In the script's derived `r_ad` calculation, zero declines fall back to the advances count; align external `ratio_ad` inputs with the same convention. |
| $D_{VN30}$ | VN30 return minus VNINDEX return over the same session | Percentage points; for example, `0.5` means a 0.5 percentage-point difference. |
| `ceiling`, `floor` | Number of stocks at the ceiling and floor price during the session | Stock counts; used by the Panic condition. |

`advances`, `declines`, `ceiling`, `floor`, and `index_value` are available in `n8n_olap.fact_exchange_index_histories`. A/D indicators are stored in `n8n_olap.fact_market_flow_indicators`. See the [exchange index schema](exchange_indices.md) and [market-flow indicators](market_internal_flow_indicators.md).

### Regime rules

The classifier evaluates rules in ascending priority order and uses the first match.

| Priority | Regime code | State | Condition from the sample | Interpretation |
|---:|---|---|---|---|
| 1 | `REGIME_5` | Capitulation / Panic | $R_{AD} < 0.2$ **AND** `ceiling < 5` **AND** `floor >= 30` | Extreme selling pressure, very weak breadth, and many stocks at the floor price. |
| 2 | `REGIME_1` | Broad Uptrend | $\Delta AD_5 > 0$ **AND** $R_{AD} \ge 1.5$ **AND** $\operatorname{abs}(D_{VN30}) \le 0.1$ | The advance is broad-based while VN30 and VNINDEX returns remain close. |
| 3 | `REGIME_2` | Narrow Uptrend | $\Delta AD_5 \le 0$ **AND** $R_{AD} < 1.0$ **AND** $D_{VN30} > 0.5$ | VN30 outperforms while overall market breadth is weak. |
| 4 | `REGIME_3` | Sideways / Rotation | $\operatorname{abs}(\Delta AD_5) \le 0.05$ **AND** $0.8 \le R_{AD} \le 1.2$ | Breadth is balanced and the A/D Line is nearly flat, potentially indicating rotation among groups. |
| 5 | `REGIME_4` | Broad Downtrend | $\Delta AD_5 < 0$ **AND** $R_{AD} \le 0.66$ | Selling pressure is broad across the market. |

The sample's `ABS_APPROX(x, 0, tolerance)` check is equivalent to $\operatorname{abs}(x) \le tolerance$. If none of the rules match, the current classifier falls back based on the sign of `ad_slope_5` (positive → `REGIME_1`, zero → `REGIME_3`, negative → `REGIME_4`).

### Interpretation and implementation notes

* The sample uses `ceiling < 5`; the classifier's embedded test rules use `ceiling == 0`. Align this threshold before production use.
* Rule inputs must use the names expected by the selected rule set. The sample uses `ratio_ad` and `index_return_differential_vn30_vnindex`; `evaluate()` also derives `r_ad` and `d_vn30`. Ensure the integration maps the needed source metrics to the actual fields used by the rules.
* Do not confuse `ratio_ad` with `breadth_ratio`. The latter is calculated as $(\text{Advances}-\text{Declines})/(\text{Advances}+\text{Declines})$, while $R_{AD}=\text{Advances}/\text{Declines}$.
* The `0.1` tolerance for $D_{VN30}$ and `0.05` tolerance for $\Delta AD_5$ are the explicit values in the sample rules.
* Calculate VN30 and VNINDEX returns over the same interval and session. Keep the A/D baseline, lookback window, and zero-denominator handling consistent.

## 2. Capital Allocation

The sample matrix in [`capital_allocation_decision_matrix_sample.json`](../scripts/samples/capital_allocation_decision_matrix_sample.json) defines target allocations for the total portfolio. These are targets to guide portfolio composition, not instructions to divide a new deposit immediately. The matrix is not currently an automatically executed trading configuration.

> Before automating these targets, define portfolio value, how cash is measured, which assets belong to each category, and the trading process. The examples below illustrate calculations only; they are not investment recommendations.

### Allocation fields

| Field | Meaning |
|---|---|
| `w_stock` | Target percentage of the total portfolio allocated to equities. |
| `w_cash` | Target percentage of the total portfolio held as cash. For `REGIME_1` through `REGIME_4`, `w_stock + w_cash = 100`. |
| `w_vn30/w_stock` | VN30 percentage within the equity allocation, not a percentage of the total portfolio. |
| `w_midcap/w_stock` | Mid-cap percentage within the equity allocation. VN30 and mid-cap percentages sum to 100% in each row. |
| `w_stock*`, `w_cash*` | Separate percentages for the conditional exploratory-buy scenario in `REGIME_5`. The sample does not define the denominator for this pair; see the `REGIME_5` notes below. |

### Target allocations by regime

| Regime | Equities (% of total portfolio) | Cash (% of total portfolio) | Mix within the equity allocation |
|---|---:|---:|---|
| `REGIME_1` | 80% | 20% | 40% VN30, 60% mid-cap |
| `REGIME_2` | 50% | 50% | 80% VN30, 20% mid-cap |
| `REGIME_3` | 50% | 50% | 50% VN30, 50% mid-cap |
| `REGIME_4` | 20% | 80% | 80% VN30, 20% mid-cap |
| `REGIME_5` — base defensive target | 20% | 80% | 70% VN30, 30% mid-cap |

The VN30/mid-cap mix applies within the equity allocation. For example, in `REGIME_1`, VN30 represents $80\% \times 40\% = 32\%$ of the total portfolio and mid-cap represents $80\% \times 60\% = 48\%$.

### Portfolio targets, not a split of a new deposit

Compare the current value of holdings with the target values implied by the regime weights. Any trades intended to move the portfolio toward its targets should account for current holdings, available cash, pending orders, transaction costs, and operational limits. Do not apply `w_stock`/`w_cash` to the deposit alone as if those were the total-portfolio targets.

For an illustrative VND 500 million portfolio in `REGIME_1`:

| Category | Current value | Target value | Illustrative difference |
|---|---:|---:|---:|
| Equities | VND 200 million (40%) | VND 400 million (80%) | Net increase of VND 200 million |
| Cash | VND 300 million (60%) | VND 100 million (20%) | Decrease of VND 200 million |

The VND 400 million equity target comprises VND 160 million in VN30 and VND 240 million in mid-cap. If VND 50 million is later added as cash, NAV becomes VND 550 million; `REGIME_1` targets become VND 440 million in equities and VND 110 million in cash. Compared with the resulting VND 200 million in equities and VND 350 million in cash, the illustrative target difference is VND 240 million in each direction.

### Relation to the portfolio optimizer

In Power BI, a separate optimization query uses `TotalInvestment` as the budget for calculating allocations among the tickers in `SelectedSymbols`. That is an input to the equity optimization problem, not the denominator for this regime matrix. Connect the two mechanisms only after defining how the overall portfolio targets translate into a ticker-selection budget.

### Special handling for `REGIME_5` (Panic)

Treat the sample as two separate layers:

1. **Base defensive target:** 20% equities and 80% cash of total portfolio value. Within the equity target, 70% is VN30 and 30% is mid-cap. This equals 14% of total portfolio value in VN30, 6% in mid-cap, and 80% in cash.
2. **Conditional exploratory-buy branch:** the sample describes `w_stock* = 30` and `w_cash* = 70` when a momentum indicator (RSI/Stochastic) enters the oversold zone, below 20. This is separate from the regime-classification condition and is not a buy trigger on every `REGIME_5` day.
3. **Do not add the `*` values to the base allocation:** they form a separate 100% allocation and must not be added to `w_stock`/`w_cash`.
4. **The `*` denominator is unspecified:** the sample does not say whether these percentages apply to total NAV, the cash portion, or a separate exploratory budget. Define the denominator before converting them to amounts; do not infer it from a user-entered amount.
5. **The indicator rule is ambiguous:** `RSI/Stochastic < 20` does not specify whether both indicators or either one must be below 20. Define and evaluate that condition separately from the regime condition.

For example, if a separate exploratory budget of VND 10 million is defined and the indicator condition is met, 30/70 would correspond to VND 3 million for exploratory equities and VND 7 million retained as cash within that budget. The sample does not prescribe that VND 10 million budget. Do not mechanically add the exploratory amount if the base equity target has already been reached; assess the resulting total portfolio state.

## 3. Risk Overrides

The sample rules in [`market_risk_override_rules_sample.json`](../scripts/samples/market_risk_override_rules_sample.json) describe safeguards intended to supersede or cap normal regime allocations. They are configuration examples, not active portfolio controls.

| Override | Sample condition | Intended action |
|---|---|---|
| `EDGE_CASE_1` — Bull on Weight | `return > 1.5 AND ratio_ad < 0.5` | Force `REGIME_2`. The sample description also mentions reducing mid/small-cap exposure and halting new purchases outside large-cap, but those actions are not present in the rule's action list. |
| `EDGE_CASE_2` — Liquidity Crunch | `ma20_value > 0 AND all_value < 0.6 × ma20_value` | Cap maximum stock allocation at 50%. The comparison is strict; equality at 60% does not trigger it. |

For `EDGE_CASE_2`, `all_value` is the current session's aggregate traded value and `ma20_value` is its 20-session moving average. Use the same market-wide value measure, units, and session convention for both. Although the sample description mentions positive A/D breadth, the condition does not check A/D breadth.

**Implementation status:** The classifier currently has the override-rule hookup commented out in its constructor, while `evaluate()` still attempts to iterate `this.overrideRules`; as written, that method can fail unless the property is initialized elsewhere. Its action handling only checks an object property `actions.force_regime`; it does not dispatch the sample's `method`/`args` action arrays or execute `cap_w_stock_max`. Therefore, these sample overrides are not currently executable controls. Wire up the configuration, implement each action, and test the resulting allocation behavior before relying on them.
