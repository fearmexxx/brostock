
import pandas as pd
import numpy as np
from vnstock import Quote
from datetime import datetime

def calculate_signal_score(df):
    """
    Calculates institutional-grade signal scores for backtesting using vectorized operations.
    Produces a Conviction Score from -100 to +100.
    """
    df = df.copy()
    
    # Ensure numeric
    cols = ['close', 'volume', 'high', 'low']
    for c in cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors='coerce', downcast='float')
            
    # --- Indicators ---
    df['sma200'] = df['close'].rolling(200).mean()
    df['sma50'] = df['close'].rolling(50).mean()
    df['sma20'] = df['close'].rolling(20).mean()
    
    # Trend Score (30%)
    df['trend_score'] = 0.0
    df.loc[df['sma20'] > df['sma50'], 'trend_score'] += 10
    df.loc[df['sma50'] > df['sma200'], 'trend_score'] += 10
    df.loc[df['close'] > df['sma50'], 'trend_score'] += 5
    df.loc[df['close'] > df['sma200'], 'trend_score'] += 5
    
    df.loc[df['sma20'] < df['sma50'], 'trend_score'] -= 10
    df.loc[df['sma50'] < df['sma200'], 'trend_score'] -= 10
    df.loc[df['close'] < df['sma50'], 'trend_score'] -= 5
    df.loc[df['close'] < df['sma200'], 'trend_score'] -= 5
    
    # Momentum (20%)
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    ema12 = df['close'].ewm(span=12, adjust=False).mean()
    ema26 = df['close'].ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    signal_line = macd_line.ewm(span=9, adjust=False).mean()
    df['macd_hist'] = macd_line - signal_line
    df['roc14'] = df['close'].pct_change(14) * 100
    
    df['mom_score'] = 0.0
    df.loc[(df['rsi'] >= 50) & (df['rsi'] <= 70), 'mom_score'] += 5
    df.loc[df['rsi'] > 70, 'mom_score'] -= 5
    df.loc[df['rsi'] < 30, 'mom_score'] += 8
    df.loc[macd_line > signal_line, 'mom_score'] += 5
    df.loc[df['macd_hist'] > df['macd_hist'].shift(1), 'mom_score'] += 3
    df.loc[df['roc14'] > 5, 'mom_score'] += 4
    df.loc[df['roc14'] < -5, 'mom_score'] -= 4
    
    # Volume Flow (15%)
    df['avg_vol7'] = df['volume'].rolling(7).mean()
    df['vol_surge'] = df['volume'] / df['avg_vol7']
    df['obv'] = (np.sign(df['close'].diff()) * df['volume']).fillna(0).cumsum()
    df['obv_avg10'] = df['obv'].rolling(10).mean()
    df['vwap_proxy'] = (df['close'] * df['volume']).rolling(20).sum() / df['volume'].rolling(20).sum()
    
    df['vol_score'] = 0.0
    df.loc[df['vol_surge'] > 2, 'vol_score'] += 8
    df.loc[(df['vol_surge'] > 1.5) & (df['vol_surge'] <= 2), 'vol_score'] += 6
    df.loc[df['obv'] > df['obv_avg10'], 'vol_score'] += 4
    df.loc[df['obv'] < df['obv_avg10'], 'vol_score'] -= 4
    df.loc[df['close'] > df['vwap_proxy'], 'vol_score'] += 3
    
    # Volatility (15%)
    tr = pd.concat([
        df['high'] - df['low'],
        (df['high'] - df['close'].shift(1)).abs(),
        (df['low'] - df['close'].shift(1)).abs()
    ], axis=1).max(axis=1)
    df['atr'] = tr.rolling(14).mean()
    std20 = df['close'].rolling(20).std()
    df['bb_width'] = (4 * std20) / df['sma20']
    
    df['vlt_score'] = 0.0
    df.loc[(tr > df['atr']) & (df['roc14'].abs() > 2), 'vlt_score'] += 5
    df.loc[df['bb_width'] < (df['close'].rolling(100).std().mean() / df['sma20']), 'vlt_score'] += 4
    df.loc[tr > df['atr'] * 2.5, 'vlt_score'] -= 5
    
    # Mean Reversion (20%)
    df['lower_bb'] = df['sma20'] - (2 * std20)
    df['upper_bb'] = df['sma20'] + (2 * std20)
    df['mr_score'] = 0.0
    df.loc[df['close'] < df['lower_bb'], 'mr_score'] += 10
    df.loc[df['rsi'] < 30, 'mr_score'] += 6
    df.loc[df['close'] > df['upper_bb'], 'mr_score'] -= 10
    df.loc[df['rsi'] > 75, 'mr_score'] -= 6
    
    # ADX (Regime Detection)
    plus_dm = df['high'].diff().clip(lower=0)
    minus_dm = (-df['low'].diff()).clip(lower=0)
    tr_smooth = tr.rolling(14).mean()
    plus_di = 100 * (plus_dm.rolling(14).mean() / tr_smooth)
    minus_di = 100 * (minus_dm.rolling(14).mean() / tr_smooth)
    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di)
    df['adx'] = dx.rolling(14).mean()
    
    # Weights and Final Score (Vectorized)
    df['w_trend'] = 0.30
    df['w_mr'] = 0.20
    df.loc[df['adx'] > 25, 'w_trend'] = 0.40
    df.loc[df['adx'] > 25, 'w_mr'] = 0.10
    df.loc[df['adx'] < 15, 'w_trend'] = 0.15
    df.loc[df['adx'] < 15, 'w_mr'] = 0.35
    
    df['score'] = (df['trend_score'] * df['w_trend'] + 
                   df['mom_score'] * 0.20 + 
                   df['vol_score'] * 0.15 + 
                   df['vlt_score'] * 0.15 + 
                   df['mr_score'] * df['w_mr']) * 4
                   
    df['score'] = np.clip(df['score'], -100, 100)
    return df

