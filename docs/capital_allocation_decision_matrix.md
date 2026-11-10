# Capital Allocation Decision Matrix by Market Regime

This document explains the sample matrix in [capital_allocation_decision_matrix_sample.json](../scripts/samples/capital_allocation_decision_matrix_sample.json). The percentages represent **target allocations that the system should guide the portfolio toward under each market regime**. They are not instructions to immediately divide an amount entered by a user, and the sample is not currently an automatically executed system configuration.

> The percentages below are target rules from the sample file. Before automating them, define the portfolio value, how cash is measured, which assets belong to each category, and the trading process. The examples in this document illustrate the calculations only; they are not investment recommendations.

## Meaning of the allocation fields

| Field | Meaning |
|---|---|
| `w_stock` | Target percentage of the total portfolio allocated to equities. |
| `w_cash` | Target percentage of the total portfolio held as cash. For REGIME_1 through REGIME_4, `w_stock + w_cash = 100`. |
| `w_vn30/w_stock` | VN30 percentage **within the equity allocation**, not a percentage of the total portfolio. |
| `w_midcap/w_stock` | Mid-cap percentage **within the equity allocation**. The VN30 and mid-cap percentages sum to 100% in each row. |
| `w_stock*`, `w_cash*` | Separate percentages for the conditional exploratory-buy scenario in REGIME_5. The asterisk marks a special branch; these percentages are not added to `w_stock`/`w_cash`. The sample does not clearly define the denominator for this pair; see the REGIME_5 notes below. |

## Target allocations by regime

| Regime | Equities (% of total portfolio) | Cash (% of total portfolio) | Mix within the equity allocation |
|---|---:|---:|---|
| `REGIME_1` | 80% | 20% | 40% VN30, 60% mid-cap |
| `REGIME_2` | 50% | 50% | 80% VN30, 20% mid-cap |
| `REGIME_3` | 50% | 50% | 50% VN30, 50% mid-cap |
| `REGIME_4` | 20% | 80% | 100% VN30, 0% mid-cap |
| `REGIME_5` — base defensive target | 20% | 80% | 70% VN30, 30% mid-cap |

The VN30/mid-cap percentages apply to the **equity allocation**. To convert them into percentages of the total portfolio, multiply the two levels. For example, in REGIME_1, VN30 is $80\% \times 40\% = 32\%$ of the total portfolio, while mid-cap is $80\% \times 60\% = 48\%$.

## Correct interpretation: portfolio targets, not a split of a new deposit

The system should compare the **current value of holdings** with the **target values** implied by the regime weights. Any purchases or sales intended to move the portfolio toward its targets should be based on those differences, while accounting for available cash, pending orders, transaction costs, and any operational limits that are later defined. The system should not assume that it should divide the entire amount selected by the user according to `w_stock`/`w_cash`.

For example, consider an existing portfolio worth VND 500 million in REGIME_1:

| Category | Current value | Target value | Illustrative difference |
|---|---:|---:|---:|
| Equities | VND 200 million (40%) | VND 400 million (80%) | Net increase of VND 200 million |
| Cash | VND 300 million (60%) | VND 100 million (20%) | Decrease of VND 200 million |

The VND 400 million equity target consists of VND 160 million in VN30 (40% of VND 400 million) and VND 240 million in mid-cap (60% of VND 400 million). The system would guide the existing portfolio toward these target values. This example does not mean that the user must enter VND 500 million or that the system automatically places orders.

If the user adds only VND 50 million to that portfolio, the system should **not** apply 80/20 to the deposit alone and conclude that it should buy VND 40 million of equities and keep VND 10 million as cash as if those were the portfolio targets. Instead, it should recalculate the total portfolio value after the deposit and compare the new target balances with the current equity and cash holdings. For example, if the full VND 50 million is added as cash, the portfolio becomes VND 550 million; its REGIME_1 targets become VND 440 million in equities and VND 110 million in cash. Compared with VND 200 million in equities and VND 350 million in cash, the illustrative target difference is VND 240 million in each direction.

