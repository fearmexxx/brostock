

import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
from vnstock import Vnstock
from vnstock import *
import time
import warnings
import json
from database import get_history, save_daily_bars, get_session, Symbol, get_market_cache, save_market_cache
from datetime import datetime, timedelta, timezone

# Disable unnecessary warnings | Tắt cảnh báo không cần thiết
warnings.filterwarnings("ignore")

def format_currency(value):
    """Format currency with thousands separators"""
    return "{:,.0f}".format(value).replace(",", ".")

def is_trading_time():
    """
    Checks if current time is within Vietnam trading hours (GMT+7):
    Monday - Friday
    Morning: 09:00 - 11:30
    Afternoon: 13:00 - 15:45
    """
    # Force GMT+7
    utc_now = datetime.now(timezone.utc)
    vn_tz = timezone(timedelta(hours=7))
    now = utc_now.astimezone(vn_tz)
    
    # Weekday check (0=Mon, 6=Sun)
    if now.weekday() > 4: 
        return False
    
    current_time = now.time()
    morning_start = datetime.strptime("09:00", "%H:%M").time()
    morning_end = datetime.strptime("11:30", "%H:%M").time()
    afternoon_start = datetime.strptime("13:00", "%H:%M").time()
    afternoon_end = datetime.strptime("15:45", "%H:%M").time()
    
    in_morning = morning_start <= current_time <= morning_end
    in_afternoon = afternoon_start <= current_time <= afternoon_end
    
    return in_morning or in_afternoon

# 1. Fetch and validate data | Lấy và kiểm tra dữ liệu
def get_intraday_data(symbol, max_retries=3):
    symbol = symbol.upper()
    cache_key = f"intraday_{symbol}"
    
    # 1. Load Cache
    cached_data, updated_at = get_market_cache(cache_key)
    has_cache = cached_data is not None and updated_at is not None
    
    # 2. Check Conditions
    trading_now = is_trading_time()
    is_fresh = False
    
    if has_cache:
        age_seconds = (datetime.now() - updated_at).total_seconds()
        # Fresh if: (Trading AND < 300s) OR (Not Trading)
        if not trading_now:
            is_fresh = True
        elif age_seconds < 300: # 5 minutes
            is_fresh = True
            
    # 3. Decision: Return Cache if valid
    if has_cache and is_fresh:
        try:
            df = pd.DataFrame(cached_data)
            if 'time' in df.columns:
                df['time'] = pd.to_datetime(df['time'])
            return df
        except Exception as e:
            print(f"[Cache Load Error] {symbol}: {e}")
            # Fall through to API if cache load fails
    
    # 4. Fetch API (Only if no cache OR cache is stale in trading time)
    try:
        # print(f"Fetching fresh data for {symbol}...")
        stock = Vnstock().stock(symbol=symbol, source='VCI')
        data = stock.quote.intraday(symbol=symbol, page_size=10000, show_log=False)
        
        if data is not None and not data.empty:
            # Save to Cache
            cache_df = data.copy()
            if 'time' in cache_df.columns:
                cache_df['time'] = cache_df['time'].dt.strftime('%Y-%m-%d %H:%M:%S')
            
            save_market_cache(cache_key, cache_df.to_dict('records'))
            return data
            
    except Exception as e:
        print(f"[API Error] {symbol}: {e}")
        # 5. Fallback to Stale Cache
        if has_cache:
            print(f"Returning STALE cache for {symbol}")
            try:
                df = pd.DataFrame(cached_data)
                if 'time' in df.columns:
                    df['time'] = pd.to_datetime(df['time'])
                return df
            except: pass
        # If no cache and API failed, re-raise
        raise e
        
    # If we got here (e.g. data empty but no exception), return empty or fallback
    if has_cache:
         try:
            df = pd.DataFrame(cached_data)
            if 'time' in df.columns:
                df['time'] = pd.to_datetime(df['time'])
            return df
         except: pass
         
    return pd.DataFrame()