def run_backtest(symbol, start_date, end_date, initial_capital=100_000_000):
    try:
        # Fetch Data
        quote = Quote(symbol=symbol.upper(), source='vci')
        df = quote.history(start=start_date, end=end_date)
        
        if df is None or df.empty:
            return {"error": "No data found for this symbol/period."}
            
        # Standardize columns
        if 'time' in df.columns:
            df['time'] = pd.to_datetime(df['time'])
            df.set_index('time', inplace=True)
            
        # Convert prices to VND (source 'vci' returns in 1,000s)
        for col in ['open', 'high', 'low', 'close']:
            if col in df.columns:
                df[col] = df[col] * 1000
                
        # Calc Scores
        df = calculate_signal_score(df)
        df = df.dropna(subset=['score'])
        
        if df.empty:
            return {"error": "Not enough data to calculate indicators (need > 50 days)."}

        # Backtest Loop
        cash = initial_capital
        shares = 0
        position = 0 # 0: Cash, 1: Long
        
        # Logs
        equity_curve = []
        trades = []
        
        buy_threshold = 40
        sell_threshold = -40
        
        last_buy_price = 0
        last_buy_date = None
        
        score_idx = df.columns.get_loc('score')
        close_idx = df.columns.get_loc('close')
        
        for i in range(len(df)):
            date = df.index[i]
            price = df.iloc[i, close_idx]
            score = df.iloc[i, score_idx]
            
            # Logic
            if position == 0:
                if score >= buy_threshold:
                    shares = cash // price
                    if shares > 0:
                        cash -= shares * price
                        position = 1
                        last_buy_price = price
                        last_buy_date = date
                        trades.append({
                            "type": "BUY",
                            "date": date.strftime('%Y-%m-%d'),
                            "price": float(price),
                            "shares": int(shares),
                            "value": float(shares * price)
                        })
            
            elif position == 1:
                if score <= sell_threshold:
                    proceeds = shares * price
                    pl = proceeds - (shares * last_buy_price)
                    pl_pct = (pl / (shares * last_buy_price)) * 100
                    
                    cash += proceeds
                    shares = 0
                    position = 0
                    trades.append({
                        "type": "SELL",
                        "date": date.strftime('%Y-%m-%d'),
                        "price": float(price),
                        "shares": 0,
                        "value": float(proceeds),
                        "p_l": float(pl),
                        "p_l_pct": float(pl_pct)
                    })
            
            # Record Equity
            total_val = cash + (shares * price)
            equity_curve.append({
                "date": date.strftime('%Y-%m-%d'),
                "value": float(total_val),
                "price": float(price),
                "score": float(score)
            })
            
        # Final Stats
        final_equity = equity_curve[-1]['value']
        total_return = ((final_equity - initial_capital) / initial_capital) * 100
        
        # Win Rate
        winning_trades = len([t for t in trades if t['type'] == 'SELL' and t['p_l'] > 0])
        total_sell_trades = len([t for t in trades if t['type'] == 'SELL'])
        win_rate = (winning_trades / total_sell_trades * 100) if total_sell_trades > 0 else 0
        
        # Max Drawdown
        vals = [e['value'] for e in equity_curve]
        rolling_max = np.maximum.accumulate(vals)
        drawdowns = (vals - rolling_max) / rolling_max
        max_drawdown = drawdowns.min() * 100
        
        return {
            "symbol": symbol,
            "period": f"{start_date} to {end_date}",
            "initial_capital": initial_capital,
            "final_equity": float(final_equity),
            "total_return_pct": float(total_return),
            "max_drawdown_pct": float(max_drawdown),
            "win_rate": float(win_rate),
            "total_trades": total_sell_trades,
            "equity_curve": equity_curve, # For Charting
            "trades": trades # For Table
        }
        
    except Exception as e:
        return {"error": str(e)}
