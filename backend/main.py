from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os
import io
import logging
from datetime import datetime, timedelta, timezone, time as dt_time
from concurrent.futures import ThreadPoolExecutor
import asyncio
import time
import pandas as pd
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler

# Force UTF-8 for stdout/stderr to handle emojis from libraries on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add parent directory to path to import existing logic
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from stock_analyzer import (
    get_intraday_data, preprocess_data, aggregate_data, calculate_summary,
    get_stock_history_data, calculate_trend_metrics, is_trading_time,
    generate_intraday_chart_image
)
from backtester import run_backtest
from database import (
    place_trade, get_portfolio, save_market_cache, get_market_cache, init_db
)
from vnstock import Listing, Quote

# Load environment variables
load_dotenv()
SUBSCRIBERS_FILE = "subscribers.txt"

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

app = FastAPI(title="BroStock API & Bot", version="2.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---

class TradeRequest(BaseModel):
    user_id: str
    symbol: str
    quantity: int
    price: float
    type: str # 'BUY' or 'SELL'

class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    initial_capital: Optional[float] = 100000000

class StockAnalysisResponse(BaseModel):
    symbol: str
    current_price: float
    summary: dict
    trend_metrics: dict
    intraday_data: List[dict]
    historical_data: List[dict]

# --- Helpers ---

def convert_numpy(obj):
    import numpy as np
    import pandas as pd
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(v) for v in obj]
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.floating, float)):
        if np.isnan(obj):
            return None
        return float(obj)
    elif isinstance(obj, (np.bool_)):
        return bool(obj)
    elif isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    return obj

# --- Global Market Cache ---
market_cache = {
    "indices": {},
    "top10": {"gainers": [], "losers": [], "volume": []},
    "signals": {"bullish": [], "bearish": []},
    "scan": {},
    "last_updated": None
}

def load_cache_from_db():
    global market_cache
    indices, idx_time = get_market_cache("indices")
    if indices:
        market_cache["indices"] = indices
        market_cache["last_updated"] = idx_time.isoformat()
    
    top10, _ = get_market_cache("top10")
    if top10: market_cache["top10"] = top10
    
    signals, _ = get_market_cache("signals")
    if signals: market_cache["signals"] = signals
        
    scan, _ = get_market_cache("scan")
    if scan: market_cache["scan"] = scan

    stats, _ = get_market_cache("market_stats")
    if stats: market_cache["market_stats"] = stats

    if market_cache["last_updated"]:
        print(f"Loaded market cache from DB. Last updated: {market_cache['last_updated']}")

# --- Telegram Bot Logic ---

user_requests = {}
def is_rate_limited(user_id):
    now = time.time()
    if user_id not in user_requests:
        user_requests[user_id] = []
    user_requests[user_id] = [t for t in user_requests[user_id] if now - t < 60]
    if len(user_requests[user_id]) >= 10:
        return True
    user_requests[user_id].append(now)
    return False

def get_subscribers():
    if not os.path.exists(SUBSCRIBERS_FILE): return set()
    with open(SUBSCRIBERS_FILE, "r") as f:
        return set(line.strip() for line in f if line.strip())

def add_subscriber(user_id):
    subs = get_subscribers()
    if str(user_id) not in subs:
        with open(SUBSCRIBERS_FILE, "a") as f: f.write(f"{user_id}\n")
        return True
    return False

def remove_subscriber(user_id):
    subs = get_subscribers()
    if str(user_id) in subs:
        subs.remove(str(user_id))
        with open(SUBSCRIBERS_FILE, "w") as f:
            for s in subs: f.write(f"{s}\n")
        return True
    return False

def format_number(val):
    if val is None: return "N/A"
    return "{:,.0f}".format(val).replace(",", ".")

def format_index(val):
    if val is None: return "N/A"
    s = "{:,.2f}".format(val)
    return s.replace(",", "TEMP").replace(".", ",").replace("TEMP", ".")

async def tg_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🚀 *Chào mừng bạn đến với BroStock Bot!* \n\n"
        "Tôi cung cấp tín hiệu thị trường chứng khoán Việt Nam thời gian thực và báo cáo tự động.\n\n"
        "*Danh sách lệnh:*\n"
        "🔹 `/price [mã]` - Phân tích nhanh cổ phiếu\n"
        "🔹 `/top` - Bảng xếp hạng thị trường (Tăng/Giảm)\n"
        "🔹 `/signals` - Tín hiệu mua/bán chọn lọc\n"
        "🔹 `/subscribe` - Đăng ký nhận báo cáo cuối ngày (16:00)\n"
        "🔹 `/unsubscribe` - Hủy đăng ký nhận báo cáo\n"
        "🔹 `/help` - Hiển thị hướng dẫn này",
        parse_mode='Markdown'
    )