def get_stock_history_data(symbol, days=365):
    """
    Fetches historical data for a symbol. 
    First checks DB, if data is stale or missing, fetches from API and updates DB.
    """
    try:
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days)
        
        # 1. Try DB first
        df = get_history(symbol, start_date=start_date, end_date=end_date)
        
        needs_update = False
        
        if df.empty:
            needs_update = True
        else:
            last_date = df.index.max().date()
            # Logic:
            # If Trading Time: We might want fresh data? 
            # Actually history API (Daily) usually updates at EOD. 
            # But let's follow user request: "Only pull real time data in the trading day time".
            # For History, if it's trading time, maybe we want to catch yesterday's close if we missed it?
            # Or if today is closed? 
            # Simple rule: If not trading time, and we have data up to yesterday (or Friday), use DB.
            
            if is_trading_time():
                 # Even in trading time, daily history only updates EOD or next day usually.
                 # But just in case API provides current day as a bar:
                 if last_date < end_date:
                     needs_update = True
            else:
                 # Outside trading time
                 # If we have data up to "yesterday" (or today if market closed), we are good.
                 # Only update if data is significantly stale (> 3 days old) to avoid daily API hits when market is closed
                 if last_date < end_date and (end_date - last_date).days > 3:
                     needs_update = True
        
        if needs_update:
            # Fetch from API
            # print(f"Fetching history for {symbol} from API...")
            quote = Quote(symbol=symbol, source='vci')
            
            # vnstock history expects 'YYYY-MM-DD'
            api_df = quote.history(start=start_date.strftime('%Y-%m-%d'), 
                                   end=end_date.strftime('%Y-%m-%d'), 
                                   interval='1D')
            
            if api_df is not None and not api_df.empty:
                save_daily_bars(symbol, api_df)
                # Re-fetch from DB to get consistent formatting/merged data
                df = get_history(symbol, start_date=start_date, end_date=end_date)
        
        return df
        
    except Exception as e:
        print(f"Error getting history for {symbol}: {e}")
        return pd.DataFrame()

