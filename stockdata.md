
# Vietnamese Stock Market Data Indicators

This document tracks technical and fundamental indicators available in the BroStock application and supported by the `vnstock` library (VCI source).

## 1. Intraday Trading Indicators (Real-time)

| Indicator | Description | Source/Calculation |
| :--- | :--- | :--- |
| **Price (Match)** | Latest matched price in the trading session. | `vnstock.Quote.intraday` |
| **Volume (Match)** | Quantity of shares traded in the latest match. | `vnstock.Quote.intraday` |
| **Net Flow (VND)** | (Total Value of Buy Orders) - (Total Value of Sell Orders). Positive means net buying pressure. | Calculated from `intraday` match types. |
| **VWAP** | Volume Weighted Average Price. Standard benchmark for intraday trend. | `Sum(Price * Volume) / Sum(Volume)` |
| **Buy/Sell Vol Ratio** | Ratio of average volume per Buy order vs average volume per Sell order. | Calculated from `intraday` aggregation. |
| **Inflow / Outflow** | Total money flowing into 'Buy' matches vs 'Sell' matches. | Aggregated from `intraday` value. |
| **Order Count** | Total number of matches (Buy vs Sell) during the session. | Aggregated from `intraday`. |
| **Price Imbalance** | Ratio of Buy value to Sell value. | `Inflow / Outflow` |

## 2. Historical & Trend Indicators (Daily)

| Indicator | Description | Source/Calculation |
| :--- | :--- | :--- |
| **MA5 / MA20** | Simple Moving Averages (5-day, 20-day). Short-term trend indicators. | `vnstock.Quote.history` |
| **SMA 50** | 50-day Simple Moving Average. Medium-term trend benchmark. | `vnstock.Quote.history` |
| **Trend Strength (%)** | Distance of current price from SMA 50. | `(Price / SMA50 - 1) * 100` |
| **52-Week High/Low** | Highest and lowest price reached in the last 252 trading days. | `vnstock.Quote.history` |
| **Annual Volatility (%)** | Yearly standard deviation of price returns. Measure of risk. | `StdDev(Daily Returns) * sqrt(252)` |
| **Avg Volume (20D)** | Average daily trading volume over the last 20 sessions. | `vnstock.Quote.history` |

## 3. Market Breadth & Ranking

Top rankings are calculated using a background aggregator that fetches data for major index constituents (VN100, HNX30) and ranks them in real-time.

| Indicator | Description | Implementation |
| :--- | :--- | :--- |
| **Top 10 Gainers** | Stocks with highest percentage price increase today. | Sorted by `pctChange` (VN100, HNX30). |
| **Top 10 Losers** | Stocks with highest percentage price decrease today. | Sorted by `pctChange` (VN100, HNX30). |
| **Top 10 Volume** | Stocks with highest total trading volume today. | Sorted by `totalVolume`. |

## 4. Indices Supported

*   **VNINDEX** (HOSE Main)
*   **HNXINDEX** (HNX Main)
*   **UPINDEX** (UPCOM Main)
*   **VN30** (Top 30 HOSE)
*   **HNX30** (Top 30 HNX)

*   **P/E (Price to Earnings)**
*   **P/B (Price to Book)**
*   **EPS (Earnings Per Share)**
*   **ROE (Return on Equity)**
*   **Dividend Yield**

---
*Last Updated: 2026-01-14*
