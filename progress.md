# Progress Tracking - BroStock Pro

## Current Status: Phase 6 Complete — Algorithmic Documentation & Real-Money Empirical Engine Live

## Completed Tasks - Phase 6 (Real-Money Backtest Engine & Algorithmic Documentation)
- [x] **Algorithmic Documentation:** Created dedicated `/doc` route and added "Thuật toán (DOC)" link to top header navigation.
- [x] **Algorithmic Documentation:** Detailed math formulas and weights for Multi-Factor Conviction Engine (-100 to +100), ADX Regime adaptation, Smart Money (Shark Flow) tracking, Risk Architecture, Alpha Swing (T+15) & Long-Term (3-6M) ranking, and VN30F Derivatives Daily Bias.
- [x] **Backtest Engine:** Vectorized 250-bar stock historical backtester (`calculate_stock_backtest_stats`) evaluating T+15 and T+60 holding windows.
- [x] **Real-Money Metrics:** Net of 0.4% Vietnamese tax & fees subtraction on all trade executions (Win Rate %, Avg Return %, Profit Factor, Max Drawdown %).
- [x] **Confidence Rating:** Integrated Real-Money Confidence Rating Badges (`TIN CẬY CAO` ≥ 70, `TRUNG BÌNH` 50-69, `RỦI RO` < 50) on `/alpha`.
- [x] **Format Safety:** Double-sided fail-safe price scale normalizers (`formatVnPrice`) ensuring 100% clean formatting for prices, target prices, and stop losses (e.g. `30,657` VND).
- [x] **UI Density & Typography:** Reduced table cell padding (`px-1.5 py-1.5`), increased font sizes by 1 step, and rounded all backtest float numbers to clean 2 decimal places.

## Completed Tasks - Phase 5 (VN30F Derivatives Engine)
- [x] **Signal Engine:** Implement `calculate_vn30f_signal()` with 6-factor Daily Bias score (-100 to +100).
- [x] **Signal Engine:** Dynamic weighting based on ADX (Trend vs Range).
- [x] **Analytics:** Calculate automatic Target (1.5 ATR) and Stop Loss (1.0 ATR).
- [x] **UI/UX:** Create Light Theme Dashboard for Derivatives with Gauge chart and multi-factor breakdown.
- [x] **API:** Add `/api/derivatives/signal` endpoint and integrate with periodic market crawler.

## Completed Tasks - Phase 4 (Alpha Long-Term & Institutional v2.6)
- [x] **Signal Engine:** Add Long-Term accumulation algorithm (35% Trend, 25% Vol, 20% Price, 15% Stability, 5% Value).
- [x] **Analytics:** Precise Vietnamese Fee adjustment (0.4% round trip) subtracted from all Net Profit targets.
- [x] **Signal Engine:** Upgrade to Multi-Factor Framework (5 Factor Groups).
- [x] **Signal Engine:** Implement Conviction Score (-100 to +100) and ADX regime detection.
- [x] **UI/UX:** Dual-mode tab switcher on Alpha page (Swing vs Long-Term).
- [x] **Bot:** Upgrade Telegram Bot to v2.6 with factor breakdown and Shark emojis.

## Completed Tasks - Phase 1-3 (Foundational)
- [x] **Core:** Complete Decoupled Architecture (FastAPI + Next.js).
- [x] **Fix:** Resolve `vnstock` data source issue to VCI.
- [x] **Architecture:** Implement SQLite caching with SQLAlchemy (`database.py`) and 5-min TTL.
- [x] **UI/UX:** Dashboard (Command Center) and Alpha tables built with Tailwind/Shadcn.
- [x] **Cloud:** Deploy Backend/Bot to Render and Frontend to Vercel.

## Next Steps / Real-Money Operation Roadmap
- [ ] **Execution:** Deploy capital into Top "TIN CẬY CAO" Alpha opportunities with strict ATR Stop Losses.
- [ ] **Data:** Implement "Foreign & Proprietary" (Khối ngoại & Tự doanh) trading flow tracking.
- [ ] **Derivatives:** Upgrade to real-time tick-by-tick scalping when direct futures websocket is connected.
- [ ] **Notification:** Set up automated Telegram alerts for high-conviction (>70đ) signal triggers.