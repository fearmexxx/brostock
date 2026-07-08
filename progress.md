# Progress Tracking - BroStock Pro

## Status: Alpha v2.5 & Derivatives Live (Phase 2 Complete)

## Completed Tasks - Phase 5 (VN30F Derivatives Engine)
- [x] **Signal Engine:** Implement `calculate_vn30f_signal()` with 6-factor Daily Bias score (-100 to +100).
- [x] **Signal Engine:** Dynamic weighting based on ADX (Trend vs Range).
- [x] **Analytics:** Calculate automatic Target (1.5 ATR) and Stop Loss (1.0 ATR).
- [x] **UI/UX:** Create a stunning Light Theme Dashboard for Derivatives with a Gauge chart and multi-factor breakdown.
- [x] **API:** Add `/api/derivatives/signal` endpoint and integrate with periodic market crawler.

## Completed Tasks - Phase 4 (Alpha Long-Term & Institutional v2.6)
- [x] **Signal Engine:** Add Long-Term accumulation algorithm (35% Trend, 25% Vol, 20% Price, 15% Stability, 5% Value).
- [x] **Analytics:** Precise Vietnamese Fee adjustment (0.4% round trip) subtracted from all Net Profit targets.
- [x] **Signal Engine:** Upgrade to Multi-Factor Framework (5 Factor Groups).
- [x] **Signal Engine:** Implement Conviction Score (-100 to +100) and ADX regime detection.
- [x] **UI/UX:** Dual-mode tab switcher on Alpha page (Swing vs Long-Term).
- [x] **Bot:** Upgrade Telegram Bot to v2.6 with фактор breakdown and Shark emojis.

## Completed Tasks - Phase 1-3 (Foundational)
- [x] **Core:** Complete Decoupled Architecture (FastAPI + Next.js).
- [x] **Fix:** Resolve `vnstock` data source issue to VCI.
- [x] **Architecture:** Implement SQLite caching with SQLAlchemy (`database.py`) and 5-min TTL.
- [x] **UI/UX:** Dashboard (Command Center) and Alpha tables built with Tailwind/Shadcn.
- [x] **Cloud:** Deploy Backend/Bot to Render and Frontend to Vercel.

## Pending / Future Tasks
- [ ] **Derivatives:** Upgrade to tick-by-tick real-time scalping when a direct futures API is available.
- [ ] **Data:** Implement "Foreign & Proprietary" (Khối ngoại & Tự doanh) trading flow tracking.
- [ ] **Backtest:** Refine backtester to include Risk-Adjusted Return metrics (Sharpe, Traynor) and Derivatives testing.
- [ ] **Optimization:** Implement WebSocket for real-time price updates (if API allows).