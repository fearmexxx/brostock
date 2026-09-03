# Progress Tracking - BroStock Pro

## Current Status: Phase 7 Complete — VBE Agency Go-Live & Commercial Readiness (vbe.com.vn)

## Completed Tasks - Phase 7 (VBE Agency Commercial Readiness & Go-Live)
- [x] **CORS & Domain Whitelisting:** Enabled cross-origin requests for `vbe.com.vn`, `*.vbe.com.vn`, and Vercel custom domains in `backend/main.py`.
- [x] **Production Health Check:** Added `/api/health` monitoring endpoint (database connection, cache status, trading hours, version).
- [x] **Agency Metadata:** Added `/api/agency/info` endpoint for agency service information and feature summaries.
- [x] **Responsive Navigation:** Upgraded `Navbar` with VBE Agency badge, active link highlights, and a mobile drawer for phone/tablet users.
- [x] **Agency Footer:** Added comprehensive footer with VBE Agency branding, links to `vbe.com.vn`, and UBCKNN regulatory compliance disclaimers.
- [x] **Broker Quick-Copy Signal:** Added one-click "Sao chép khuyến nghị" button in Alpha table for advisors to instantly generate and paste trading briefs into client Zalo/Telegram groups.
- [x] **2-Week Launch Roadmap:** Created detailed launch playbook in `VBE_GO_LIVE_ROADMAP.md` covering domain routing, server keep-alive, staff training, and live market testing.

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

## Next Steps / 2-Week Launch Countdown
1. **Week 1:** Configure Custom Subdomain `stock.vbe.com.vn` (or `terminal.vbe.com.vn`) on Vercel DNS.
2. **Week 1:** Setup UptimeRobot pinging `https://brostock-backend.onrender.com/api/health` every 5 mins to prevent Render cold-start.
3. **Week 2:** Conduct live-session stress testing with VBE Agency advisors during market hours (9:15 - 14:45 ICT).
4. **Week 2:** Public announcement & onboard VIP agency clients to Telegram Signal alerts.