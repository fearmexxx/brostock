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

## Algorithm: BroStock v2.0
**Goal:** Trend Following + Momentum.
**Scoring Scale:** -10 (Strong Bearish) to +10 (Strong Bullish).

### Logic:
1.  **Trend (4 pts):** Price vs SMA50, Trend Strength % (Deviation from SMA50).
2.  **Momentum (3 pts):** Price vs SMA20, 7-Day Return.
3.  **Volume (3 pts):** Volume Surge (>1.2x avg), Price/Vol divergence.

### Performance (Backtested Jan 2023 - Jan 2026):
- **Avg Return (VN30):** ~51.3%
- **Avg Win Rate:** ~28% (Strategy cuts losers fast, rides winners).
- **Notable Wins:** VIC (+517%), VHM (+158%).

## Deployment Guide
- **Backend:** Deploy to **Render** or **Railway** (requires persistent disk for SQLite).
- **Frontend:** Deploy to **Vercel**.
- **Environment:**
  - Frontend: Set `NEXT_PUBLIC_API_URL` to your Backend URL.
  - Backend: Ensure `market_data.db` is persistent.

## Recent Updates (Jan 2026)

- **Rate Limit Fix:** Implemented "Market Closed" logic (no API calls after 3 PM) and graceful fallbacks. 

- **Refactor:** Moved Portfolio from Backend DB to Client-side Storage.

- **New Feature:** Added `/backtest` page for user-driven strategy simulations.



## Working Log

### Feb 6, 2026: Preparation for Phase 4

- **Status Check:** Confirmed Backend (FastAPI) and Frontend (Next.js) are stable. 

- **Signal Engine:** Verified `calculate_trend_metrics` is providing consistent scores (-10 to +10).

- **Database:** SQLite `market_data.db` is successfully caching indices, top rankings, and full market scan results.

- **Next Goal:** Implement Telegram Bot to reduce API load and provide automated reports.



## Phase 4: Telegram Bot Integration

**Goal:** Offload routine queries and provide automated EOD signal reports.



### Planned Features:

1.  **Market Query:** `/price [SYMBOL]` - Get real-time price, change, and BroStock Signal.

2.  **Top Lists:** `/top` - View top gainers/losers and volume leaders.

3.  **Daily Report:** Automated message at 4:00 PM GMT+7 with:

    - Market Indices performance (VNIndex, VN30).

    - Top 5 Bullish & Bearish signals of the day.

    - Market Sentiment summary.

4.  **Portfolio Alerts:** (Future) Integration with user-specific watchlists.



### Technical Stack:

- **Library:** `python-telegram-bot` (Asynchronous).

- **Deployment:** Integrated into the existing FastAPI backend or as a separate service sharing the same `market_data.db`.


