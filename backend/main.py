
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sys
import os
import io

# Force UTF-8 for stdout/stderr to handle emojis from libraries on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add parent directory to path to import existing logic
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from stock_analyzer import (
    get_intraday_data, preprocess_data, aggregate_data, calculate_summary,
    get_stock_history_data, calculate_trend_metrics, is_trading_time
)
from backtester import run_backtest
from database import place_trade, get_portfolio, save_market_cache, get_market_cache, init_db
from vnstock import Listing, Quote
import pandas as pd
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
import asyncio
import time

app = FastAPI(title="BroStock API", version="1.0.0")

# Enable CORS for frontend integration
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
    if isinstance(obj, dict):
        return {k: convert_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy(v) for v in obj]
    elif isinstance(obj, (np.integer, int)): # Handles np.int_, np.int64, etc.
        return int(obj)
    elif isinstance(obj, (np.floating, float)): # Handles np.float_, np.float64, etc.
        if np.isnan(obj): # Handle NaN
            return None
        return float(obj)
    elif isinstance(obj, (np.bool_)):
        return bool(obj)
    return obj

# --- Global Market Cache ---
market_cache = {
    "indices": {},
    "top10": {
        "gainers": [],
        "losers": [],
        "volume": []
    },
    "signals": {
        "bullish": [],
        "bearish": []
    },
    "scan": {}, # Full market scan results
    "last_updated": None
}

def load_cache_from_db():
    """Loads market data from DB on startup."""
    global market_cache
    indices, idx_time = get_market_cache("indices")
    if indices:
        market_cache["indices"] = indices
        market_cache["last_updated"] = idx_time.isoformat()
    
    top10, top_time = get_market_cache("top10")
    if top10:
        market_cache["top10"] = top10
    
    signals, sig_time = get_market_cache("signals")
    if signals:
        market_cache["signals"] = signals
        
    scan, scan_time = get_market_cache("scan")
    if scan:
        market_cache["scan"] = scan

    if market_cache["last_updated"]:
        print(f"Loaded market cache from DB. Last updated: {market_cache['last_updated']}")

# --- Market Data Aggregator ---

