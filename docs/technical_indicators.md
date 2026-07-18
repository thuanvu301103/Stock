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