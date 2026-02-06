

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
    Calculates trend metrics from historical data (Daily).
    Includes a signal_score from -10 (Strong Bearish) to +10 (Strong Bullish).
    """
    if df.empty or len(df) < 50:
        return {}
        
    # Ensure numeric types
    for col in ['close', 'volume', 'high', 'low']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    current_price = df['close'].iloc[-1]
    
    # 52-week High/Low (approx 252 trading days)
    lookback = min(len(df), 252)
    fifty_two_week_high = df['high'].tail(lookback).max()
    fifty_two_week_low = df['low'].tail(lookback).min()
    
    # MAs
    sma_50 = df['close'].tail(50).mean()
    sma_20 = df['close'].tail(20).mean()
    ema_5 = df['close'].ewm(span=5, adjust=False).mean().iloc[-1]
    
    # RSI (14 days)
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs)).iloc[-1]

    # Crossovers
    prev_ema5 = df['close'].ewm(span=5, adjust=False).mean().iloc[-2]
    prev_sma20 = df['close'].tail(21).head(20).mean()
    golden_cross = (prev_ema5 <= prev_sma20) and (ema_5 > sma_20)
    death_cross = (prev_ema5 >= prev_sma20) and (ema_5 < sma_20)

    # Trend Strength
    trend_strength = ((current_price - sma_50) / sma_50) * 100
    
    # Volatility
    daily_returns = df['close'].pct_change()
    volatility = daily_returns.std() * np.sqrt(252) * 100
    
    # Volume Analysis
    avg_volume_20 = df['volume'].tail(20).mean()
    avg_volume_7 = df['volume'].tail(7).mean()
    current_volume = df['volume'].iloc[-1]
    volume_surge = (current_volume / avg_volume_7) if avg_volume_7 > 0 else 1
    
    # Momentum
    ret_7d = (current_price / df['close'].iloc[-7] - 1) * 100 if len(df) >= 7 else 0

    # --- Prediction (5-7 days) ---
    # Simple linear regression on last 14 days + RSI context
    y = df['close'].tail(14).values
    x = np.arange(len(y))
    slope, intercept = np.polyfit(x, y, 1)
    pred_price = slope * (len(y) + 5) + intercept
    
    # Adjust prediction based on RSI
    if rsi > 70: pred_price *= 0.98 # Overbought correction
    elif rsi < 30: pred_price *= 1.02 # Oversold bounce
    
    prediction_pct = (pred_price / current_price - 1) * 100

    # --- Signal Score Calculation (-10 to +10) ---
    score = 0
    
    # 1. Trend (Max 4 pts)
    if current_price > sma_50: score += 2
    if trend_strength > 5: score += 2
    if current_price < sma_50: score -= 2
    if trend_strength < -5: score -= 2
    
    # 2. Momentum (Max 3 pts)
    if current_price > sma_20: score += 2
    else: score -= 2
    
    if ret_7d > 2: score += 1
    if ret_7d < -2: score -= 1
    
    # 3. Volume Flow (Max 3 pts)
    if volume_surge > 1.2: score += 2
    if volume_surge < 0.8: score -= 1
    if current_volume > avg_volume_20: score += 1
    
    # Bonus for Crossovers
    if golden_cross: score += 2
    if death_cross: score -= 2

    score = max(min(score, 10), -10) # Clamp
    
    return {
        'current_price_daily': current_price,
        'price_to_52w_high': (current_price / fifty_two_week_high - 1) * 100,
        'price_to_52w_low': (current_price / fifty_two_week_low - 1) * 100,
        'annual_volatility': volatility,
        'trend_strength': trend_strength,
        'avg_volume_daily': avg_volume_20,
        'avg_volume_7d': avg_volume_7,
        'volume_surge': volume_surge,
        'is_uptrend': current_price > sma_50,
        'signal_score': score,
        'signal_label': 'Strong Bullish' if score >= 7 else 'Bullish' if score >= 3 else 'Neutral' if score > -3 else 'Bearish' if score >= -7 else 'Strong Bearish',
        'ema_5': ema_5,
        'sma_20': sma_20,
        'sma_50': sma_50,
        'rsi': rsi,
        'golden_cross': golden_cross,
        'death_cross': death_cross,
        'prediction_5d_pct': prediction_pct,
        'prediction_label': 'UPWARD' if prediction_pct > 2 else 'DOWNWARD' if prediction_pct < -2 else 'SIDEWAYS'
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