def calculate_trend_metrics(df):
    """
    Calculates institutional-grade trend metrics from historical data (Daily).
    Produces a Conviction Score from -100 (Strong Sell) to +100 (Strong Buy).
    
    Factors:
    1. Trend (30%) - SMA20/50/200, Price position.
    2. Momentum (20%) - RSI, MACD, ROC.
    3. Volume Flow (15%) - Volume Surge, OBV, VWAP.
    4. Volatility (15%) - ATR expansion, Bollinger width.
    5. Mean Reversion (20%) - Bollinger bands, RSI extremes.
    """
    if df.empty or len(df) < 50:
        return {}
        
    # Ensure numeric types
    for col in ['close', 'volume', 'high', 'low']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    current_price = df['close'].iloc[-1]
    
    # 1. Trend Factor (30%) - Target: +/- 30
    sma_200 = df['close'].tail(200).mean() if len(df) >= 200 else df['close'].mean()
    sma_50 = df['close'].tail(50).mean()
    sma_20 = df['close'].tail(20).mean()
    
    trend_score = 0
    if sma_20 > sma_50: trend_score += 10
    if sma_50 > sma_200: trend_score += 10
    if current_price > sma_50: trend_score += 5
    if current_price > sma_200: trend_score += 5
    
    if sma_20 < sma_50: trend_score -= 10
    if sma_50 < sma_200: trend_score -= 10
    if current_price < sma_50: trend_score -= 5
    if current_price < sma_200: trend_score -= 5
    
    # 2. Momentum Factor (20%) - Target: +/- 20
    # RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = (100 - (100 / (1 + rs))).iloc[-1]
    
    # MACD
    ema_12 = df['close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['close'].ewm(span=26, adjust=False).mean()
    macd_line = ema_12 - ema_26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    macd_hist = macd_line - signal_line
    
    # ROC (14d)
    roc_14 = ((current_price / df['close'].iloc[-14]) - 1) * 100 if len(df) >= 14 else 0
    
    mom_score = 0
    if 50 <= rsi <= 70: mom_score += 5
    elif rsi > 70: mom_score -= 8  # Symmetric with RSI<30 bonus
    elif rsi < 30: mom_score += 8
    
    if macd_line.iloc[-1] > signal_line.iloc[-1]: mom_score += 5
    else: mom_score -= 5  # Bearish crossover penalty (symmetric)
    if macd_hist.iloc[-1] > macd_hist.iloc[-2]: mom_score += 3
    elif macd_hist.iloc[-1] < macd_hist.iloc[-2]: mom_score -= 3  # Histogram contracting
    if roc_14 > 5: mom_score += 4
    elif roc_14 < -5: mom_score -= 4
    
    # 3. Volume Flow (15%) - Target: +/- 15
    avg_vol_20 = df['volume'].tail(20).mean()
    avg_vol_7 = df['volume'].tail(7).mean()
    curr_vol = df['volume'].iloc[-1]
    vol_surge = curr_vol / avg_vol_7 if avg_vol_7 > 0 else 1
    
    # OBV
    obv = (np.sign(df['close'].diff()) * df['volume']).fillna(0).cumsum()
    obv_trend = 8 if obv.iloc[-1] > obv.tail(10).mean() else -8  # Enhanced OBV impact
    
    vol_score = 0
    if vol_surge > 2: vol_score += 8
    elif vol_surge > 1.5: vol_score += 6
    elif vol_surge < 0.5: vol_score -= 6  # Volume drought detection
    vol_score += obv_trend
    # Selling pressure: price drops + volume surges
    price_drop = df['close'].iloc[-1] < df['close'].iloc[-2]
    if price_drop and vol_surge > 1.5: vol_score -= 8  # Distribution detected
    vwap_proxy = (df['close'] * df['volume']).tail(20).sum() / df['volume'].tail(20).sum()
    if current_price > vwap_proxy:
        vol_score += 3
    else:
        vol_score -= 3  # Below VWAP is bearish
        
    # 4. Volatility Regime (15%) - Target: +/- 15
    # ATR
    tr = pd.concat([
        df['high'] - df['low'],
        (df['high'] - df['close'].shift(1)).abs(),
        (df['low'] - df['close'].shift(1)).abs()
    ], axis=1).max(axis=1)
    atr = tr.rolling(14).mean().iloc[-1]
    
    # Bollinger Bands
    std_20 = df['close'].tail(20).std()
    upper_bb = sma_20 + (2 * std_20)
    lower_bb = sma_20 - (2 * std_20)
    bb_width = (upper_bb - lower_bb) / sma_20
    
    vlt_score = 0
    # Expanding volatility with price move
    if tr.iloc[-1] > atr and abs(roc_14) > 2: vlt_score += 5
    # Squeeze
    if bb_width < df['close'].rolling(100).std().mean() / sma_20: vlt_score += 4
    # Risk off: Extreme spike
    if tr.iloc[-1] > atr * 2.5: vlt_score -= 5
    
    # 5. Mean Reversion (20%) - Target: +/- 20
    mr_score = 0
    if current_price < lower_bb: mr_score += 10
    if rsi < 30: mr_score += 6
    if current_price > upper_bb: mr_score -= 10
    if rsi > 70: mr_score -= 6  # Symmetric with RSI<30 (was 75)
    
    # --- Market Regime Detection (ADX) ---
    # Simplified ADX
    plus_dm = df['high'].diff().clip(lower=0)
    minus_dm = (-df['low'].diff()).clip(lower=0)
    tr_smooth = tr.rolling(14).mean()
    plus_di = 100 * (plus_dm.rolling(14).mean() / tr_smooth)
    minus_di = 100 * (minus_dm.rolling(14).mean() / tr_smooth)
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di)
    adx = dx.rolling(14).mean().iloc[-1]
    
    # Dynamic Weights
    w_trend, w_mom, w_vol, w_vlt, w_mr = 0.30, 0.20, 0.15, 0.15, 0.20
    if adx > 25: # Strong Trend
        w_trend, w_mr = 0.40, 0.10
    elif adx < 15: # Range Market
        w_trend, w_mr = 0.15, 0.35
        
    # Final Score
    raw_score = (trend_score * w_trend + 
                 mom_score * w_mom + 
                 vol_score * w_vol + 
                 vlt_score * w_vlt + 
                 mr_score * w_mr)
    
    # Map raw factors to -100 to +100 range
    # Theoretical max raw is ~30 (if weights were 1.0)
    # But since weights sum to 1.0, max is ~25-30. 
    # Let's normalize by assuming max possible components
    final_score = max(min(raw_score * 4, 100), -100) 
    
    # Labels
    if final_score >= 60: label = 'Strong Buy'
    elif final_score >= 25: label = 'Buy'
    elif final_score >= 10: label = 'Bullish Bias'
    elif final_score > -10: label = 'Neutral'
    elif final_score >= -25: label = 'Bearish Bias'
    elif final_score >= -60: label = 'Sell'
    else: label = 'Strong Sell'

    # --- Normalize Factors for UI (Scale 0-100) ---
    def normalize(val, max_val):
        if max_val == 0: return 50
        return int(max(0, min(100, (val + max_val) / (2 * max_val) * 100)))

    # Prediction 5d (Conviction-Based Expected Movement)
    daily_vol_pct = (atr / current_price) * 100 if current_price > 0 else 0
    expected_move_pct = (final_score / 100.0) * daily_vol_pct * 1.5 
    
    # Safety check for slope calculation
    final_prediction_pct = expected_move_pct
    if len(df) >= 10:
        try:
            y_recent = df['close'].tail(10).values
            x_recent = np.arange(len(y_recent))
            slope, _ = np.polyfit(x_recent, y_recent, 1)
            slope_pct = (slope / current_price) * 100 * 5
            final_prediction_pct = (expected_move_pct * 0.7) + (slope_pct * 0.3)
        except: pass
    
    # Final Cap to prevent extreme repeated values
    final_prediction_pct = max(min(final_prediction_pct, 15.0), -15.0)

    # --- Target Price & Stop Loss (Swing Trading) ---
    atr_value = float(atr) if pd.notnull(atr) else 0
    # Target: ATR × 2 above current price, capped at upper BB
    target_by_atr = current_price + (atr_value * 2)
    target_price = min(target_by_atr, float(upper_bb)) if final_score > 0 else max(current_price - (atr_value * 2), float(lower_bb))
    # For BUY signals: target is above, stop is below
    # For SELL signals: target is below, stop is above
    if final_score >= 0:
        target_price = current_price + (atr_value * 2)
        stop_loss = current_price - (atr_value * 1.5)
        # Cap stop-loss at -5% max
        stop_loss = max(stop_loss, current_price * 0.95)
    else:
        target_price = current_price - (atr_value * 2)
        stop_loss = current_price + (atr_value * 1.5)
        stop_loss = min(stop_loss, current_price * 1.05)
    
    target_pct = round(((target_price / current_price) - 1) * 100, 2) if current_price > 0 else 0
    stop_loss_pct = round(((stop_loss / current_price) - 1) * 100, 2) if current_price > 0 else 0
    
    # Risk:Reward Ratio
    reward = abs(target_price - current_price)
    risk = abs(current_price - stop_loss)
    risk_reward_ratio = round(reward / risk, 2) if risk > 0 else 0

    # Calculate Risk Score
    risk_metrics = calculate_risk_score(df)

    # Liquidity Filter (Vietnam-Specific)
    avg_vol_20 = df['volume'].tail(20).mean() if len(df) >= 20 else df['volume'].mean()
    if avg_vol_20 < 100000:
        liquidity_status = "Very Low"
    elif avg_vol_20 < 500000:
        liquidity_status = "Low"
    else:
        liquidity_status = "Adequate"

    return {
        'current_price_daily': current_price,
        'signal_score': int(final_score),
        'signal_label': label,
        'market_regime': 'Trending' if adx > 25 else 'Weak Trend' if adx > 15 else 'Range',
        'adx': adx,
        'liquidity_status': liquidity_status,
        'avg_vol_20': float(avg_vol_20) if pd.notnull(avg_vol_20) else 0.0,
        'factors': {
            'trend': normalize(trend_score, 30),
            'momentum': normalize(mom_score, 20),
            'volume': normalize(vol_score, 15),
            'volatility': normalize(vlt_score, 15),
            'mean_reversion': normalize(mr_score, 20)
        },
        'risk_score': risk_metrics['risk_score'],
        'risk_label': risk_metrics['risk_label'],
        'risk_factors': risk_metrics['factors'],
        'weights': {
            'trend': w_trend,
            'momentum': w_mom,
            'volume': w_vol,
            'volatility': w_vlt,
            'mean_reversion': w_mr
        },
        'rsi': rsi,
        'macd_hist': float(macd_hist.iloc[-1]) if hasattr(macd_hist, 'iloc') else float(macd_hist),
        'atr': atr,
        'bb_width': bb_width,
        'vol_surge': vol_surge,
        'prediction_5d_pct': round(final_prediction_pct, 2),
        'prediction_label': 'UPWARD' if final_prediction_pct > 0.75 else 'DOWNWARD' if final_prediction_pct < -0.75 else 'SIDEWAYS',
        'target_price': round(target_price, 2),
        'target_pct': target_pct,
        'stop_loss': round(stop_loss, 2),
        'stop_loss_pct': stop_loss_pct,
        'risk_reward_ratio': risk_reward_ratio
    }

