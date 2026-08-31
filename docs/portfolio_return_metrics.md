## Expected Return (Short-term Expected Return - 2-Period Log Return)

### General Mathematical Formula

$$\text{ExpectedReturn}_{t, n} = \frac{\sum_{i=0}^{n-1} r_{t-i}}{n}$$

$$r_t = \ln\left(\frac{P_t}{P_{t-2}}\right)$$

**Where:**

* $n$: The calculation lookback period (specifically $20$ trading sessions).
* $t$: The current trading session being calculated.
* $P_t$: The closing price (Close Price) at session $t$.
* $P_{t-2}$: The closing price at session $t-2$ (2 trading sessions prior).
* $r_t$: The 2-period logarithmic return at session $t$.

### Specific Formulas for Each Indicator

#### Expected Return T2 N20 (Standard 20-Period Expected Return)

Calculated as the arithmetic mean of the 2-period log returns over the last 20 trading sessions.

$$\text{ExpectedReturn}_{T2, 20, t} = \frac{r_t + r_{t-1} + r_{t-2} + \dots + r_{t-19}}{20}$$

> *Technical Constraint:* A minimum of **22 consecutive sessions** of historical data (20 intervals of 2-period log returns) is required to compute the first valid $\text{ExpectedReturn}_{T2, 20, t}$ value.

---

## Volatility (Short-term Volatility - 2-Period Standard Deviation)

### General Mathematical Formula

$$\text{Volatility}_{t, n} = \sqrt{\frac{\sum_{i=0}^{n-1} (r_{t-i} - \bar{r}_{t, n})^2}{n - 1}}$$

$$\bar{r}_{t, n} = \text{ExpectedReturn}_{t, n}$$

**Where:**

* $n$: The calculation lookback period (specifically $20$ trading sessions).
* $t$: The current trading session being calculated.
* $r_{t-i}$: The 2-period logarithmic return at session $t-i$.
* $\bar{r}_{t, n}$: The mean of 2-period log returns ($\text{ExpectedReturn}_{t, n}$) over the $n$-session window.

### Specific Formulas for Each Indicator

#### Volatility T2 N20 (Standard 20-Period Volatility)

Calculated as the sample standard deviation of 2-period log returns over the last 20 trading sessions to measure short-term price dispersion and risk.

$$\text{Volatility}_{T2, 20, t} = \sqrt{\frac{\sum_{i=0}^{19} (r_{t-i} - \text{ExpectedReturn}_{T2, 20, t})^2}{19}}$$

> *Technical Constraint:* A minimum of **22 consecutive sessions** of historical data is required to compute the first valid $\text{Volatility}_{T2, 20, t}$ value.

---

## Derived Metrics

### Short-Term Sharpe Ratio (Risk-Adjusted Return Metric)

Measures the risk-adjusted return performance per unit of short-term volatility over a 20-session window.

$$\text{Sharpe}_{T2, 20, t} = \frac{\text{ExpectedReturn}_{T2, 20, t}}{\text{Volatility}_{T2, 20, t}}$$

Where:

* $\text{ExpectedReturn}_{T2, 20, t}$: The expected 2-period log return at session $t$.
* $\text{Volatility}_{T2, 20, t}$: The 2-period log return standard deviation at session $t$.

Threshold Interpretation:

* $\text{Sharpe}_{T2, 20, t} \ge 0.50$: Optimal risk-adjusted momentum (Return sufficiently offsets historical volatility).
* $0 < \text{Sharpe}_{T2, 20, t} < 0.50$: Weak positive return relative to price fluctuation.
* $\text{Sharpe}_{T2, 20, t} \le 0$: Negative return trend.

### Quantitative Buy Signal

Generates a binary entry flag $\text{BuySignal}_t \in \{0, 1\}$ by combining bounded volatility, positive expected return, and minimum risk-adjusted efficiency criteria.

$$\text{BuySignal}_t = \begin{cases} 1 & \text{if } 0.0100 \le \text{Volatility}_{T2, 20, t} \le 0.0450 \\ & \text{and } 0.0050 \le \text{ExpectedReturn}_{T2, 20, t} \le 0.0350 \\ & \text{and } \text{Sharpe}_{T2, 20, t} \ge 0.40 \\ 0 & \text{otherwise} \end{cases}$$

> *Technical Constraint:* Determining a valid $\text{BuySignal}_t$ event requires a minimum of **22 consecutive sessions** of historical closing price data.