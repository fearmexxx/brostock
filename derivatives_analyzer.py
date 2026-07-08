"""
BroStock Derivatives Analyzer — VN30F Intraday Bias Signal Engine
Generates daily LONG/SHORT/NEUTRAL signals for VN30F futures trading
based on VN30 Index technical analysis.

Score: -100 (Strong Short) to +100 (Strong Long)
"""

import pandas as pd
import numpy as np
from vnstock import Quote
from datetime import datetime, timedelta
from database import get_market_cache, save_market_cache

def get_vn30_data(days=120):
    """Fetch VN30 Index daily OHLCV data."""
    try:
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
        q = Quote(symbol='VN30', source='vci')
        df = q.history(start=start_date, end=end_date)
        if df is not None and len(df) >= 2:
            for col in ['open', 'high', 'low', 'close', 'volume']:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            return df
    except Exception as e:
        print(f"[Derivatives] Error fetching VN30 data: {e}")
    return pd.DataFrame()


def calculate_vn30f_signal(df, market_breadth=None):
    """
    Calculates VN30F Daily Bias Signal.
    Score: -100 (Strong Short) to +100 (Strong Long)
    
    Factors:
    1. EMA Trend (25%) — EMA9/21/50 alignment
    2. VWAP & Price Action (20%) — Position vs SMA20, gaps
    3. RSI & MACD Momentum (20%) — RSI14, MACD crossover
    4. Volatility Regime (15%) — ATR expansion, BB squeeze, ADX
    5. Market Breadth (10%) — Advance/Decline ratio
    6. Multi-day Pattern (10%) — Consecutive candles, higher highs/lows
    """
    if df.empty or len(df) < 50:
        return {}
    
    current = df.iloc[-1]
    prev = df.iloc[-2]
    current_price = current['close']
    
    # ===== SHARED INDICATORS =====
    
    # EMAs
    ema_9 = df['close'].ewm(span=9, adjust=False).mean()
    ema_21 = df['close'].ewm(span=21, adjust=False).mean()
    ema_50 = df['close'].ewm(span=50, adjust=False).mean()
    
    # SMA20
    sma_20 = df['close'].rolling(20).mean()
    
    # RSI 14
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    rsi_val = rsi.iloc[-1]
    
    # MACD
    ema_12 = df['close'].ewm(span=12, adjust=False).mean()
    ema_26 = df['close'].ewm(span=26, adjust=False).mean()
    macd_line = ema_12 - ema_26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    macd_hist = macd_line - signal_line
    
    # ATR 14
    tr = pd.concat([
        df['high'] - df['low'],
        (df['high'] - df['close'].shift(1)).abs(),
        (df['low'] - df['close'].shift(1)).abs()
    ], axis=1).max(axis=1)
    atr = tr.rolling(14).mean()
    atr_val = atr.iloc[-1]
    
    # Bollinger Bands
    std_20 = df['close'].rolling(20).std()
    upper_bb = sma_20 + (2 * std_20)
    lower_bb = sma_20 - (2 * std_20)
    bb_width = ((upper_bb - lower_bb) / sma_20).iloc[-1]
    
    # ADX
    plus_dm = df['high'].diff().clip(lower=0)
    minus_dm = (-df['low'].diff()).clip(lower=0)
    tr_smooth = tr.rolling(14).mean()
    plus_di = 100 * (plus_dm.rolling(14).mean() / tr_smooth)
    minus_di = 100 * (minus_dm.rolling(14).mean() / tr_smooth)
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di)
    adx = dx.rolling(14).mean().iloc[-1]
    
    # ===== FACTOR 1: EMA Trend (25%) — max ±25 =====
    ema_score = 0
    if ema_9.iloc[-1] > ema_21.iloc[-1]: ema_score += 10
    else: ema_score -= 10
    if ema_21.iloc[-1] > ema_50.iloc[-1]: ema_score += 8
    else: ema_score -= 8
    if current_price > ema_9.iloc[-1]: ema_score += 7
    else: ema_score -= 7
    ema_score = max(min(ema_score, 25), -25)
    
    # ===== FACTOR 2: VWAP & Price Action (20%) — max ±20 =====
    pa_score = 0
    # VWAP proxy: SMA20 volume-weighted approximation
    vwap_proxy = (df['close'] * df['volume']).rolling(20).sum() / df['volume'].rolling(20).sum()
    if current_price > vwap_proxy.iloc[-1]: pa_score += 8
    else: pa_score -= 8
    # Price vs SMA20
    if current_price > sma_20.iloc[-1]: pa_score += 6
    else: pa_score -= 6
    # Gap from previous close
    gap_pct = ((current['open'] - prev['close']) / prev['close']) * 100
    if gap_pct > 0.3: pa_score += 6
    elif gap_pct < -0.3: pa_score -= 6
    pa_score = max(min(pa_score, 20), -20)
    
    # ===== FACTOR 3: RSI & MACD Momentum (20%) — max ±20 =====
    mom_score = 0
    if 50 <= rsi_val <= 70: mom_score += 6
    elif rsi_val > 70: mom_score -= 4  # Overbought caution
    elif rsi_val < 30: mom_score += 4   # Oversold bounce
    elif 30 <= rsi_val < 50: mom_score -= 6  # Bearish momentum
    
    if macd_line.iloc[-1] > signal_line.iloc[-1]: mom_score += 6
    else: mom_score -= 6
    if macd_hist.iloc[-1] > macd_hist.iloc[-2]: mom_score += 4
    elif macd_hist.iloc[-1] < macd_hist.iloc[-2]: mom_score -= 4
    # RSI extreme bounce
    if rsi_val < 25: mom_score += 4
    elif rsi_val > 75: mom_score -= 4
    mom_score = max(min(mom_score, 20), -20)
    
    # ===== FACTOR 4: Volatility Regime (15%) — max ±15 =====
    vol_score = 0
    # ATR expansion with trend (good for directional trading)
    if tr.iloc[-1] > atr_val and adx > 25: vol_score += 8
    elif tr.iloc[-1] > atr_val and adx < 15: vol_score -= 3  # Choppy volatile = bad
    # BB Squeeze (potential breakout)
    avg_bb_width = ((upper_bb - lower_bb) / sma_20).rolling(50).mean().iloc[-1]
    if bb_width < avg_bb_width * 0.7: vol_score += 4  # Squeeze = potential breakout
    # Extreme spike caution
    if tr.iloc[-1] > atr_val * 2.5: vol_score -= 7
    # Direction hint from BB position
    if current_price > upper_bb.iloc[-1]: vol_score += 3  # Breakout up
    elif current_price < lower_bb.iloc[-1]: vol_score -= 3  # Breakout down
    vol_score = max(min(vol_score, 15), -15)
    
    # ===== FACTOR 5: Market Breadth (10%) — max ±10 =====
    breadth_score = 0
    if market_breadth:
        adv = market_breadth.get('advancing', 0)
        dec = market_breadth.get('declining', 0)
        total = adv + dec
        if total > 0:
            adv_pct = adv / total
            if adv_pct > 0.7: breadth_score += 10
            elif adv_pct > 0.6: breadth_score += 5
            elif adv_pct < 0.3: breadth_score -= 10
            elif adv_pct < 0.4: breadth_score -= 5
    breadth_score = max(min(breadth_score, 10), -10)
    
    # ===== FACTOR 6: Multi-day Pattern (10%) — max ±10 =====
    pattern_score = 0
    if len(df) >= 5:
        # 3 consecutive bullish/bearish candles
        last3_bullish = all(df['close'].iloc[i] > df['open'].iloc[i] for i in range(-3, 0))
        last3_bearish = all(df['close'].iloc[i] < df['open'].iloc[i] for i in range(-3, 0))
        if last3_bullish: pattern_score += 5
        elif last3_bearish: pattern_score -= 5
        
        # Higher highs + higher lows (3 days)
        hh = df['high'].iloc[-1] > df['high'].iloc[-2] > df['high'].iloc[-3]
        hl = df['low'].iloc[-1] > df['low'].iloc[-2] > df['low'].iloc[-3]
        ll = df['low'].iloc[-1] < df['low'].iloc[-2] < df['low'].iloc[-3]
        lh = df['high'].iloc[-1] < df['high'].iloc[-2] < df['high'].iloc[-3]
        if hh and hl: pattern_score += 5
        elif ll and lh: pattern_score -= 5
    pattern_score = max(min(pattern_score, 10), -10)
    
    # ===== DYNAMIC WEIGHTING (ADX-based) =====
    w_ema, w_pa, w_mom, w_vol, w_breadth, w_pattern = 0.25, 0.20, 0.20, 0.15, 0.10, 0.10
    if adx > 25:  # Strong trend: boost EMA + momentum
        w_ema, w_pa, w_mom = 0.30, 0.20, 0.25
        w_vol, w_breadth, w_pattern = 0.10, 0.08, 0.07
    elif adx < 15:  # Range: boost breadth + volatility (breakout watch)
        w_ema, w_pa, w_mom = 0.15, 0.20, 0.15
        w_vol, w_breadth, w_pattern = 0.25, 0.15, 0.10
    
    # ===== FINAL SCORE =====
    raw = (ema_score * w_ema + pa_score * w_pa + mom_score * w_mom + 
           vol_score * w_vol + breadth_score * w_breadth + pattern_score * w_pattern)
    final_score = max(min(int(raw * 4), 100), -100)
    
    # Labels
    if final_score >= 60: label = 'STRONG LONG'
    elif final_score >= 25: label = 'LONG'
    elif final_score > -25: label = 'NEUTRAL'
    elif final_score >= -60: label = 'SHORT'
    else: label = 'STRONG SHORT'
    
    # Vietnamese action
    if final_score >= 60: action_vn = 'MỞ VỊ THẾ LONG MẠNH'
    elif final_score >= 25: action_vn = 'MỞ VỊ THẾ LONG'
    elif final_score > -25: action_vn = 'ĐỨNG NGOÀI'
    elif final_score >= -60: action_vn = 'MỞ VỊ THẾ SHORT'
    else: action_vn = 'MỞ VỊ THẾ SHORT MẠNH'
    
    # ===== TARGET / STOP-LOSS (in VN30 points) =====
    atr_points = float(atr_val) if pd.notnull(atr_val) else 10
    
    if final_score >= 0:
        entry = current_price
        target = entry + (atr_points * 1.5)
        stop = entry - (atr_points * 1.0)
    else:
        entry = current_price
        target = entry - (atr_points * 1.5)
        stop = entry + (atr_points * 1.0)
    
    target_points = round(abs(target - entry), 2)
    stop_points = round(abs(stop - entry), 2)
    rr_ratio = round(target_points / stop_points, 2) if stop_points > 0 else 0
    
    # P/L estimate: 1 VN30 point = 100,000 VND per contract
    pnl_target_vnd = int(target_points * 100000)
    pnl_stop_vnd = int(stop_points * 100000)
    
    # Normalize factors for UI
    def normalize(val, max_val):
        if max_val == 0: return 50
        return int(max(0, min(100, (val + max_val) / (2 * max_val) * 100)))
    
    return {
        'vn30_price': round(current_price, 2),
        'vn30_open': round(float(current['open']), 2),
        'vn30_high': round(float(current['high']), 2),
        'vn30_low': round(float(current['low']), 2),
        'vn30_volume': int(current['volume']),
        'prev_close': round(float(prev['close']), 2),
        'pct_change': round(((current_price - prev['close']) / prev['close']) * 100, 2),
        'signal_score': final_score,
        'signal_label': label,
        'action_vn': action_vn,
        'market_regime': 'Trending' if adx > 25 else 'Weak Trend' if adx > 15 else 'Range',
        'adx': round(float(adx), 1) if pd.notnull(adx) else 0,
        'entry': round(entry, 2),
        'target': round(target, 2),
        'stop_loss': round(stop, 2),
        'target_points': target_points,
        'stop_points': stop_points,
        'rr_ratio': rr_ratio,
        'pnl_target_vnd': pnl_target_vnd,
        'pnl_stop_vnd': pnl_stop_vnd,
        'factors': {
            'ema_trend': normalize(ema_score, 25),
            'price_action': normalize(pa_score, 20),
            'momentum': normalize(mom_score, 20),
            'volatility': normalize(vol_score, 15),
            'breadth': normalize(breadth_score, 10),
            'pattern': normalize(pattern_score, 10)
        },
        'indicators': {
            'ema9': round(float(ema_9.iloc[-1]), 2),
            'ema21': round(float(ema_21.iloc[-1]), 2),
            'ema50': round(float(ema_50.iloc[-1]), 2),
            'rsi': round(float(rsi_val), 1),
            'macd': round(float(macd_line.iloc[-1]), 2),
            'macd_signal': round(float(signal_line.iloc[-1]), 2),
            'macd_hist': round(float(macd_hist.iloc[-1]), 2),
            'atr': round(float(atr_val), 2),
            'bb_width': round(float(bb_width), 4)
        },
        'weights': {
            'ema_trend': w_ema,
            'price_action': w_pa,
            'momentum': w_mom,
            'volatility': w_vol,
            'breadth': w_breadth,
            'pattern': w_pattern
        },
        'date': current['time'].strftime('%Y-%m-%d') if hasattr(current['time'], 'strftime') else str(current['time'])[:10],
        'timestamp': datetime.now().isoformat()
    }


def get_signal_history(days=7):
    """Get cached signal history for the last N days."""
    cached, _ = get_market_cache("derivatives_history")
    if cached and isinstance(cached, list):
        return cached[-days:]
    return []
