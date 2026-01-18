from vnstock import Listing, Quote
import pandas as pd
import numpy as np

# Lấy danh sách tất cả các mã niêm yết trên cả 3 sàn
symbol_df = Listing().all_symbols()
all_symbols = symbol_df['symbol']

# Lấy một danh sách nhỏ để làm ví dụ
all_data = []
analysis_results = []
start_date = '2024-01-02'
end_date = '2025-10-25'

for symbol in all_symbols[:5]: # Minh hoạ với 5 mã đầu tiên
    try:
        # Lấy dữ liệu OHLCV
        quote = Quote(symbol=symbol, source='vci')
        df = quote.history(start=start_date, end=end_date, interval='1D')
        df['symbol'] = symbol
        
        all_data.append(df)
        
        # Bước 3.5: Tính toán các chỉ số phân tích ngay khi lấy dữ liệu
        # Để tạo ra insight có ý nghĩa cho giao dịch
        current_price = df['close'].iloc[-1]
        fifty_two_week_high = df['high'].tail(252).max()  # 252 phiên giao dịch ≈ 1 năm
        fifty_two_week_low = df['low'].tail(252).min()
        avg_volume = df['volume'].tail(20).mean()  # Trung bình khối lượng 20 phiên gần nhất
        
        # Volatility (độ biến động): độ lệch chuẩn của return hàng ngày
        daily_returns = df['close'].pct_change()
        volatility = daily_returns.std() * np.sqrt(252) * 100  # Annualized volatility in %
        
        # Trend strength: so sánh giá hiện tại với đường trung bình động 50 ngày
        sma_50 = df['close'].tail(50).mean()
        trend_strength = ((current_price - sma_50) / sma_50) * 100
        
        analysis_results.append({
            'symbol': symbol,
            'current_price': current_price,
            'price_to_52w_high': (current_price / fifty_two_week_high - 1) * 100,  # % từ high
            'price_to_52w_low': (current_price / fifty_two_week_low - 1) * 100,    # % từ low
            'annual_volatility': volatility,
            'trend_strength': trend_strength,  # + là uptrend, - là downtrend
            'avg_volume': avg_volume
        })
        
        print(f"✓ Tải và phân tích thành công dữ liệu cho {symbol}")
    except Exception as e:
        print(f"✗ Lỗi khi xử lý {symbol}: {e}")

# Bước 4: Lắp Ráp Bức Tranh
all_data_df = pd.concat(all_data)
analysis_df = pd.DataFrame(analysis_results)

print("\n--- INSIGHT PHÂN TÍCH CHỨNG KHOÁN ---")
print(analysis_df.to_string())
print("\n--- DIỄN GIẢI INSIGHT ---")
for idx, row in analysis_df.iterrows():
    print(f"\n{row['symbol']}:")
    print(f"  Giá hiện tại: {row['current_price']:,.2f}")
    print(f"  Vị trí so với 52W: {row['price_to_52w_high']:.1f}% so với high, {row['price_to_52w_low']:.1f}% so với low")
    print(f"  Độ biến động (Annualized): {row['annual_volatility']:.1f}%")
    
    # Insight cho nhà đầu tư
    if row['price_to_52w_high'] < -20:
        print(f"  💡 Insight: Giá thấp hơn 20% so với đỉnh 52 tuần - có thể là cơ hội tích luỹ")
    elif row['price_to_52w_high'] > 0:
        print(f"  💡 Insight: Giá ở mức cao, cần cẩn thận với rủi ro profit-taking")
    
    if row['annual_volatility'] > 40:
        print(f"  ⚠️  Độ biến động cao - thích hợp cho trader nhưng rủi ro cao")
    else:
        print(f"  ✓ Độ biến động hợp lý - phù hợp cho cả long-term investor")
    
    if row['trend_strength'] > 5:
        print(f"  📈 Xu hướng tăng mạnh: {row['trend_strength']:.1f}% trên MA50")
    elif row['trend_strength'] < -5:
        print(f"  📉 Xu hướng giảm: {row['trend_strength']:.1f}% dưới MA50")