# Progress Tracking - BroStock Pro

## Current Status: Phase 8 Complete — Week 1 Core Upgrade: Trap Filters, Foreign Flow & Brokerage Referral Hub

## Completed Tasks - Phase 8 (Week 1 Core Upgrade & Brokerage Commission Funnel)
- [x] **Penny & Trap Risk Filter:** Integrated rigorous retail protection filter (`is_trap_risk`, `trap_reasons`) detecting Penny stocks (< 5.000đ), ultra-illiquid symbols (< 150k shares/day), and floor-locked selling traps.
- [x] **Conviction Safety Cap:** Suppressed positive BUY conviction on dangerous trap stocks, reclassifying them with warning labels (`CẢNH BÁO BẪY` / `BẪY GIÁ`) to protect retail investors.
- [x] **Foreign Flow Factor:** Added institutional foreign accumulation weighting (`foreign_score`, +5 for 3-day continuous buying, -5 for dumping).
- [x] **Brokerage Referral Endpoint:** Added `/api/partner/brokers` delivering curated partner broker info (VPS, TCBS, DNSE), referral codes, zero-fee promotions, and FENWEALTH VIP perks.
- [x] **Broker Referral Modal Component:** Built interactive `BrokerReferralModal.tsx` allowing 1-click E-KYC onboarding, referral code copying, and FENWEALTH VIP Room access explanation.
- [x] **Alpha Table Referral CTA:** Added prominent "Đối Tác FENWEALTH" action column with `[Nhận Kèo VIP]` buttons and Lead Magnet banner on `/alpha` across both Swing and Long-term modes.
- [x] **Build & Type Safety Verified:** Passed clean TypeScript compilation (`tsc --project tsconfig.json --noEmit`) and Python syntax checks (`py_compile`).

## Completed Tasks - Phase 7 (FENWEALTH Academy Ecosystem & Go-Live Readiness)
- [x] **Standalone Positioning:** BroStock Pro is structured as a specialized quantitative terminal belonging to **Học viện FENWEALTH** (Đầu tư tích sản).
- [x] **CORS & Domain Whitelisting:** Enabled cross-origin requests for FENWEALTH domains (`*.fenwealth.*`) and Vercel in `backend/main.py`.
- [x] **Production Health Check:** Added `/api/health` monitoring endpoint (database connection, cache status, trading hours, version).
- [x] **Academy Metadata:** Added `/api/academy/info` & `/api/platform/info` endpoints for FENWEALTH service information and asset accumulation features.
- [x] **Responsive Navigation:** Upgraded `Navbar` with **Học viện FENWEALTH** badge, active link highlights, and a mobile drawer for phone/tablet users.
- [x] **Academy Footer:** Added comprehensive footer with FENWEALTH Academy branding and UBCKNN regulatory compliance disclaimers.
- [x] **One-Click Signal Sharing:** Added one-click "Sao chép khuyến nghị" button in Alpha table for FENWEALTH mentors & investors to instantly share clean asset accumulation briefs to client/community groups.
- [x] **Launch Roadmap:** Formulated comprehensive launch playbook in `FENWEALTH_GO_LIVE_ROADMAP.md` covering domain routing, server keep-alive, and live market testing.

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

## Next Steps / 2-Week FENWEALTH Launch Countdown
1. **Week 1:** Setup UptimeRobot pinging `https://brostock-backend.onrender.com/api/health` every 5 mins to prevent Render cold-start.
2. **Week 1:** Configure Custom Subdomain (e.g. `stock.fenwealth...` or Vercel custom domain).
3. **Week 2:** Conduct live-session stress testing with FENWEALTH mentors & members during market hours (9:15 - 14:45 ICT).
4. **Week 2:** Integrate BroStock Terminal directly into Học viện FENWEALTH member portal.