def calculate_risk_score(df):
    """
    Calculates a multi-factor Risk Score (0-100).
    Factors:
    1. Volatility (ATR/Price) - 40%
    2. Squeeze/Expansion (BB Width) - 30%
    3. Drawdown (14d Max Drawdown) - 30%
    """
    if df.empty or len(df) < 20:
        return {'risk_score': 50, 'risk_label': 'Medium', 'factors': {}}

    current_price = df['close'].iloc[-1]
    
    # 1. Volatility Factor
    tr = pd.concat([
        df['high'] - df['low'],
        (df['high'] - df['close'].shift(1)).abs(),
        (df['low'] - df['close'].shift(1)).abs()
    ], axis=1).max(axis=1)
    atr_14 = tr.rolling(14).mean().iloc[-1]
    vol_ratio = (atr_14 / current_price) * 100
    # Normalize vol_ratio: 1% is low (20 pts), 5% is high (100 pts)
    vol_score = min(100, max(0, (vol_ratio / 5.0) * 100))

    # 2. BB Width Factor
    sma_20 = df['close'].tail(20).mean()
    std_20 = df['close'].tail(20).std()
    bb_width = (4 * std_20) / sma_20
    # Normalize bb_width: 0.02 is low (20 pts), 0.15 is high (100 pts)
    vlt_expansion_score = min(100, max(0, (bb_width / 0.15) * 100))

    # 3. Drawdown Factor (14 days)
    recent_prices = df['close'].tail(14)
    rolling_max = recent_prices.cummax()
    drawdown = (recent_prices - rolling_max) / rolling_max
    max_dd_14 = abs(drawdown.min()) * 100
    # Normalize drawdown: 2% is low (20 pts), 15% is high (100 pts)
    dd_score = min(100, max(0, (max_dd_14 / 15.0) * 100))

    final_risk = (vol_score * 0.4) + (vlt_expansion_score * 0.3) + (dd_score * 0.3)
    
    label = 'Low'
    if final_risk > 75: label = 'Extreme'
    elif final_risk > 60: label = 'High'
    elif final_risk > 40: label = 'Medium'
    elif final_risk < 25: label = 'Very Low'

    return {
        'risk_score': int(final_risk),
        'risk_label': label,
        'factors': {
            'volatility': int(vol_score),
            'expansion': int(vlt_expansion_score),
            'drawdown': int(dd_score)
        }
    }