### Do not confuse this matrix with the portfolio optimizer's inputs

In Power BI, a separate optimization query uses `TotalInvestment` as the budget for calculating allocations among the tickers in `SelectedSymbols`. That is an input to the equity optimization problem, **not** the denominator for this regime matrix. The matrix describes the target structure of the entire portfolio. The two mechanisms should only be connected if the product explicitly defines how the overall portfolio targets translate into a budget for ticker selection.

## Special handling for `REGIME_5` (Panic)

REGIME_5 should be treated as two layers, not combined into a single allocation:

1. **Base defensive target:** equities are 20% of the total portfolio and cash is 80%. Within that 20% equity allocation, VN30 is 70% and mid-cap is 30%. This corresponds to 14% of the total portfolio in VN30, 6% in mid-cap, and 80% in cash.
2. **Conditional exploratory-buy branch:** consider it only when a momentum indicator, RSI/Stochastic, enters the oversold zone—i.e. its value is **below 20**. This is a separate condition in the JSON description; it should not be read as a buy trigger on every day classified as REGIME_5.
3. **Do not add `w_stock*` to `w_stock`:** the asterisk values (`w_stock* = 30`, `w_cash* = 70`) form a separate 100% allocation. They do not add 30 percentage points of equities to the 20% base target. Mechanically adding both layers would produce 50% equities + 150% cash = 200% of the total portfolio, which conflicts with the defensive intent of the Panic description.
4. **The denominator for the `*` branch is unspecified:** the JSON does not say whether 30/70 applies to total NAV, the cash portion, or a separate exploratory-buy budget/deployment amount. Therefore, `w_stock*` cannot be converted into a unique monetary amount until this convention is defined. A model-level approach would be to treat the percentages as applying within a separate exploratory budget determined by the system, but that budget's size must be specified; it must not be inferred from an amount entered by the user.
5. **The regime condition and buy condition are different:** the classifier currently checks Panic conditions such as very weak breadth, few stocks at ceiling, and many stocks at floor. RSI/Stochastic <20 appears in the allocation matrix as a condition for the exploratory branch, but is not part of the regime-classification condition in the current workflow. The notation `RSI/Stochastic` does not clarify whether both indicators must be below 20 or only one; define that rule and evaluate both the regime condition and indicator condition before applying the branch.

### REGIME_5 example

Assume the portfolio has a NAV of VND 500 million. The REGIME_5 base target is VND 100 million in equities and VND 400 million in cash. Within the VND 100 million equity target, approximately VND 70 million is allocated to VN30 and VND 30 million to mid-cap.

If the system separately defines an exploratory budget of VND 10 million and RSI/Stochastic is below 20, `w_stock*`/`w_cash*` would correspond to VND 3 million for exploratory equities and VND 7 million retained as cash **within that VND 10 million exploratory budget**. This illustrates the calculation only after a denominator of VND 10 million has been chosen; the JSON does not specify VND 10 million, and it must not default to an amount entered by the user. Likewise, do not mechanically add VND 3 million if the base equity target has already been reached; assess the total NAV and portfolio state after any trade.

## Scope and decisions required before automation

- The JSON file is a sample matrix; no workflow has been identified that reads it to automatically rebalance the portfolio or place orders.
- The matrix does not define the exact VN30/mid-cap universe, NAV calculation, regime update timing, permitted deviation thresholds, fees/taxes, lot sizes, or rounding rules.
- Define the denominator and size of the `w_stock*`/`w_cash*` branch, and clarify whether the branch replaces or adjusts the base target during exploratory buying.
- The matrix does not specify what to do if the oversold condition is only partially met, nor how to exit the exploratory branch.
- These are target allocations for the system to work toward, not investment advice or a guarantee that the exact weights will be achieved.