async def update_market_data(force=False):
    """Fetches market-wide rankings and indices."""
    if not force and not is_trading_time() and market_cache["last_updated"] is not None:
        print("Outside trading hours. Skipping market data update.")
        return

    print(f"Starting market data update at {datetime.now()} (Force: {force})")
    try:
        # Use timedelta for robust date calculation
        start_date = (datetime.now() - timedelta(days=120)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')
        
        # 1. Fetch Indices
        indices_list = ['VNINDEX', 'HNXINDEX', 'VN30']
        indices_data = {}
        for idx in indices_list:
            try:
                q = Quote(symbol=idx, source='vci')
                df = q.history(start=start_date, end=end_date)
                if df is not None and len(df) >= 2:
                    prev = df['close'].iloc[-2]
                    curr = df['close'].iloc[-1]
                    indices_data[idx] = {
                        "value": float(curr),
                        "change": float(curr - prev),
                        "pct_change": float((curr / prev - 1) * 100),
                        "volume": int(df['volume'].iloc[-1])
                    }
                time.sleep(0.5) 
            except Exception as e:
                print(f"Error fetching index {idx}: {e}")
        
        if indices_data:
            data = convert_numpy(indices_data)
            market_cache["indices"] = data
            save_market_cache("indices", data)

        # 2. Fetch Rankings & Signals
        try:
            print("Fetching symbol constituents for rankings...")
            symbols = []
            for g in ['VN100', 'HNX30']:
                try:
                    syms = Listing().symbols_by_group(g)
                    if syms is not None:
                        symbols.extend(syms.tolist())
                except: pass
            
            symbols = list(set(symbols)) # Unique
            
            if not symbols:
                symbols = ['TCB', 'VCB', 'FPT', 'SSI', 'VNM', 'VIC', 'VHM', 'HPG', 'GAS', 'BID']

            print(f"Processing data for {len(symbols)} symbols...")
            def fetch_stock_full(symbol):
                try:
                    time.sleep(0.2) # Throttle requests
                    q = Quote(symbol=symbol, source='vci')
                    df = q.history(start=start_date, end=end_date)
                    if df is not None and not df.empty and len(df) >= 2:
                        prev = df['close'].iloc[-2]
                        curr = df['close'].iloc[-1]
                        
                        # Full trend metrics for signals
                        metrics = calculate_trend_metrics(df)
                        
                        return {
                            "symbol": symbol,
                            "price": float(curr),
                            "change": float(curr - prev),
                            "pct_change": float((curr / prev - 1) * 100),
                            "volume": int(df['volume'].iloc[-1]),
                            "signal_score": metrics.get('signal_score', 0),
                            "signal_label": metrics.get('signal_label', 'Neutral'),
                            "trend_strength": metrics.get('trend_strength', 0)
                        }
                except: pass
                return None

            with ThreadPoolExecutor(max_workers=2) as executor: # Reduced workers
                results = list(executor.map(fetch_stock_full, symbols))
            
            valid_data = [r for r in results if r]
            df_all = pd.DataFrame(valid_data)
            
            if not df_all.empty:
                # Top 10 Tables
                top10_data = {
                    "gainers": convert_numpy(df_all.sort_values("pct_change", ascending=False).head(10).to_dict('records')),
                    "losers": convert_numpy(df_all.sort_values("pct_change", ascending=True).head(10).to_dict('records')),
                    "volume": convert_numpy(df_all.sort_values("volume", ascending=False).head(10).to_dict('records'))
                }
                market_cache["top10"] = top10_data
                save_market_cache("top10", top10_data)
                
                # Top 15 Signals (Bullish/Bearish)
                # Filter first to exclude Neutral/Opposite signals
                bullish_df = df_all[df_all['signal_score'] >= 3]
                bearish_df = df_all[df_all['signal_score'] <= -3]
                
                # Primary sort: Signal Score, Secondary: Trend Strength
                bullish = bullish_df.sort_values(["signal_score", "trend_strength"], ascending=[False, False]).head(15)
                bearish = bearish_df.sort_values(["signal_score", "trend_strength"], ascending=[True, True]).head(15)
                
                signal_data = {
                    "bullish": convert_numpy(bullish.to_dict('records')),
                    "bearish": convert_numpy(bearish.to_dict('records'))
                }
                market_cache["signals"] = signal_data
                save_market_cache("signals", signal_data)
                
                # Full Scan (Symbol Map) for Alerts
                scan_dict = {}
                for _, row in df_all.iterrows():
                    score = row['signal_score']
                    action = "NEUTRAL"
                    if score >= 5: action = "BUY"
                    elif score <= -2: action = "SELL"
                    
                    scan_dict[row['symbol']] = {
                        "score": float(score),
                        "action": action,
                        "price": float(row['price']),
                        "pct_change": float(row['pct_change'])
                    }
                
                market_cache["scan"] = scan_dict
                save_market_cache("scan", scan_dict)
                
                print("Rankings, Signals, and Scan updated.")
        except Exception as e:
            print(f"Error fetching rankings: {e}")
        
        market_cache["last_updated"] = datetime.now().isoformat()
        print(f"Market data update complete at {market_cache['last_updated']}")
    except Exception as e:
        print(f"Error in update_market_data global: {e}")

# Run update on startup and every 10 minutes
@app.on_event("startup")
async def startup_event():
    init_db() # Ensure tables exist
    load_cache_from_db() # Load persistent data first
    asyncio.create_task(periodic_update())

async def periodic_update():
    while True:
        await update_market_data()
        await asyncio.sleep(600) # 10 minutes

# --- Endpoints ---

@app.get("/api/market/overview")
async def get_market_overview():
    return market_cache

@app.get("/api/market/scan")
async def get_market_scan():
    return market_cache.get("scan", {})

@app.get("/api/market/update")
async def trigger_market_update():
    asyncio.create_task(update_market_data(force=True))
    return {"message": "Market data update triggered in background"}

@app.get("/api/stock/{symbol}", response_model=StockAnalysisResponse)
async def analyze_stock(symbol: str):
    symbol = symbol.upper()
    try:
        raw_intraday = get_intraday_data(symbol)
        if raw_intraday is None or raw_intraday.empty:
             raise HTTPException(status_code=404, detail="Stock data not found")
        
        history_df = get_stock_history_data(symbol)
        
        df = preprocess_data(raw_intraday)
        resampled = aggregate_data(df)
        summary = calculate_summary(df, resampled)
        trend_metrics = calculate_trend_metrics(history_df)
        
        current_price = df['price'].iloc[-1]
        
        # Prepare Intraday Data (Add VWAP)
        resampled['cum_vol'] = resampled['volume'].cumsum()
        resampled['cum_vol_price'] = (resampled['close'] * resampled['volume']).cumsum()
        resampled['vwap'] = resampled['cum_vol_price'] / resampled['cum_vol']
        intraday_data = resampled.reset_index().to_dict('records')
        
        # Prepare Historical Data (Add MAs)
        historical_data = []
        if not history_df.empty:
            # Sort by date asc
            history_df = history_df.sort_index()
            # Calculate MAs
            history_df['MA5'] = history_df['close'].rolling(window=5).mean()
            history_df['MA20'] = history_df['close'].rolling(window=20).mean()
            
            # Reset index to get date column (it's index in get_stock_history_data)
            # Check if index is datetime
            hist_reset = history_df.reset_index()
            # Rename index col to 'time' or 'date' if needed. usually it is 'time' or 'date' from vnstock
            # In database.py get_history: df.set_index('time', inplace=True). So index name is 'time'.
            
            # Take last 90 days to reduce payload, frontend can slice 7D/30D
            hist_reset = hist_reset.tail(90)
            historical_data = hist_reset.to_dict('records')
        
        return {
            "symbol": symbol,
            "current_price": float(current_price),
            "summary": convert_numpy(summary),
            "trend_metrics": convert_numpy(trend_metrics),
            "intraday_data": convert_numpy(intraday_data),
            "historical_data": convert_numpy(historical_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portfolio/{user_id}")
async def fetch_portfolio(user_id: str):
    try:
        df = get_portfolio(user_id)
        if df.empty:
            return []
        return df.to_dict('records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trade")
async def execute_trade(trade: TradeRequest):
    success, msg = place_trade(
        trade.user_id, 
        trade.symbol, 
        trade.quantity, 
        trade.price, 
        trade.type
    )
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@app.post("/api/backtest")
async def api_run_backtest(req: BacktestRequest):
    result = run_backtest(req.symbol, req.start_date, req.end_date, req.initial_capital)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
