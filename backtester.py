
import pandas as pd
import numpy as np
from vnstock import Quote
from datetime import datetime

def calculate_signal_score(df):
    """
    Calculates signal scores for backtesting. 
    (Same logic as stock_analyzer.py but streamlined for DataFrame operations)
    """
    df = df.copy()
    
    # Ensure numeric
    cols = ['close', 'volume', 'high', 'low']
    for c in cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors='coerce')
            
    # Indicators
    df['SMA_50'] = df['close'].rolling(window=50).mean()
    df['SMA_20'] = df['close'].rolling(window=20).mean()
    df['trend_strength'] = ((df['close'] - df['SMA_50']) / df['SMA_50']) * 100
    
    df['avg_volume_7'] = df['volume'].rolling(window=7).mean()
    df['volume_surge'] = df['volume'] / df['avg_volume_7']
    df['avg_volume_20'] = df['volume'].rolling(window=20).mean()
    
    df['ret_7d'] = df['close'].pct_change(periods=7) * 100
    
    df['score'] = 0.0
    
    # 1. Trend
    df.loc[df['close'] > df['SMA_50'], 'score'] += 2
    df.loc[df['trend_strength'] > 5, 'score'] += 2
    df.loc[df['close'] < df['SMA_50'], 'score'] -= 2
    df.loc[df['trend_strength'] < -5, 'score'] -= 2
    
    # 2. Momentum
    df.loc[df['close'] > df['SMA_20'], 'score'] += 2
    df.loc[df['close'] < df['SMA_20'], 'score'] -= 2
    df.loc[df['ret_7d'] > 2, 'score'] += 1
    df.loc[df['ret_7d'] < -2, 'score'] -= 1
    
    # 3. Volume
    df.loc[df['volume_surge'] > 1.2, 'score'] += 2
    df.loc[df['volume_surge'] < 0.8, 'score'] -= 1
    df.loc[df['volume'] > df['avg_volume_20'], 'score'] += 1
    
    df['score'] = np.clip(df['score'], -10, 10)
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
            
        # Calc Scores
        df = calculate_signal_score(df)
        df = df.dropna()
        
        if df.empty:
            return {"error": "Not enough data to calculate indicators (need > 50 days)."}

        # Backtest Loop
        cash = initial_capital
        shares = 0
        position = 0 # 0: Cash, 1: Long
        
        # Logs
        equity_curve = []
        trades = []
        
        buy_threshold = 5
        sell_threshold = -2
        
        last_buy_price = 0
        last_buy_date = None
        
        score_idx = df.columns.get_loc('score')
        close_idx = df.columns.get_loc('close')
        
        for i in range(len(df)):
            date = df.index[i]
            price = df.iloc[i, close_idx]
            score = df.iloc[i, score_idx]
            
            action = None
            
            # Logic
            if position == 0:
                if score >= buy_threshold:
                    shares = cash // price
                    cash -= shares * price
                    position = 1
                    last_buy_price = price
                    last_buy_date = date
                    action = "BUY"
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
                    # P/L
                    pl = proceeds - (shares * last_buy_price)
                    pl_pct = (pl / (shares * last_buy_price)) * 100
                    
                    cash += proceeds
                    shares = 0
                    position = 0
                    action = "SELL"
                    trades.append({
                        "type": "SELL",
                        "date": date.strftime('%Y-%m-%d'),
                        "price": float(price),
                        "shares": 0, # Sold all
                        "value": float(proceeds),
                        "p_l": float(pl),
                        "p_l_pct": float(pl_pct)
                    })
            
            # Record Equity
            total_val = cash + (shares * price)
            equity_curve.append({
                "date": date.strftime('%Y-%m-%d'),
                "value": float(total_val),
                "price": float(price), # Store asset price for comparison
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
