## Simple Moving Average (SMA) 

### General Mathematical Formula

$$SMA_{n, t} = \frac{\sum_{i=0}^{n-1} P_{t-i}}{n} = \frac{P_t + P_{t-1} + P_{t-2} + \dots + P_{t-n+1}}{n}$$

**Where:**

* $n$: The calculation period (specifically $20$, $50$, or $100$ trading sessions).
* $t$: The current trading session being calculated.
* $P_t$: The closing price (Close Price) at session $t$.
* $P_{t-i}$: The closing price of $i$ sessions prior.

### Specific Formulas for Each Indicator

#### SMA 20 (Short-term Moving Average - 20 Periods)

Calculated as the arithmetic mean of the closing prices from the last 20 trading sessions.

$$SMA_{20, t} = \frac{P_t + P_{t-1} + P_{t-2} + \dots + P_{t-19}}{20}$$

> *Technical Constraint:* A minimum of **20 consecutive sessions** of historical data for a specific stock symbol is required to compute the first valid $SMA_{20}$ value.

#### SMA 50 (Medium-term Moving Average - 50 Periods)

Calculated as the arithmetic mean of the closing prices from the last 50 trading sessions.

$$SMA_{50, t} = \frac{P_t + P_{t-1} + P_{t-2} + \dots + P_{t-49}}{50}$$

> *Technical Constraint:* A minimum of **50 consecutive sessions** of historical data is required to compute the first valid $SMA_{50}$ value.

#### SMA 100 (Medium-to-Long-term Moving Average - 100 Periods)

Calculated as the arithmetic mean of the closing prices from the last 100 trading sessions.

$$SMA_{100, t} = \frac{P_t + P_{t-1} + P_{t-2} + \dots + P_{t-99}}{100}$$

> *Technical Constraint:* A minimum of **100 consecutive sessions** of historical data is required to compute the first valid $SMA_{100}$ value.

---

## Relative Strength Index (RSI)

### General Mathematical Formula

$$RSI_{n, t} = 100 - \left( \frac{100}{1 + RS_{n, t}} \right)$$

$$RS_{n, t} = \frac{AG_{n, t}}{AL_{n, t}}$$

**Where:**

* $n$: The calculation period (typically 14 trading sessions).
* $t$: The current trading session being calculated.
* $RS_{n, t}$: The Relative Strength ratio at session $t$.
* $AG_{n, t}$: The Average Gain over $n$ sessions at time $t$.
* $AL_{n, t}$: The Average Loss over $n$ sessions at time $t$.

### Average Gain and Average Loss Calculations

The calculation method differs between the initial session and subsequent sessions due to the application of Wilder's Smoothing Technique.

#### 1. Initial Values ($t = n$)

For the first valid session at $t = n$:

$$AG_{n, n} = \frac{\sum_{i=0}^{n-1} \max(0, P_{n-i} - P_{n-i-1})}{n}$$

$$AL_{n, n} = \frac{\sum_{i=0}^{n-1} \max(0, P_{n-i-1} - P_{n-i})}{n}$$

#### 2. Subsequent Values ($t > n$)

For all sessions after $t = n$, using Wilder's smoothing method:

$$AG_{n, t} = \frac{AG_{n, t-1} \times (n - 1) + \text{Gain}_t}{n}$$

$$AL_{n, t} = \frac{AL_{n, t-1} \times (n - 1) + \text{Loss}_t}{n}$$

**Where:**

* $\text{Gain}_t = \max(0, P_t - P_{t-1})$
* $\text{Loss}_t = \max(0, P_{t-1} - P_t)$
* $P_t$: The closing price at session $t$.

### Specific Formulas for Each Indicator

#### RSI 14 (Standard Relative Strength Index - 14 Periods)

Calculated using a 14-session lookback window.

$$RSI_{14, t} = 100 - \left( \frac{100}{1 + \frac{AG_{14, t}}{AL_{14, t}}} \right)$$

> *Technical Constraint:* A minimum of **15 consecutive sessions** of historical closing prices (14 price change intervals) is required to compute the first valid $RSI_{14}$ value.

#### RSI 7 (Short-term Relative Strength Index - 7 Periods)

Calculated using a 7-session lookback window for higher sensitivity.

$$RSI_{7, t} = 100 - \left( \frac{100}{1 + \frac{AG_{7, t}}{AL_{7, t}}} \right)$$

> *Technical Constraint:* A minimum of **8 consecutive sessions** of historical closing prices (7 price change intervals) is required to compute the first valid $RSI_{7}$ value.

#### RSI 21 (Longer-term Relative Strength Index - 21 Periods)

Calculated using a 21-session lookback window for reduced noise.

$$RSI_{21, t} = 100 - \left( \frac{100}{1 + \frac{AG_{21, t}}{AL_{21, t}}} \right)$$

> *Technical Constraint:* A minimum of **22 consecutive sessions** of historical closing prices (21 price change intervals) is required to compute the first valid $RSI_{21}$ value.