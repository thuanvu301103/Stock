# Market Regime Engine

This document describes a five-state market classification framework based on market breadth, the Advance/Decline (A/D) Line, and the VN30–VNINDEX return differential. The thresholds in the regime table follow [`market_regime_rules_sample.json`](../scripts/samples/market_regime_rules_sample.json); the implementation is illustrated in [`market_regime_classify.js`](../scripts/market_regime_classify.js).

## Input Variables

| Variable | Definition | Unit / usage |
|---|---|---|
| $\Delta AD_5$ | Five-session slope of the cumulative A/D Line, corresponding to `ad_slope_5` in the market-flow indicators table | Breadth units per session; at least six session observations are required to calculate a five-session slope. |
| $R_{AD}$ | Ratio of advancing to declining stocks: $\text{Advances}/\text{Declines}$ | A ratio, not a percentage. When the number of declines is zero, use a consistent convention; the current script substitutes the number of advances. |
| $D_{VN30}$ | VN30 return minus VNINDEX return over the same session | Percentage points; for example, `0.5` means a 0.5 percentage-point difference. |
| `ceiling`, `floor` | Number of stocks at the ceiling and floor price during the session | Stock counts; used by the panic condition. |

`advances`, `declines`, `ceiling`, `floor`, and `index_value` are available in `n8n_olap.fact_exchange_index_histories`. A/D indicators are stored in `n8n_olap.fact_market_flow_indicators`. See the [exchange index schema](exchange_indices.md) and [market-flow indicators](market_internal_flow_indicators.md).

## Five-State Regime Classification

The engine evaluates conditions in ascending priority order and selects the first matching regime.

| Priority | Regime code | State | Condition from the rule sample | Interpretation |
|---:|---|---|---|---|
| 1 | `REGIME_5` | Capitulation / Panic | $R_{AD} < 0.2$ **AND** `ceiling < 5` **AND** `floor >= 30` | Extreme selling pressure, with very weak breadth and many stocks at the floor price. |
| 2 | `REGIME_1` | Broad Uptrend | $\Delta AD_5 > 0$ **AND** $R_{AD} \ge 1.5$ **AND** $abs(D_{VN30}) \le 0.1$ | The advance is broad-based, while VN30 and VNINDEX returns remain close. |
| 3 | `REGIME_2` | Narrow Uptrend | $\Delta AD_5 \le 0$ **AND** $R_{AD} < 1.0$ **AND** $D_{VN30} > 0.5$ | VN30 outperforms while overall market breadth is weak. |
| 4 | `REGIME_3` | Sideways / Rotation | $abs(\Delta AD_5) \le 0.05$ **AND** $0.8 \le R_{AD} \le 1.2$ | Breadth is balanced and the A/D Line is nearly flat, potentially indicating rotation among groups. |
| 5 | `REGIME_4` | Broad Downtrend | $\Delta AD_5 < 0$ **AND** $R_{AD} \le 0.66$ | Selling pressure is broad across the market. |

The conditions shown are the exact checks in the rule sample. For example, `ABS_APPROX(x, 0, 0.1)` is equivalent to $|x| \le 0.1$. If no regime matches, the script has a fallback based on `delta_ad`; ensure this input is provided and consistent with the chosen A/D calculation.

## Implementation Notes

* **Panic threshold differs across sources:** The initial description says `ceiling ≈ 0`; the rule sample uses `ceiling < 5`, while the test rules embedded in the script use `ceiling == 0`. Choose and align on one threshold before production use.
* **Map rule fields to engine inputs:** The rule sample references `ratio_ad` and `index_return_differential_vn30_vnindex`, while the script's `evaluate()` method calculates `r_ad` and `d_vn30`. The integration layer must map inputs to the field names expected by the rules.
* **Do not confuse breadth ratios:** `breadth_ratio` in the market-flow table is calculated as $(\text{Advances}-\text{Declines})/(\text{Advances}+\text{Declines})$. This differs from the classifier's $R_{AD}=\text{Advances}/\text{Declines}$.
* **Threshold tolerances:** The `0.1` tolerance for $D_{VN30}$ and `0.05` tolerance for $\Delta AD_5$ are specific values in the sample rules, replacing the approximate notation in the conceptual description.
* **Align units and sessions:** Calculate VN30 and VNINDEX returns over the same interval and session. Keep the lookback window, A/D baseline, and zero-denominator handling consistent.
