# BroStock Algorithm Documentation (v2.0)

**Status:** Validated via Backtest (Jan 2023 - Jan 2026)
**Performance:** ~51.3% Avg Return on VN30 stocks.

## 1. Core Logic

### Data Requirements
- Daily `close` price
- Daily `volume`
- 50-day Simple Moving Average (SMA)
- 20-day Simple Moving Average (SMA)

### Metrics Formulae
1.  **Trend Strength:** `((Close - SMA50) / SMA50) * 100`
2.  **Volume Surge:** `Volume / Avg_Volume_7_Day`
3.  **7-Day Return:** `((Close / Close_7_days_ago) - 1) * 100`

## 2. Scoring System (-10 to +10)

The score starts at 0.

### A. Trend (Weight: High)
- **+2 Points:** Close > SMA50 (Uptrend Baseline)
- **+2 Points:** Trend Strength > 5% (Strong Momentum)
- **-2 Points:** Close < SMA50 (Downtrend Baseline)
- **-2 Points:** Trend Strength < -5% (Strong Pullback)

### B. Momentum (Weight: Medium)
- **+2 Points:** Close > SMA20 (Short-term Bullish)
- **-2 Points:** Close < SMA20 (Short-term Bearish)
- **+1 Point:** 7-Day Return > 2% (Recent Buying Pressure)
- **-1 Point:** 7-Day Return < -2% (Recent Selling Pressure)

### C. Volume (Weight: Medium)
- **+2 Points:** Volume Surge > 1.2 (Significant Inflow)
- **-1 Point:** Volume Surge < 0.8 (Liquidity Drying Up)
- **+1 Point:** Current Volume > 20-Day Avg Volume (Sustained Interest)

## 3. Signal Labels
| Score | Label |
| :--- | :--- |
| **+7 to +10** | **Strong Bullish** |
| **+3 to +6** | **Bullish** |
| **-2 to +2** | **Neutral** |
| **-6 to -3** | **Bearish** |
| **-10 to -7** | **Strong Bearish** |

## 4. Trading Strategy (Backtested)
- **Buy Trigger:** Score >= 5
- **Sell Trigger:** Score <= -2
- **Avg Win Rate:** ~28% (Strategy relies on big wins, e.g., VIC +517%, VHM +158%)
- **Avg Drawdown:** ~24%