# 2. Pre-processing data | Tiền xử lý dữ liệu
def preprocess_data(df):
    df = df.copy()
    # Convert price to actual VND (API returns in 1,000s)
    df['price'] = df['price'] * 1000
    
    df['time'] = pd.to_datetime(df['time'])
    if df['time'].dt.tz is not None:
        # Convert to GMT+7 (Asia/Ho_Chi_Minh)
        df['time'] = df['time'].dt.tz_convert('Asia/Ho_Chi_Minh').dt.tz_localize(None)
    df['time'] = pd.to_datetime(df['time'])

    df['value'] = df['price'] * df['volume']
    df['in_flow'] = np.where(df['match_type'] == 'Buy', df['value'], 0)
    df['out_flow'] = np.where(df['match_type'] == 'Sell', df['value'], 0)
    df.set_index('time', inplace=True)
    return df

# 3. Summarize & compute metrics | Tổng hợp và tính toán chỉ số
def aggregate_data(df):
    resampled = df.resample('min').agg({
        'price': ['first', 'max', 'min', 'last'], # OHLC
        'in_flow': 'sum',
        'out_flow': 'sum',
        'volume': 'sum',
        'match_type': 'count'
    })
    
    # Flatten MultiIndex columns
    resampled.columns = ['open', 'high', 'low', 'close', 'in_flow', 'out_flow', 'volume', 'order_count']
    
    resampled['net_flow'] = resampled['in_flow'] - resampled['out_flow']
    resampled['cum_net_flow'] = resampled['net_flow'].cumsum()
    
    # --- Smart Money Logic: Big Orders (> 90th percentile) ---
    threshold = df['volume'].quantile(0.90)
    big_orders = df[df['volume'] > threshold]
    
    big_buy = big_orders[big_orders['match_type'] == 'Buy'].resample('min').agg({'volume': 'sum'})
    big_sell = big_orders[big_orders['match_type'] == 'Sell'].resample('min').agg({'volume': 'sum'})
    
    resampled['big_buy_vol'] = big_buy['volume'].reindex(resampled.index, fill_value=0)
    resampled['big_sell_vol'] = big_sell['volume'].reindex(resampled.index, fill_value=0)
    resampled['net_big_flow'] = resampled['big_buy_vol'] - resampled['big_sell_vol']
    resampled['cum_net_big_flow'] = resampled['net_big_flow'].cumsum()
    
    # These need re-calculation because they depend on filtering the original DF
    # We can't easily aggregate 'buy_count' directly in the main agg without custom functions or separate resamples
    # So we keep the separate resamples for specific filtered counts
    buy_resampled = df[df['match_type'] == 'Buy'].resample('min').agg({'match_type': 'count', 'volume': 'sum'})
    sell_resampled = df[df['match_type'] == 'Sell'].resample('min').agg({'match_type': 'count', 'volume': 'sum'})
    
    # Join back to resampled (use reindex to ensure matching index)
    resampled['buy_count'] = buy_resampled['match_type'].reindex(resampled.index, fill_value=0)
    resampled['sell_count'] = sell_resampled['match_type'].reindex(resampled.index, fill_value=0)
    resampled['buy_volume'] = buy_resampled['volume'].reindex(resampled.index, fill_value=0)
    resampled['sell_volume'] = sell_resampled['volume'].reindex(resampled.index, fill_value=0)

    resampled['cum_buy'] = resampled['buy_count'].cumsum()
    resampled['cum_sell'] = resampled['sell_count'].cumsum()
    resampled['cum_in_flow'] = resampled['in_flow'].cumsum()
    resampled['cum_out_flow'] = resampled['out_flow'].cumsum()

    resampled['avg_buy_volume'] = np.where(resampled['buy_count'] != 0,
                                           resampled['buy_volume'] / resampled['buy_count'], 0)
    resampled['avg_sell_volume'] = np.where(resampled['sell_count'] != 0,
                                            resampled['sell_volume'] / resampled['sell_count'], 0)
    resampled['avg_buy_sell_ratio'] = np.where(resampled['avg_sell_volume'] != 0,
                                               resampled['avg_buy_volume'] / resampled['avg_sell_volume'], np.inf)
    return resampled

