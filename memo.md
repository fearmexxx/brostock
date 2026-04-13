# BroStock Project Memo

## Architecture Update (2026-01-15)
- **Backend:** Decoupled into a FastAPI server (`backend/main.py`).
- **Frontend:** Refactored into a Next.js application (`frontend/`).
- **Data Persistence:** SQLite (`market_data.db`) used for historical data and market caching.

## Performance & Rate Limit Mitigation
- **Intraday Caching:** Implemented a strict "Cache-First" policy for intraday data.
  - During trading hours: 5-minute TTL.
  - Outside trading hours: Strictly serve from DB.
- **Graceful Fallback:** If VCI API hits rate limits, the system serves stale cache instead of throwing errors.
- **Background Throttling:** Reduced background crawler concurrency to 2 workers with 0.2s delay per request.

## Frontend Enhancements
- **Environment Variables:** API URL now configured via `NEXT_PUBLIC_API_URL` in `.env.local` to support local network access.
- **Network Access:** Configured `allowedDevOrigins` in `next.config.ts` to permit access from local network IPs (e.g., 192.168.31.214).
- **Market Overview Updates:**
  - Added **Sorting** for Market Signals based on `trend_strength`.
  - Updated price display to show **Day's Change** (Value & Percentage) across all ranking and signal tables.
  - Example: `PLX 51,800 (+2,500 (+2.5%))`

## Portfolio Update (2026-01-15)
- **Local Storage:** Migrated Portfolio logic to client-side `localStorage`.
  - Removes dependency on Backend DB for user data.
  - Eliminates need for Authentication system.
  - Backend now only provides read-only market data (prices) for P/L calculation.

## Backtesting Module (2026-01-15)
- **Engine:** Created `backtester.py` to simulate trading strategies on historical data (VCI source).
- **API:** Added `/api/backtest` endpoint to trigger simulations from the frontend.
- **UI:** Implemented `/backtest` page with:
  - Custom parameters (Symbol, Date Range).
  - **Equity Curve** chart using Recharts.
  - Performance Metrics (Win Rate, Drawdown, Total Return).
  - Detailed Trade Log.

## Real-time Alerts (2026-01-15)
- **Backend:** Enhanced `update_market_data` to cache a full "Market Scan" (Score/Action for all symbols) in `market_cache["scan"]`.
- **API:** Added `/api/market/scan` endpoint to retrieve signal status for all stocks.
- **Frontend:** Created `SignalAlerts` component that cross-references LocalStorage portfolio with the Market Scan to display "BUY" or "SELL" warnings on the Dashboard.

## Progress Summary (2026-01-15)
- **Architecture:** Successfully decoupled into FastAPI Backend + Next.js Frontend.
- **Performance:** Implemented aggressive caching and "Market Closed" logic to prevent API rate limits.
- **Features:**
  - **Portfolio:** No-login, LocalStorage-based portfolio management.
  - **Backtesting:** Self-service simulation engine for validating strategies on historical data.
  - **Alerts:** Automated warnings on the Dashboard if portfolio holdings trigger Sell signals.
  - **Market Overview:** Enhanced with sorting, detailed price changes, and signal strength indicators.
- **Algorithm:** Deployed "BroStock v2.0" (Trend + Momentum + Volume) with ~51% backtested return on VN30.