async def tg_subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if add_subscriber(update.effective_user.id):
        await update.message.reply_text("✅ *Đã đăng ký!* Bạn sẽ nhận được báo cáo vào 16:00 mỗi ngày.", parse_mode='Markdown')
    else:
        await update.message.reply_text("ℹ️ Bạn đã đăng ký rồi.")

async def tg_unsubscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if remove_subscriber(update.effective_user.id):
        await update.message.reply_text("👋 *Đã hủy đăng ký.*", parse_mode='Markdown')
    else:
        await update.message.reply_text("ℹ️ Bạn chưa đăng ký.")

async def tg_price(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if is_rate_limited(update.effective_user.id):
        await update.message.reply_text("⚠️ Giới hạn 10 yêu cầu/phút.", parse_mode='Markdown')
        return
    if not context.args:
        await update.message.reply_text("Dùng: `/price [mã]` (VD: `/price FPT`)", parse_mode='Markdown')
        return
    
    symbol = context.args[0].upper()
    try:
        df = get_stock_history_data(symbol)
        if df.empty:
            await update.message.reply_text(f"❌ Không tìm thấy mã {symbol}.")
            return
        
        metrics = calculate_trend_metrics(df)
        score = metrics.get('signal_score', 0)
        factors = metrics.get('factors', {})
        
        # Vietnamese Labels
        label_vn = {
            'Strong Buy': 'MUA MẠNH',
            'Buy': 'MUA',
            'Bullish Bias': 'TÍCH CỰC',
            'Neutral': 'TRUNG LẬP',
            'Bearish Bias': 'TIÊU CỰC',
            'Sell': 'BÁN',
            'Strong Sell': 'BÁN MẠNH'
        }.get(metrics.get('signal_label'), 'TRUNG LẬP')
        
        intra_df = get_intraday_data(symbol)
        buy_vol, sell_vol, net_flow = 0, 0, 0
        if not intra_df.empty:
            p_df = preprocess_data(intra_df)
            buy_vol = p_df[p_df['match_type'] == 'Buy']['volume'].sum()
            sell_vol = p_df[p_df['match_type'] == 'Sell']['volume'].sum()
            net_flow = p_df[p_df['match_type'] == 'Buy']['value'].sum() - p_df[p_df['match_type'] == 'Sell']['value'].sum()

        # Emojis based on -100 to +100 score
        if score >= 70: emoji = "🚀🚀"
        elif score >= 40: emoji = "🚀"
        elif score >= 15: emoji = "✅"
        elif score <= -70: emoji = "💀💀"
        elif score <= -40: emoji = "💀"
        elif score <= -15: emoji = "⚠️"
        else: emoji = "⚪"

        pred_vn = {'UPWARD': 'TĂNG', 'DOWNWARD': 'GIẢM', 'SIDEWAYS': 'ĐI NGANG'}.get(metrics.get('prediction_label'), 'ĐI NGANG')
        regime_vn = {'Trending': 'CÓ XU HƯỚNG', 'Weak Trend': 'XU HƯỚNG YẾU', 'Range': 'ĐI NGANG (RANGE)'}.get(metrics.get('market_regime'), 'KHÔNG RÕ')

        # Smart Money Flow
        big_in = summary.get('Dòng tiền Cá mập vào (VND)', '0')
        big_out = summary.get('Dòng tiền Cá mập ra (VND)', '0')
        big_net = summary.get('Dòng tiền Cá mập ròng (VND)', '0')

        # Risk Score
        risk_score = metrics.get('risk_score', 0)
        risk_label = metrics.get('risk_label', 'N/A')

        text = (
            f"{emoji} *{symbol} - {label_vn}* ({score:+.0f})\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"💰 *Giá:* {format_number(metrics.get('current_price_daily'))} VND\n"
            f"📈 *Dự báo (5d):* {pred_vn} ({metrics.get('prediction_5d_pct', 0):+.2f}%)\n"
            f"🌐 *Thị trường:* {regime_vn} (ADX: {metrics.get('adx', 0):.1f})\n"
            f"⚠️ *Rủi ro:* {risk_label} ({risk_score}/100)\n\n"
            f"📊 *Điểm thành phần:*\n"
            f"├ Trend: {factors.get('trend', 0):+d}\n"
            f"├ Momentum: {factors.get('momentum', 0):+d}\n"
            f"├ Volume: {factors.get('volume', 0):+d}\n"
            f"├ Volatility: {factors.get('volatility', 0):+d}\n"
            f"└ Mean Rev: {factors.get('mean_reversion', 0):+d}\n\n"
            f"🐋 *Dòng tiền Cá mập (Big Flow):*\n"
            f"├ Vào: {big_in} VND\n"
            f"├ Ra: {big_out} VND\n"
            f"└ Ròng: {big_net} VND\n\n"
            f"💧 *Dòng tiền Tổng cộng:*\n"
            f"├ Net Flow: {format_number(net_flow)} VND\n"
            f"└ Mua: {buy_vol/1e6:.1f}M | Bán: {sell_vol/1e6:.1f}M\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"BroStock Pro v2.6 Institutional 🐳"
        )
        await update.message.reply_text(text, parse_mode='Markdown')
        chart_buf = generate_intraday_chart_image(symbol)
        if chart_buf: await update.message.reply_photo(photo=chart_buf, caption=f"📊 {symbol}")
    except Exception as e:
        logger.error(f"Error in tg_price: {e}", exc_info=True)
        await update.message.reply_text(f"❌ Lỗi: {str(e)}")

async def tg_top(update: Update, context: ContextTypes.DEFAULT_TYPE):
    top10, _ = get_market_cache("top10")
    if not top10:
        await update.message.reply_text("Chưa có dữ liệu. Thử lại sau.")
        return
    text = "🔥 *Xếp Hạng Thị Trường*\n\n*Top Tăng:*\n"
    for s in top10.get('gainers', [])[:5]:
        text += f"🟢 {s['symbol']}: {format_number(s['price'])} ({s['pct_change']:+.2f}%)\n"
    text += "\n*Top Giảm:*\n"
    for s in top10.get('losers', [])[:5]:
        text += f"🔴 {s['symbol']}: {format_number(s['price'])} ({s['pct_change']:+.2f}%)\n"
    await update.message.reply_text(text, parse_mode='Markdown')

async def tg_signals(update: Update, context: ContextTypes.DEFAULT_TYPE):
    signals, _ = get_market_cache("signals")
    if not signals:
        await update.message.reply_text("Chưa có tín hiệu.")
        return
    text = "🎯 *Tín Hiệu BroStock*\n\n🚀 *TÍCH CỰC:*\n"
    for s in signals.get('bullish', [])[:10]:
        text += f"✅ {s['symbol']} - Điểm: {s['signal_score']} ({s['pct_change']:+.2f}%)\n"
    text += "\n💀 *TIÊU CỰC:*\n"
    for s in signals.get('bearish', [])[:10]:
        text += f"⚠️ {s['symbol']} - Điểm: {s['signal_score']} ({s['pct_change']:+.2f}%)\n"
    await update.message.reply_text(text, parse_mode='Markdown')

async def daily_report(context: ContextTypes.DEFAULT_TYPE):
    indices, _ = get_market_cache("indices")
    signals, _ = get_market_cache("signals")
    if not indices: return
    text = f"📢 *Báo Cáo BroStock {datetime.now().strftime('%d/%m/%Y')}*\n━━━━━━━━━━━━━━━━━━\n\n"
    for idx, data in indices.items():
        text += f"{'🟢' if data['change'] >= 0 else '🔴'} *{idx}:* {format_index(data['value'])} ({data['pct_change']:+.2f}%)\n"
    if signals and signals.get('bullish'):
        top = signals['bullish'][0]
        text += f"\n💎 *Cổ phiếu nổi bật:* *{top['symbol']}* (Điểm: {top['signal_score']})\n"
    for chat_id in get_subscribers():
        try: await context.bot.send_message(chat_id=chat_id, text=text, parse_mode='Markdown')
        except: pass

# --- Market Data Aggregator ---

async def update_market_data(force=False):
    utc_now = datetime.now(timezone.utc)
    vn_tz = timezone(timedelta(hours=7))
    now = utc_now.astimezone(vn_tz)
    is_eod = now.weekday() <= 4 and dt_time(15, 45) <= now.time() <= dt_time(19, 0)
    
    if not force and not is_trading_time() and not is_eod and market_cache["last_updated"]:
        return

    print(f"Updating market data... (Force: {force})")
    try:
        start_date = (datetime.now() - timedelta(days=120)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')
        
        # 1. Indices
        indices_data = {}
        for idx in ['VNINDEX', 'HNXINDEX', 'VN30']:
            try:
                time.sleep(1.0)
                df = Quote(symbol=idx, source='vci').history(start=start_date, end=end_date)
                if df is not None and len(df) >= 2:
                    prev, curr = df['close'].iloc[-2], df['close'].iloc[-1]
                    indices_data[idx] = {"value": float(curr), "change": float(curr - prev), "pct_change": float((curr/prev-1)*100), "volume": int(df['volume'].iloc[-1])}
            except: pass
        if indices_data:
            market_cache["indices"] = convert_numpy(indices_data)
            save_market_cache("indices", market_cache["indices"])

        # 2. Rankings & Signals
        symbols = []
        for g in ['VN30', 'VN100', 'HNX30']:
            try:
                s = Listing().symbols_by_group(g)
                if s is not None: symbols.extend(s.tolist())
            except: pass
        symbols = list(set(symbols)) or ['TCB', 'VCB', 'FPT', 'SSI', 'VNM', 'VIC', 'VHM', 'HPG']

        def fetch_stock(symbol):
            try:
                time.sleep(0.5)
                df = Quote(symbol=symbol, source='vci').history(start=start_date, end=end_date)
                if df is not None and len(df) >= 2:
                    prev, curr = df['close'].iloc[-2], df['close'].iloc[-1]
                    m = calculate_trend_metrics(df)
                    return {
                        "symbol": symbol, 
                        "price": float(curr)*1000, 
                        "change": float(curr-prev)*1000, 
                        "pct_change": float((curr/prev-1)*100), 
                        "volume": int(df['volume'].iloc[-1]), 
                        "signal_score": m.get('signal_score', 0), 
                        "signal_label": m.get('signal_label', 'Neutral'), 
                        "trend_strength": m.get('signal_score', 0),
                        "factors": m.get('factors', {}),
                        "prediction_5d_pct": m.get('prediction_5d_pct', 0),
                        "prediction_label": m.get('prediction_label', 'SIDEWAYS')
                    }
            except: return None

        with ThreadPoolExecutor(max_workers=1) as ex:
            valid_data = [r for r in list(ex.map(fetch_stock, symbols)) if r]
        
        if valid_data:
            df_all = pd.DataFrame(valid_data)
            market_cache["top10"] = {
                "gainers": convert_numpy(df_all.sort_values("pct_change", ascending=False).head(10).to_dict('records')),
                "losers": convert_numpy(df_all.sort_values("pct_change", ascending=True).head(10).to_dict('records')),
                "volume": convert_numpy(df_all.sort_values("volume", ascending=False).head(10).to_dict('records'))
            }
            save_market_cache("top10", market_cache["top10"])
            
            bull = df_all[df_all['signal_score'] >= 15].sort_values(["signal_score", "trend_strength"], ascending=[False, False]).head(15)
            bear = df_all[df_all['signal_score'] <= -15].sort_values(["signal_score", "trend_strength"], ascending=[True, True]).head(15)
            market_cache["signals"] = {"bullish": convert_numpy(bull.to_dict('records')), "bearish": convert_numpy(bear.to_dict('records'))}
            save_market_cache("signals", market_cache["signals"])
            
            scan = {r['symbol']: {"score": float(r['signal_score']), "action": "BUY" if r['signal_score'] >= 40 else "SELL" if r['signal_score'] <= -40 else "NEUTRAL", "price": float(r['price']), "pct_change": float(r['pct_change'])} for r in valid_data}
            market_cache["scan"] = scan
            save_market_cache("scan", scan)

            # 3. Market Breadth & Liquidity
            advancing = len(df_all[df_all['pct_change'] > 0])
            declining = len(df_all[df_all['pct_change'] < 0])
            unchanged = len(df_all[df_all['pct_change'] == 0])
            total_vol = int(df_all['volume'].sum())
            
            market_cache["market_stats"] = {
                "breadth": {"advancing": advancing, "declining": declining, "unchanged": unchanged},
                "total_volume": total_vol,
                "timestamp": datetime.now().isoformat()
            }
            save_market_cache("market_stats", market_cache["market_stats"])
        
        market_cache["last_updated"] = datetime.now().isoformat()
    except Exception as e: print(f"Error updating market: {e}")

# --- Lifecycle ---

@app.on_event("startup")
async def startup_event():
    init_db()
    load_cache_from_db()
    
    # Fetch token at startup to ensure env is ready
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    
    # Diagnostic: Log available keys related to Telegram (safely)
    env_keys = [k for k in os.environ.keys() if "BOT" in k or "TELEGRAM" in k]
    logger.info(f"Detected environment keys: {env_keys}")

    # Initialize Telegram Bot
    if token:
        try:
            logger.info(f"Starting Telegram Bot with token starting with: {token[:4]}...")
            tg_app = ApplicationBuilder().token(token).build()
            tg_app.add_handler(CommandHandler('start', tg_start))
            tg_app.add_handler(CommandHandler('help', tg_start))
            tg_app.add_handler(CommandHandler('price', tg_price))
            tg_app.add_handler(CommandHandler('top', tg_top))
            tg_app.add_handler(CommandHandler('signals', tg_signals))
            tg_app.add_handler(CommandHandler('subscribe', tg_subscribe))
            tg_app.add_handler(CommandHandler('unsubscribe', tg_unsubscribe))
            
            if tg_app.job_queue:
                tg_app.job_queue.run_daily(daily_report, time=dt_time(hour=9, minute=0)) # 16:00 ICT

            await tg_app.initialize()
            await tg_app.start()
            await tg_app.updater.start_polling()
            app.state.tg_app = tg_app
            logger.info("Telegram Bot is polling successfully.")
        except Exception as e:
            logger.error(f"Failed to start Telegram Bot: {e}", exc_info=True)
    else:
        logger.warning("TELEGRAM_BOT_TOKEN not found in environment.")
    
    asyncio.create_task(periodic_update())

@app.on_event("shutdown")
async def shutdown_event():
    if hasattr(app.state, "tg_app"):
        await app.state.tg_app.updater.stop()
        await app.state.tg_app.stop()
        await app.state.tg_app.shutdown()

async def periodic_update():
    while True:
        await update_market_data()
        await asyncio.sleep(600)

# --- Endpoints ---

@app.get("/api/market/overview")
async def get_market_overview(): return market_cache

@app.get("/api/market/scan")
async def get_market_scan(): return market_cache.get("scan", {})

@app.get("/api/market/update")
async def trigger_market_update():
    asyncio.create_task(update_market_data(force=True))
    return {"message": "Đã kích hoạt cập nhật"}

@app.get("/api/stock/{symbol}", response_model=StockAnalysisResponse)
async def analyze_stock(symbol: str):
    symbol = symbol.upper()
    try:
        raw = get_intraday_data(symbol)
        if raw is None or raw.empty: raise HTTPException(404, "Không tìm thấy dữ liệu")
        hist = get_stock_history_data(symbol)
        df = preprocess_data(raw)
        resampled = aggregate_data(df)
        resampled['cum_vol'] = resampled['volume'].cumsum()
        resampled['vwap'] = (resampled['close'] * resampled['volume']).cumsum() / resampled['cum_vol']
        
        hist_df = hist.sort_index().tail(90).reset_index()
        hist_df['MA5'] = hist_df['close'].rolling(5).mean()
        hist_df['MA20'] = hist_df['close'].rolling(20).mean()

        return {
            "symbol": symbol, "current_price": float(df['price'].iloc[-1]),
            "summary": convert_numpy(calculate_summary(df, resampled)),
            "trend_metrics": convert_numpy(calculate_trend_metrics(hist)),
            "intraday_data": convert_numpy(resampled.reset_index().to_dict('records')),
            "historical_data": convert_numpy(hist_df.to_dict('records'))
        }
    except Exception as e:
        logger.error(f"Error analyzing stock {symbol}: {e}", exc_info=True)
        raise HTTPException(500, str(e))

@app.get("/api/portfolio/{user_id}")
async def fetch_portfolio(user_id: str):
    df = get_portfolio(user_id)
    return [] if df.empty else df.to_dict('records')

@app.post("/api/trade")
async def execute_trade(trade: TradeRequest):
    ok, msg = place_trade(trade.user_id, trade.symbol, trade.quantity, trade.price, trade.type)
    if not ok: raise HTTPException(400, msg)
    return {"message": msg}

@app.post("/api/backtest")
async def api_run_backtest(req: BacktestRequest):
    res = run_backtest(req.symbol, req.start_date, req.end_date, req.initial_capital)
    if "error" in res: raise HTTPException(400, res["error"])
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))