# 4. Compute summary statistics | Tính toán thống kê tóm tắt
def calculate_summary(df, resampled):
    volatility = df['price'].std()
    imbalance_ratio = np.where(resampled['out_flow'] != 0, resampled['in_flow'] / resampled['out_flow'], 0)
    order_to_volume_ratio = np.where(resampled['volume'] != 0, resampled['order_count'] / resampled['volume'], 0)

    summary = {
        'Tổng dòng tiền vào (VND)': format_currency(resampled['in_flow'].sum()),
        'Tổng dòng tiền ra (VND)': format_currency(resampled['out_flow'].sum()),
        'Dòng tiền ròng (VND)': format_currency(resampled['net_flow'].sum()),
        'Dòng tiền Cá mập vào (VND)': format_currency(resampled['big_buy_vol'].sum() * (df['price'].mean())),
        'Dòng tiền Cá mập ra (VND)': format_currency(resampled['big_sell_vol'].sum() * (df['price'].mean())),
        'Dòng tiền Cá mập ròng (VND)': format_currency(resampled['net_big_flow'].sum() * (df['price'].mean())),
        'Tổng số lệnh mua': int(resampled['buy_count'].sum()),
        'Tổng số lệnh bán': int(resampled['sell_count'].sum()),
        'Khối lượng trung bình lệnh mua': resampled['avg_buy_volume'].mean(),
        'Khối lượng trung bình lệnh bán': resampled['avg_sell_volume'].mean(),
        'Tỷ lệ khối lượng trung bình mua/bán': resampled['avg_buy_sell_ratio'].replace(np.inf, 0).mean(),
        'Giá cao nhất': df['price'].max(),
        'Giá thấp nhất': df['price'].min(),
        'Giá trung bình': df['price'].mean(),
        'Volatility (Độ lệch chuẩn giá)': volatility,
        'Imbalance Ratio (Trung bình)': np.mean(imbalance_ratio),
        'Order-to-Volume Ratio (Trung bình)': np.mean(order_to_volume_ratio)
    }
    return summary

# 5. Generate summary table output | In ra bảng tóm tắt
def print_summary(summary):
    print("\n=== TÓM TẮT PHÂN TÍCH ===")
    for key, value in summary.items():
        if isinstance(value, str):
            print(f"{key}: {value}")
        elif isinstance(value, float):
            print(f"{key}: {value:.6f}")
        else:
            print(f"{key}: {value}")
    print("=========================\n")

# --- PLOTLY INTERACTIVE CHARTS ---

def create_main_chart(resampled, symbol):
    """
    Creates the main interactive chart with Price (Candlestick), VWAP, and Net Flow.
    """
    # Calculate VWAP
    # VWAP = Cumulative(Price * Volume) / Cumulative(Volume)
    # We need to calculate it from the resampled data for the intraday session
    resampled['cum_vol'] = resampled['volume'].cumsum()
    resampled['cum_vol_price'] = (resampled['close'] * resampled['volume']).cumsum()
    resampled['vwap'] = resampled['cum_vol_price'] / resampled['cum_vol']

    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, 
                        vertical_spacing=0.03, subplot_titles=(f'{symbol} Price & VWAP', 'Net Flow'),
                        row_heights=[0.7, 0.3])

    # 1. Candlestick
    fig.add_trace(go.Candlestick(x=resampled.index,
                                 open=resampled['open'],
                                 high=resampled['high'],
                                 low=resampled['low'],
                                 close=resampled['close'],
                                 name='OHLC'), row=1, col=1)

    # 2. VWAP
    fig.add_trace(go.Scatter(x=resampled.index, y=resampled['vwap'], 
                             mode='lines', name='VWAP', line=dict(color='orange', width=1.5)), row=1, col=1)

    # 3. Net Flow Bar
    colors = ['green' if x >= 0 else 'red' for x in resampled['net_flow']]
    fig.add_trace(go.Bar(x=resampled.index, y=resampled['net_flow'],
                         name='Net Flow', marker_color=colors), row=2, col=1)

    # Layout
    fig.update_layout(xaxis_rangeslider_visible=False, 
                      template="plotly_white",
                      height=600,
                      margin=dict(l=20, r=20, t=40, b=20))
    return fig

def create_intraday_heatmap(df, symbol):
    """
    Interactive Heatmap of Net Flow.
    """
    df = df.copy()
    df.index = pd.to_datetime(df.index)
    df['hour'] = df.index.hour
    df['minute'] = df.index.minute
    df['net_flow'] = df['in_flow'] - df['out_flow']
    
    heatmap_data = df.groupby(['hour', 'minute'])['net_flow'].sum().unstack(fill_value=0)
    
    fig = go.Figure(data=go.Heatmap(
        z=heatmap_data.values,
        x=heatmap_data.columns,
        y=heatmap_data.index,
        colorscale='RdYlGn',
        colorbar=dict(title='Net Flow (VND)')
    ))
    
    fig.update_layout(title=f'Net Flow Heatmap - {symbol}',
                      xaxis_title='Minute',
                      yaxis_title='Hour',
                      template="plotly_white",
                      height=400)
    return fig

