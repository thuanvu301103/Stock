## IQR

### IQR Upper and Lower Outer Bounds (Outlier Detection)

Identifies extreme price anomalies or sudden volatility shifts using the standard $1.5 \times IQR$ threshold:

$$\text{Upper Bound}_{n, t} = Q_{3, n, t} + 1.5 \times IQR_{n, t}$$

$$\text{Lower Bound}_{n, t} = Q_{1, n, t} - 1.5 \times IQR_{n, t}$$

### Outlier Anomaly Signal

The quantitative outlier indicator $\text{OutlierSignal}_t \in \{-1, 0, 1\}$ at session $t$ is defined as:

$$\text{OutlierSignal}_t = \begin{cases} 1 & \text{if } P_t > \text{Upper Bound}_{n, t} \quad (\text{Upper Price Outlier}) \\ -1 & \text{if } P_t < \text{Lower Bound}_{n, t} \quad (\text{Lower Price Outlier}) \\ 0 & \text{otherwise (Normal Range)} \end{cases}$$

---

## Pivot Point, S1, and S2 Levels

Computes the central daily pivot point and primary support thresholds for session $t$ using the previous session's ($t-1$) high, low, and close prices:

$$\text{Pivot Point}_{t} = \frac{\text{High}_{t-1} + \text{Low}_{t-1} + \text{Close}_{t-1}}{3}$$

$$\text{S1}_{t} = 2 \times \text{Pivot Point}_{t} - \text{High}_{t-1}$$

$$\text{S2}_{t} = \text{Pivot Point}_{t} - (\text{High}_{t-1} - \text{Low}_{t-1})$$

### Optimal Buying Threshold (Price Execution Strategy)

Determines the target buying price $P_{\text{buy}, t}$ and order execution strategy at session $t$ by combining $S_1$, $S_2$, and the price range context $(High_{t-1} - Low_{t-1})$:

$$P_{\text{buy}, t} = \begin{cases} S1_t & \text{if } \text{Trend}_t = \text{Uptrend / Sideway} \quad (\text{Primary Support Order}) \\ S2_t & \text{if } \text{Trend}_t = \text{Downtrend / High Volatility} \quad (\text{Deep Support Order}) \end{cases}$$

### Buying Opportunity Signal

The quantitative entry signal $\text{BuySignal}_t \in \{0, 1, 2\}$ at session $t$ is defined as:

$$\text{BuySignal}_t = \begin{cases} 2 & \text{if } \text{Low}_t \le S2_t \quad (\text{High Yield Buy Zone}) \\ 1 & \text{if } S2_t < \text{Low}_t \le S1_t \quad (\text{Optimal Buy Zone}) \\ 0 & \text{if } \text{Low}_t > S1_t \quad (\text{No Buy Zone}) \end{cases}$$