# BroStock Project Knowledge Base

## Project Overview
**BroStock Pro** is a real-time stock analysis dashboard for the Vietnamese market. It uses a decoupled architecture (FastAPI + Next.js) to provide interactive charts, automated trading signals, and portfolio tracking without requiring user accounts.

## Architecture
- **Backend:** FastAPI (`backend/main.py`)
  - **Data Source:** `vnstock` (Source: VCI).
  - **Caching:** SQLite (`market_data.db`) with strict "Cache-First" policy to prevent rate limits.
  - **Background Task:** Periodic crawler updates Market Rankings and Signal Scans.
  - **API Endpoints:**
    - `/api/stock/{symbol}`: Real-time analysis.
    - `/api/market/overview`: Top 10 lists and signals.
    - `/api/market/scan`: Full market signal status for alerts.
    - `/api/backtest`: Strategy simulation engine.
- **Frontend:** Next.js (`frontend/`)
  - **UI Library:** Tailwind CSS, Shadcn UI, Lucide React.
  - **Charts:** Recharts (for equity curves & dashboards).
  - **State Management:** React Hooks + LocalStorage (for Portfolio).
  - **Configuration:** `.env.local` for API URL (`NEXT_PUBLIC_API_URL`).

## Key Features
1.  **Dashboard:** Real-time stock analysis with Intraday Price, VWAP, Net Flow, and Order Statistics.
2.  **Market Overview:**
    - Top Gainers/Losers/Volume.
    - **Signal Sorting:** Bullish/Bearish lists sorted by "Trend Strength".
    - Detailed price changes (Value & %).
3.  **Portfolio (No-Auth):**
    - Stores holdings in browser `localStorage`.
    - Real-time P/L calculation via API.
    - **Signal Alerts:** Automatically warns users if held stocks trigger a "SELL" signal.
4.  **Backtester:**
    - Built-in engine to test strategies on historical data (2020-Present).
    - Visualizes Equity Curve, Drawdown, and Win Rate.

## Algorithm: BroStock Institutional v2.6
**Goal:** Multi-Factor Trend Following, Momentum, and Risk Management.
**Scoring Scale:** -100 (Strong Bearish/Sell) to +100 (Strong Bullish/Buy).

### Factor Weights (Default):
1.  **Trend (30%):** Based on SMA20/50/200 positions and crossovers.
2.  **Momentum (20%):** Derived from RSI (14), MACD, and 14-day Rate of Change (ROC).
3.  **Volume Flow (15%):** Volume surge (7d vs 20d) and On-Balance Volume (OBV) trend.
4.  **Volatility Regime (15%):** Volatility expansion (ATR) and Bollinger Band width/squeeze.
5.  **Mean Reversion (20%):** Bollinger Band extremes and extreme RSI levels.

### Dynamic Weighting (Regime Detection):
- **ADX > 25 (Strong Trend):** Trend weight increases to 40%, Mean Reversion decreases to 10%.
- **ADX < 15 (Range/Mean Reversion):** Trend weight decreases to 15%, Mean Reversion increases to 35%.

### Additional Advanced Metrics:
1.  **Smart Money (Shark) Flow:** Identifies "Big Orders" using the 90th percentile of tick transaction volume. Computes net shark volume (`big_buy_vol` - `big_sell_vol`) and accumulates cumulative flows.
2.  **Multi-Factor Risk Score (0-100):** Consists of Volatility (40% weight on ATR/price), Squeeze/Expansion (30% weight on BB width), and Drawdown (30% weight on trailing 14-day max drawdown).

## Working Log & Updates

### April 14, 2026: Institutional Upgrade v2.6 Completed
- **Signal Engine:** Integrated multi-factor conviction scoring, ADX-based regime weighting, and risk scores.
- **Smart Money Flow:** Extracted tick-level shark activity and integrated it into the analysis pipelines.
- **Dashboard UI:** Added HUD widgets for Conviction factor breakdowns, Risk Architecture (ATR, BB, MDD), and 5-day conviction-based outlook.
- **Telegram Bot:** Upgraded to show shark emojis (🐋/🐳) and detailed factor analysis under the `/price` command.
- **Data Cache:** Validated SQLite caching behavior with 5-minute TTL to maintain smooth API rates.

### July 6, 2026: BroStock Alpha Section Deployed
- **Alpha Core:** Created the `/api/market/alpha` endpoint which aggregates stock listings, calculates daily institutional signal scores, filters by liquidity, and ranks the top 100 opportunities.
- **Alpha Dashboard:** Implemented a new `/alpha` Next.js screen featuring a full-width interactive table of the ranked universe with live search, action-based filters (BUY/SELL/HOLD), and 5-day outlook previews.
- **Runtime:** Resolved python import issues by pinning local execution environment to Python 3.11.8.

### July 6, 2026: Alpha v2.0 — Swing Trading Engine
- **Scoring Symmetry Fix:** Fixed momentum bearish scoring (was -9 max, now -20 symmetric). Added MACD bearish crossover (-5), histogram contraction (-3). RSI overbought penalty increased -5 → -8.
- **Volume Flow Enhancement:** Added volume drought detection (-6 at vol_surge < 0.5), distribution detection (-8 when price drops + volume surges), OBV impact doubled (±4 → ±8), below-VWAP penalty (-3).
- **Mean Reversion Fix:** RSI bearish threshold corrected from > 75 to > 70 (symmetric with RSI < 30).
- **Target Price & Stop Loss:** ATR×2 target with ATR×1.5 stop-loss (capped at ±5%). Risk:Reward ratio computed for every stock.
- **Composite Alpha Ranking:** Replaced volume-only ranking with Signal Strength (40%) + Volume Rank (30%) + Risk:Reward (30%) composite score.
- **Smart Filtering:** Liquidity filter (avg_vol_20d ≥ 100K), Risk filter (score > 75 → "CẢNH BÁO" instead of BUY).
- **Lowered Thresholds:** BUY ≥ 25 (was 40), SELL ≤ -25 (was -40). Added STRONG BUY ≥ 60, STRONG SELL ≤ -60.
- **Dashboard v2.0:** New columns: Mục tiêu (Target), Cắt lỗ (Stop Loss), R:R ratio with color-coded badges.