def create_order_distribution(resampled, symbol):
    """
    Pie chart or Bar chart for Buy vs Sell volume/count.
    """
    total_buy_vol = resampled['buy_volume'].sum()
    total_sell_vol = resampled['sell_volume'].sum()
    
    fig = go.Figure(data=[go.Pie(labels=['Buy Volume', 'Sell Volume'], 
                                 values=[total_buy_vol, total_sell_vol],
                                 hole=.3,
                                 marker_colors=['#4CAF50', '#F44336'])])
    
    fig.update_layout(title=f'Buy vs Sell Volume - {symbol}', height=300)
    return fig

def create_historical_chart(history_df, symbol, days=30):
    """
    Creates a Daily OHLC chart for the specified number of days.
    """
    # Filter data
    subset = history_df.tail(days).copy()
    
    # Calculate MAs
    subset['MA5'] = subset['close'].rolling(window=5).mean()
    subset['MA20'] = subset['close'].rolling(window=20).mean()

    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, 
                        vertical_spacing=0.03, subplot_titles=(f'{symbol} - Khung {days} Ngày', 'Khối Lượng'),
                        row_heights=[0.7, 0.3])

    # 1. Candlestick
    fig.add_trace(go.Candlestick(x=subset.index,
                                 open=subset['open'],
                                 high=subset['high'],
                                 low=subset['low'],
                                 close=subset['close'],
                                 name='Giá'), row=1, col=1)

    # 2. MAs
    fig.add_trace(go.Scatter(x=subset.index, y=subset['MA5'], 
                             mode='lines', name='MA5', line=dict(color='orange', width=1)), row=1, col=1)
    fig.add_trace(go.Scatter(x=subset.index, y=subset['MA20'], 
                             mode='lines', name='MA20', line=dict(color='blue', width=1)), row=1, col=1)

    # 3. Volume
    colors = ['green' if row['close'] >= row['open'] else 'red' for i, row in subset.iterrows()]
    fig.add_trace(go.Bar(x=subset.index, y=subset['volume'],
                         name='Khối Lượng', marker_color=colors), row=2, col=1)

    # Layout
    fig.update_layout(xaxis_rangeslider_visible=False, 
                      template="plotly_white",
                      height=600,
                      margin=dict(l=20, r=20, t=40, b=20))
    return fig

#  6. Plot all charts | Vẽ tất cả biểu đồ
def plot_all_charts(df, resampled, symbol):
    plot_cum_net_flow(resampled, symbol)
    plot_avg_buy_sell_ratio(resampled, symbol)
    plot_cum_in_out_flow(resampled, symbol)
    plot_net_flow_heatmap(df, symbol)
    plot_volume_and_orders_distribution(df, resampled, symbol)

    # 6.1. Chart of Cumulative Net Cash Flow | Biểu đồ dòng tiền ròng tích lũy
def plot_cum_net_flow(resampled, symbol):
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(resampled.index, resampled['cum_net_flow'], label='Cumulative Net Flow', color='blue')
    ax.axhline(0, color='gray', linestyle='--', linewidth=1)
    ax.set_title(f'Dòng tiền ròng tích lũy - {symbol}')
    ax.set_xlabel('Thời gian')
    ax.set_ylabel('VNĐ')
    ax.grid(True)
    plt.tight_layout()
    return fig  # Return the figure for Streamlit to display 
    # 6.2. Average Buy/Sell Volume Ratio | Tỷ lệ Mua/Bán trung bình
def plot_avg_buy_sell_ratio(resampled, symbol):
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(resampled.index, resampled['avg_buy_sell_ratio'], label='Buy/Sell Ratio', color='purple')
    ax.set_title(f'Tỷ lệ khối lượng trung bình Mua/Bán - {symbol}')
    ax.set_xlabel('Thời gian')
    ax.set_ylabel('Tỷ lệ')
    ax.grid(True)
    plt.tight_layout()
    return fig
    # 6.3. Cumulative Inflow/Outflow | Dòng tiền vào/ra tích lũy
def plot_cum_in_out_flow(resampled, symbol):
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(resampled.index, resampled['cum_in_flow'], label='Cumulative Inflow', color='green')
    ax.plot(resampled.index, resampled['cum_out_flow'], label='Cumulative Outflow', color='red')
    ax.set_title(f'Dòng tiền vào / ra tích lũy - {symbol}')
    ax.set_xlabel('Thời gian')
    ax.set_ylabel('VNĐ')
    ax.legend()
    ax.grid(True)
    plt.tight_layout()
    return fig
    # 6.4. Heatmap of Net Cash Flow | Heatmap dòng tiền ròng

