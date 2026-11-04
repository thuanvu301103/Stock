### 1. Market Segmentation Across Vietnam's Three Main Exchanges
The index dataset incorporates core representatives from the entire Vietnamese stock market structure, including:

* **HOSE (Ho Chi Minh City Stock Exchange):** Represented by **VNINDEX** (broad market index), **VN30** (top 30 stocks by market capitalization and liquidity), and **VNXALL** (joint broad market index covering both HOSE and HNX).
* **HNX (Hanoi Stock Exchange):** Represented by **HNXIndex** and **HNX30**.
* **UPCoM (Unlisted Public Company Market):** Represented by **HNXUpcomIndex**.

Utilizing this set of indices ensures comprehensive coverage across total market liquidity, capitalization, and price action across all three exchanges without omitting any market segment.

---

### 2. Measuring Liquidity and Capital Concentration (Market Breadth & Liquidity Concentration)
* **Large-Cap Indices (`VN30`, `HNX30`):** Reflect capital flows within blue-chip equities. These indices account for a major share of total market trading value (`allValue`, `totalValue`), acting as primary sentiment drivers for institutional liquidity.
* **Broad Market Indices (`VNINDEX`, `HNXIndex`, `HNXUpcomIndex`):** Provide a macro view of overall advance/decline trends across listed equities, serving as foundational inputs for computing market breadth metrics such as the Advance/Decline Line (A/D Line).