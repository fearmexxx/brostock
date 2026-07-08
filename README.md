# BroStock Pro — Institutional Trading Terminal 🇻🇳

BroStock Pro is an advanced, real-time stock analysis and trading terminal for the **Vietnamese Stock Market**. It utilizes a modern decoupled architecture (Next.js + FastAPI) to provide institutional-grade signals, smart money tracking, backtesting, and a VN30F derivatives trading engine.

Powered by real-time data from [vnstock](https://pypi.org/project/vnstock/).

---

## 🌟 Key Features

1. **Dashboard & Stock Analysis:**
   - Real-time intraday tracking (1-minute bars).
   - Smart Money / Shark Flow detection (Big Order volume net flow).
   - Interactive Plotly/Recharts for order statistics.

2. **Alpha Signal Engine (Swing & Long-Term):**
   - **Multi-Factor Scoring (0-100):** Trend (35%), Momentum (20%), Volume Flow (15%), Volatility (15%), Mean Reversion (15%).
   - Dynamic Regime Weighting based on ADX (Trend vs Range).
   - Strict risk management integrating precise Vietnamese transaction fees (0.4% round trip).
   - Generates precise Entry, Target, and Stop-Loss recommendations.

3. **VN30F Derivatives Engine:**
   - 6-Factor Daily Bias Signal specifically for VN-Index Futures.
   - Calculates Entry, Target (1.5 ATR), Stop-loss (1.0 ATR) and Risk:Reward ratios.
   - Beautiful Light-theme Dashboard with Gauge visualizations and factor breakdowns.

4. **Institutional Telegram Bot (`@brostock_bot`):**
   - Commands: `/price`, `/top`, `/alpha`.
   - Sends real-time institutional metrics and AI-generated charts directly to Telegram.

5. **Backtesting Framework:**
   - Vectorized engine to test the Alpha algorithm against historical data (2020-Present).
   - Visualizes Equity Curve, Max Drawdown, and Win Rate.

---

## 🛠 Technology Stack

| Component | Technology |
|---|---|
| **Frontend UI** | `Next.js 16` (React), `Tailwind CSS`, `Shadcn UI`, `Lucide Icons` |
| **Backend API** | `Python 3.11`, `FastAPI`, `Uvicorn` |
| **Data Engine** | `vnstock (VCI)`, `Pandas`, `NumPy` |
| **Database/Cache**| `SQLite`, `SQLAlchemy` (Cache-first policy with 5-minute TTL) |
| **Bot** | `python-telegram-bot` |
| **Charts** | `Recharts` (Frontend), `Plotly / Matplotlib` (Backend/Bot) |

---

## 🚀 Installation & Setup

BroStock Pro uses a decoupled architecture. You need to run the Backend and Frontend separately.

### 1. Backend (FastAPI)
```bash
# Navigate to project root
cd brostock

# Install Python dependencies
pip install -r requirements.txt

# Create .env file for Telegram Bot (Optional)
echo "TELEGRAM_BOT_TOKEN=your_token_here" > .env

# Run the FastAPI server (Port 8000)
python3 -m uvicorn backend.main:app --port 8000 --reload
```

### 2. Frontend (Next.js)
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Run the Next.js development server (Port 3000)
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🔮 Future Roadmap

- [ ] **Real-time Derivatives:** Upgrade VN30F engine from Daily Bias to real-time Tick-by-Tick scalping when API supports it.
- [ ] **Foreign Flow Tracking:** Map "Khối ngoại" and "Tự doanh" flows into the Alpha signal engine.
- [ ] **Risk-Adjusted Metrics:** Include Sharpe and Sortino ratios in the Backtesting engine.
- [ ] **WebSockets:** Implement real-time price pushes via WSS instead of HTTP polling.

---

## 📝 License
Proprietary / Private Repository - Not for redistribution.