def plot_net_flow_heatmap(df, symbol):
    df = df.copy()

    # Ensure index is datetime | Đảm bảo index là datetime
    df.index = pd.to_datetime(df.index)

    # Create 'hour' and 'minute' columns for heatmap | Tạo 2 cột giờ và phút để xây heatmap
    df['hour'] = df.index.hour
    df['minute'] = df.index.minute

    # Calculate net flow for each transaction | Tính net flow mỗi dòng
    df['net_flow'] = df['in_flow'] - df['out_flow']

    # Group by hour and minute to create heatmap data | Group theo giờ và phút để tạo heatmap data
    heatmap_data = df.groupby(['hour', 'minute'])['net_flow'].sum().unstack(fill_value=0)

    # heatmap
    plt.figure(figsize=(12, 6))
    sns.heatmap(heatmap_data, cmap='RdYlGn', cbar_kws={'label': 'Dòng tiền ròng (VNĐ)'})
    plt.title(f'Heatmap dòng tiền ròng theo phút - {symbol}')
    plt.xlabel('Phút')
    plt.ylabel('Giờ')
    plt.tight_layout()
    return plt.gcf()

    # 6.5. Trading Volume and Order Quantity | Khối lượng và số lượng
def plot_volume_and_orders_distribution(df, resampled, symbol):
    fig, ax1 = plt.subplots(figsize=(10, 4))
    ax1.bar(resampled.index, resampled['volume'], width=0.0005, color='skyblue', label='Volume')
    ax1.set_ylabel('Khối lượng giao dịch', color='skyblue')
    ax1.tick_params(axis='y', labelcolor='skyblue')
    ax2 = ax1.twinx()
    ax2.plot(resampled.index, resampled['order_count'], color='orange', label='Số lệnh')
    ax2.set_ylabel('Số lệnh', color='orange')
    ax2.tick_params(axis='y', labelcolor='orange')
    plt.title(f'Phân bố khối lượng và số lệnh - {symbol}')
    fig.tight_layout()
    return fig

def generate_intraday_chart_image(symbol):
    """
    Generates a static intraday chart image for Telegram using Matplotlib.
    Returns a BytesIO object.
    """
    import io
    try:
        df = get_intraday_data(symbol)
        if df.empty:
            return None
            
        df = preprocess_data(df)
        resampled = aggregate_data(df)
        
        if resampled.empty:
            return None

        # Create plot
        plt.figure(figsize=(10, 6))
        plt.style.use('dark_background')
        
        # Subplots: Price and Volume
        ax1 = plt.subplot2grid((4, 1), (0, 0), rowspan=3)
        ax2 = plt.subplot2grid((4, 1), (3, 0), rowspan=1, sharex=ax1)
        
        # Plot Price
        ax1.plot(resampled.index, resampled['close'], color='#00ff00', linewidth=2, label='Giá')
        # Simple VWAP
        resampled['cum_vol'] = resampled['volume'].cumsum()
        resampled['cum_vol_price'] = (resampled['close'] * resampled['volume']).cumsum()
        resampled['vwap'] = resampled['cum_vol_price'] / resampled['cum_vol']
        ax1.plot(resampled.index, resampled['vwap'], color='orange', linestyle='--', alpha=0.8, label='VWAP')
        
        ax1.set_title(f'Biểu đồ trong ngày: {symbol}', fontsize=14, color='white')
        ax1.legend()
        ax1.grid(alpha=0.2)
        
        # Plot Volume
        colors = ['green' if r['close'] >= r['open'] else 'red' for _, r in resampled.iterrows()]
        ax2.bar(resampled.index, resampled['volume'], color=colors, alpha=0.8)
        ax2.set_ylabel('Khối lượng', fontsize=10, color='gray')
        ax2.grid(alpha=0.2)
        
        plt.xticks(rotation=0)
        plt.tight_layout()
        
        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100)
        buf.seek(0)
        plt.close()
        return buf
    except Exception as e:
        print(f"Lỗi tạo biểu đồ: {e}")
        return None

def analyze_stock(symbol):
    """Phân tích chi tiết mã cổ phiếu"""
    try:
        df = get_intraday_data(symbol)
        if df.empty:
            raise ValueError(f"Dữ liệu trống cho mã {symbol}. Mã có thể không tồn tại hoặc chưa có giao dịch.")
        
        df = preprocess_data(df)
        resampled = aggregate_data(df)
        summary = calculate_summary(df, resampled)
        plot_all_charts(df, resampled, symbol)
        print_summary(summary)
    
    except Exception as e:
        print(f"Lỗi phân tích mã {symbol}: {e}")



