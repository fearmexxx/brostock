---
name: brostock-dev
description: Development guide for BroStock (FastAPI + Next.js). Use when modifying backend, frontend, database, or deploying updates.
---

# BroStock Development Guide

## Project Overview

BroStock is a real-time stock analysis dashboard for the Vietnamese market, featuring a decoupled architecture.

- **Backend:** Python/FastAPI (`backend/`)
- **Frontend:** Next.js/React (`frontend/`)
- **Database:** SQLite (`market_data.db`)
- **Bot:** Python-Telegram-Bot (`backend/telegram_bot.py`)
- **Data Source:** `vnstock` (Source: VCI)

## Key Locations

- **Backend Logic:** `backend/main.py` (API), `stock_analyzer.py` (Analysis), `database.py` (Models)
- **Telegram Bot:** `backend/telegram_bot.py`
- **Frontend App:** `frontend/app/`
- **Configuration:** `.env` (Root), `frontend/.env.local`

## Workflows

### 1. Running the System

*   **Backend (API):**
    ```bash
    # Runs on http://localhost:8000
    python backend/main.py
    ```

*   **Telegram Bot:**
    ```bash
    # Requires TELEGRAM_BOT_TOKEN in .env
    python backend/telegram_bot.py
    ```

*   **Frontend:**
    ```bash
    # Runs on http://localhost:3000
    cd frontend
    npm run dev
    ```

### 2. Database & Data

*   **Schema:** Defined in `database.py` (SQLAlchemy).
*   **File:** `market_data.db` (Local SQLite) or Postgres (Render/Railway).
*   **Update Logic:**
    -   `update_market_data` in `backend/main.py`.
    -   Runs automatically on startup and periodically.
    -   **Important:** Updates allow EOD data capture until 19:00 ICT.
    -   **Rate Limits:** Throttled to prevent VCI blocking.

### 3. Telegram Bot Features

*   **Commands:**
    -   `/price [symbol]`: Detailed analysis + Intraday Chart.
    -   `/top`: Market rankings (Gainers/Losers).
    -   `/signals`: Top Bullish/Bearish signals.
    -   `/subscribe`: EOD reports.
*   **Key Logic:**
    -   Rate Limit: 10 requests / 60s per user.
    -   Charts: Generated via `stock_analyzer.generate_intraday_chart_image` (Matplotlib).
    -   I18n: Fully localized to Vietnamese.

## Deployment

-   **Platform:** Render (Backend), Vercel (Frontend).
-   **Trigger:** Push to GitHub `master` branch.
-   **Repo:** `https://github.com/fearmexxx/brostock`
-   **Notes:** Ensure `market_data.db` persistence if possible, though cache rebuilds on restart.

## Troubleshooting

-   **Stale Data:** Check `update_market_data` in `backend/main.py`. Ensure system time is correct or force update.
-   **Rate Limits:** If `vci` blocks, increase sleep time in `backend/main.py`.
-   **Bot Error:** Check `subscribers.txt` existence and permissions.

## Recent Changes (Feb 6, 2026)

-   Fixed price multipliers (x1000 for stocks).
-   Implemented EOD update window (until 7 PM).
-   Added Intraday Charts & 5-day Predictions to Bot.
-   Enforced Bot Rate Limits.