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

### Derived Metrics

Derived metrics are mathematical features and quantitative signals computed directly from the Simple Moving Average (SMA) values to measure momentum, direction, and state changes.

#### SMA Slope

Calculates the rate of change (steepness and direction) of the SMA over a lookback window of $k$ periods ($k \ge 1$).

$$\text{Slope}_{n, t, k} = \frac{SMA_{n, t} - SMA_{n, t-k}}{k}$$

Where:

* $SMA_{n, t}$: The SMA value of period $n$ at the current session $t$.
* $SMA_{n, t-k}$: The SMA value of period $n$ at $k$ sessions prior.
* $k$: The lookback interval used to determine slope (typically $k = 1$ or $k = 5$).

Directional Interpretation:

* $\text{Slope}_{n, t, k} > 0$: The SMA line is sloping upward (uptrend momentum).
* $\text{Slope}_{n, t, k} = 0$: The SMA line is flat (sideways market / neutral state).
* $\text{Slope}_{n, t, k} < 0$: The SMA line is sloping downward (downtrend momentum).

> *Technical Constraint:* Calculating $\text{Slope}_{n, t, k}$ requires a minimum of **$n + k$ consecutive sessions** of historical price data.

#### Dual SMA Crossover Signal

Identifies state changes and generates binary trading triggers when a short-term SMA ($n_{\text{short}}$) intersects a long-term SMA ($n_{\text{long}}$), where $n_{\text{short}} < n_{\text{long}}$ (e.g., $n_{\text{short}} = 20$, $n_{\text{long}} = 50$).

Define the differential value at session $t$:

$$\Delta SMA_t = SMA_{n_{\text{short}}, t} - SMA_{n_{\text{long}}, t}$$

The quantitative crossover signal $\text{Signal}_t \in \{-1, 0, 1\}$ is evaluated as:

$$\text{Signal}_t =  \begin{cases}  1 & \text{if } \Delta SMA_t > 0 \text{ and } \Delta SMA_{t-1} \le 0 \quad (\text{Golden Cross / Bullish Signal}) \\ -1 & \text{if } \Delta SMA_t < 0 \text{ and } \Delta SMA_{t-1} \ge 0 \quad (\text{Death Cross / Bearish Signal}) \\ 0 & \text{otherwise (No state change)} \end{cases}$$

> *Technical Constraint:* Determining a valid crossover event at session $t$ requires a minimum of **$n_{\text{long}} + 1$ consecutive sessions** of historical data.

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

## Rolling Interquartile Range (Rolling IQR)

### General Mathematical Formula

$$IQR_{n, t} = Q_{3, n, t} - Q_{1, n, t}$$

**Where:**

* $n$: The calculation period (lookback window size, e.g., $n = 20$).
* $t$: The current trading session being calculated.
* $Q_{1, n, t}$: The 1st quartile ($25\text{th}$ percentile) of closing prices over $n$ sessions from $t-n+1$ to $t$.
* $Q_{3, n, t}$: The 3rd quartile ($75\text{th}$ percentile) of closing prices over $n$ sessions from $t-n+1$ to $t$.

### Quartile Calculation Methods

Given an ordered sample $P_{(1)} \le P_{(2)} \le \dots \le P_{(n)}$ derived from closing prices within the window $\{P_t, P_{t-1}, \dots, P_{t-n+1}\}$:

#### 1. First Quartile ($Q_1$)

The $25\text{th}$ percentile value dividing the lowest $25\%$ of the data:

$$Q_{1, n, t} = \text{Percentile}_{0.25}\left(\{P_{t-i}\}_{i=0}^{n-1}\right)$$

#### 2. Third Quartile ($Q_3$)

The $75\text{th}$ percentile value dividing the lowest $75\%$ of the data:

$$Q_{3, n, t} = \text{Percentile}_{0.75}\left(\{P_{t-i}\}_{i=0}^{n-1}\right)$$

### Specific Formulas for Standard Rolling Windows

#### Rolling IQR 20 (Standard Short-term Volatility - 20 Periods)

Calculated using a 20-session lookback window to measure dispersion and non-parametric volatility.

$$IQR_{20, t} = Q_{3, 20, t} - Q_{1, 20, t}$$

> *Technical Constraint:* A minimum of **20 consecutive sessions** of historical closing prices is required to compute the first valid $IQR_{20}$ value.

### Derived Metrics

#### IQR Upper and Lower Outer Bounds (Outlier Detection)

Identifies extreme price anomalies or sudden volatility shifts using the standard $1.5 \times IQR$ threshold:

$$\text{Upper Bound}_{n, t} = Q_{3, n, t} + 1.5 \times IQR_{n, t}$$

$$\text{Lower Bound}_{n, t} = Q_{1, n, t} - 1.5 \times IQR_{n, t}$$

#### Outlier Anomaly Signal

The quantitative outlier indicator $\text{OutlierSignal}_t \in \{-1, 0, 1\}$ at session $t$ is defined as:

$$\text{OutlierSignal}_t = \begin{cases} 1 & \text{if } P_t > \text{Upper Bound}_{n, t} \quad (\text{Upper Price Outlier}) \\ -1 & \text{if } P_t < \text{Lower Bound}_{n, t} \quad (\text{Lower Price Outlier}) \\ 0 & \text{otherwise (Normal Range)} \end{cases}$$