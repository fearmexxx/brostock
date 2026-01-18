

import streamlit as st
import pandas as pd
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
from auth import login, logout

# Import application logic
from stock_analyzer import (
    get_intraday_data, preprocess_data, aggregate_data, calculate_summary,
    get_stock_history_data, calculate_trend_metrics,
    create_main_chart, create_intraday_heatmap, create_order_distribution,
    create_historical_chart
)
from database import place_trade, get_portfolio

# ===== CONFIGURATION =====
st.set_page_config(page_title="Phân Tích Cổ Phiếu Chuyên Sâu", layout="wide", page_icon="📈")

# ===== CSS STYLING =====
st.markdown("""
    <style>
        .metric-card {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            border-left: 5px solid #1A237E;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .big-font { font-size: 18px !important; }
        div.stButton > button {
            width: 100%;
            background-color: #0D47A1; 
            color: white;
            font-weight: bold;
        }
        /* Tab styling */
        .stTabs [data-baseweb="tab-list"] {
            gap: 10px;
        }
        .stTabs [data-baseweb="tab"] {
            height: 50px;
            white-space: pre-wrap;
            border-radius: 4px 4px 0 0;
            gap: 1px;
            padding-top: 10px;
            padding-bottom: 10px;
        }
    </style>
""", unsafe_allow_html=True)

# 1. Authentication Gate
user = login()
if not user:
    st.stop()

# Wrapper to load data
@st.cache_data(ttl=60) 
def load_data(symbol):
    intraday_df = get_intraday_data(symbol)
    history_df = get_stock_history_data(symbol)
    return intraday_df, history_df

# ===== SIDEBAR =====
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/8950/8950837.png", width=80)
    st.title("Pro Analyst VN")
    
    # Navigation
    app_mode = st.radio("Chế Độ:", ["📈 Phân Tích", "💼 Danh Mục (Simulate)"])
    st.markdown("---")
    
    if app_mode == "📈 Phân Tích":
        symbol_input = st.text_input("Mã Cổ Phiếu:", value="TCB").strip().upper()
        timeframe = st.radio("Khung Thời Gian:", ["Trong ngày", "7 Ngày", "30 Ngày"])
        refresh = st.button("🔄 Cập nhật dữ liệu")
        
        st.markdown("---")
        st.info("💡 **Gợi ý:** Chọn 'Trong ngày' để xem chi tiết dòng tiền từng phút.")
    
    if st.button("🚪 Đăng xuất"):
        logout()
    
    st.caption("v2.2 | Powered by VnStock & Brother")

# ===== MAIN APP =====

# Date/Time Header
st.markdown(f"#### 🕒 {datetime.now().strftime('%A, %d/%m/%Y %H:%M:%S')}")

if app_mode == "💼 Danh Mục (Simulate)":
    st.title("💼 Danh Mục Đầu Tư (Giả Lập)")
    
    # --- Place Trade Section ---
    with st.expander("➕ Đặt Lệnh Mới (Giả Lập)", expanded=True):
        t_col1, t_col2, t_col3, t_col4 = st.columns(4)
        with t_col1:
            trade_symbol = st.text_input("Mã CP", value="TCB").upper()
        with t_col2:
            trade_qty = st.number_input("Khối Lượng", min_value=100, step=100, value=100)
        with t_col3:
            # Fetch current price for convenience
            current_p = 0
            if trade_symbol:
                try:
                    df_quote, _ = load_data(trade_symbol)
                    if not df_quote.empty:
                        current_p = df_quote['price'].iloc[-1]
                except:
                    pass
            # Input is in 'units' (e.g. 20.55), step 0.1 = 100 VND
            trade_price = st.number_input("Giá Đặt (x1000 VND)", value=float(current_p)/1000.0, step=0.1)
        with t_col4:
            trade_action = st.selectbox("Lệnh", ["BUY", "SELL"])
        
        if st.button("🚀 Gửi Lệnh"):
            if trade_price <= 0:
                st.error("Giá phải lớn hơn 0")
            else:
                user_id = user.get('id') or user.get('email')
                # Multiply by 1000 to store actual VND in database
                success, msg = place_trade(user_id, trade_symbol, trade_qty, trade_price * 1000, trade_action)
                if success:
                    st.success(f"✅ Đã đặt lệnh {trade_action} {trade_qty} {trade_symbol} giá {trade_price:,.0f}")
                    # Clear cache to refresh portfolio if we implemented caching there
                    st.rerun()
                else:
                    st.error(f"❌ Lỗi: {msg}")

    # --- Portfolio Section ---
    st.markdown("---")
    st.subheader("📊 Danh Mục Hiện Tại")
    
    user_id = user.get('id') or user.get('email')
    portfolio_df = get_portfolio(user_id)
    
    if not portfolio_df.empty:
        # Calculate Market Value & P/L
        # We need current prices for all symbols in portfolio
        # For prototype, we fetch one by one (Warning: slow if many symbols)
        
        market_values = []
        pls = []
        current_prices = []
        
        progress_bar = st.progress(0)
        total_syms = len(portfolio_df)
        
        for idx, row in portfolio_df.iterrows():
            sym = row['Symbol']
            qty = row['Quantity']
            avg_cost = row['Avg Price']
            
            try:
                # Use load_data but might need to bypass cache to get real real-time? 
                # For now use cached is fine for demo
                df_q, _ = load_data(sym)
                if not df_q.empty:
                    curr_p = df_q['price'].iloc[-1]
                else:
                    curr_p = avg_cost # Fallback
            except:
                curr_p = avg_cost
            
            mkt_val = qty * curr_p
            pl = mkt_val - (qty * avg_cost)
            
            current_prices.append(curr_p)
            market_values.append(mkt_val)
            pls.append(pl)
            progress_bar.progress((idx + 1) / total_syms)
            
        progress_bar.empty()
        
        portfolio_df['Current Price'] = current_prices
        portfolio_df['Market Value'] = market_values
        portfolio_df['P/L (VND)'] = pls
        portfolio_df['P/L (%)'] = (portfolio_df['P/L (VND)'] / portfolio_df['Total Cost']) * 100
        
        # Display Summary Metrics
        total_nav = portfolio_df['Market Value'].sum()
        total_cost = portfolio_df['Total Cost'].sum()
        total_pl = total_nav - total_cost
        total_pl_pct = (total_pl / total_cost * 100) if total_cost != 0 else 0
        
        m1, m2, m3 = st.columns(3)
        with m1:
            st.metric("Tổng Tài Sản (NAV)", f"{total_nav:,.0f} ₫")
        with m2:
            st.metric("Tổng Vốn Đầu Tư", f"{total_cost:,.0f} ₫")
        with m3:
            st.metric("Tổng Lợi Nhuận (P/L)", f"{total_pl:,.0f} ₫", f"{total_pl_pct:.2f}%")
            
        # Stylize DataFrame
        st.dataframe(
            portfolio_df.style.format({
                "Quantity": "{:,.0f}",
                "Avg Price": "{:,.0f}",
                "Total Cost": "{:,.0f}",
                "Current Price": "{:,.0f}",
                "Market Value": "{:,.0f}",
                "P/L (VND)": "{:,.0f}",
                "P/L (%)": "{:.2f}%"
            }).background_gradient(subset=['P/L (%)'], cmap='RdYlGn', vmin=-10, vmax=10),
            use_container_width=True,
            hide_index=True
        )
    else:
        st.info("📭 Danh mục trống. Hãy đặt lệnh mua đầu tiên!")

elif app_mode == "📈 Phân Tích":
    # 2. Main Application Content
    if not symbol_input:
        st.info("👈 Vui lòng nhập mã cổ phiếu ở thanh bên trái.")
        st.stop()

    try:
        with st.spinner(f"Đang tải dữ liệu cho {symbol_input}..."):
            # Load Data
            raw_intraday, history_df = load_data(symbol_input)
            
            if raw_intraday is None or raw_intraday.empty:
                st.error(f"⚠️ Không tìm thấy dữ liệu trong ngày cho {symbol_input}. Có thể chưa vào phiên hoặc mã sai.")
                st.stop()

            # Process Intraday
            df = preprocess_data(raw_intraday)
            resampled = aggregate_data(df)
            summary = calculate_summary(df, resampled)
            
            # Process History (Context)
            trend_metrics = calculate_trend_metrics(history_df)

        # === TOP BAR: TICKER INFO ===
        
        current_price = df['price'].iloc[-1]
        
        # Calculate Reference Price
        # history_df comes from get_stock_history_data which might include today
        if not history_df.empty:
            last_hist_date = history_df.index[-1].date()
            current_date = datetime.now().date()
            
            # If history includes today, take previous day as reference
            if last_hist_date >= current_date and len(history_df) > 1:
                ref_price = history_df['close'].iloc[-2]
            else:
                ref_price = history_df['close'].iloc[-1]
        else:
            ref_price = df['open'].iloc[0]

        # Auto-fix magnitude
        if ref_price < 500 and current_price > 500:
            ref_price *= 1000
            
        change = current_price - ref_price
        pct_change = (change / ref_price) * 100 if ref_price != 0 else 0
        
        # Total Volume (Shares) vs Total Orders (Matches)
        total_vol = resampled['volume'].sum()
        total_orders = summary['Tổng số lệnh mua'] + summary['Tổng số lệnh bán']

        # KPI ROW
        kpi1, kpi2, kpi3, kpi4 = st.columns(4)
        
        with kpi1:
            st.metric("💰 Giá Hiện Tại", f"{current_price:,.0f} ₫", f"{change:,.0f} ({pct_change:.2f}%)")
        with kpi2:
            st.metric("📊 Tổng Khối Lượng", f"{total_vol:,.0f}", help="Tổng số cổ phiếu khớp lệnh")
        with kpi3:
            st.metric("📝 Tổng Số Lệnh", f"{total_orders:,.0f}", help="Tổng số lệnh mua + bán khớp (Matches)")
        with kpi4:
            st.metric("💸 Dòng Tiền Ròng", summary['Dòng tiền ròng (VND)'])

        # === MAIN CHART AREA ===
        st.markdown("---")
        col_main, col_side = st.columns([0.75, 0.25])
        
        with col_main:
            if timeframe == "Trong ngày":
                st.subheader(f"Diễn biến trong ngày - {symbol_input} (GMT+7)")
                fig_main = create_main_chart(resampled, symbol_input)
                st.plotly_chart(fig_main, width='stretch')
            elif timeframe == "7 Ngày":
                st.subheader(f"Biểu đồ 7 Ngày - {symbol_input}")
                fig_hist = create_historical_chart(history_df, symbol_input, days=7)
                st.plotly_chart(fig_hist, width='stretch')
            else:
                st.subheader(f"Biểu đồ 30 Ngày - {symbol_input}")
                fig_hist = create_historical_chart(history_df, symbol_input, days=30)
                st.plotly_chart(fig_hist, width='stretch')

        with col_side:
            st.subheader("⚡ Tín Hiệu")
            
            # Trend Card
            if trend_metrics:
                is_uptrend = trend_metrics['is_uptrend']
                color = "#4CAF50" if is_uptrend else "#F44336"
                trend_icon = "🐂 TĂNG" if is_uptrend else "🐻 GIẢM"
                
                st.markdown(f"""
                <div style="background-color: {color}; color: white; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 10px;">
                    <h3 style="margin:0; color: white;">{trend_icon}</h3>
                    <p style="margin:0;">Xu hướng D1 (vs MA50)</p>
                </div>
                """, unsafe_allow_html=True)
                
                st.markdown(f"**Sức mạnh:** {trend_metrics['trend_strength']:.1f}%")
                st.progress(max(0, min(100, int(trend_metrics['trend_strength'] + 50))))
                
                st.markdown("---")
                st.markdown("**Biến động (Volatility):**")
                st.metric(label="", value=f"{trend_metrics['annual_volatility']:.1f}%")
            
            st.markdown("---")
            # Pie chart for Buy vs Sell Orders
            fig_pie = create_order_distribution(resampled, symbol_input)
            fig_pie.update_layout(title="Tỷ lệ Lệnh Mua / Bán", height=250, margin=dict(t=30, b=0, l=0, r=0))
            st.plotly_chart(fig_pie, width='stretch')

        # === DETAILED STATS (THE OG STATS RESTORED & VISUALIZED) ===
        st.markdown("---")
        st.subheader("📋 Thống Kê Chi Tiết & Dòng Tiền")
        
        tab_stats, tab_heatmap = st.tabs(["📊 Số Liệu Chi Tiết", "🔥 Bản Đồ Nhiệt (Heatmap)"])
        
        with tab_stats:
            # ROW 1: MONEY FLOW VISUALIZATION
            st.markdown("#### 1. Phân Tích Dòng Tiền (Money Flow)")
            mf_col1, mf_col2 = st.columns([0.6, 0.4])
            
            with mf_col1:
                # Create a horizontal bar chart for In/Out flow
                in_val = float(summary['Tổng dòng tiền vào (VND)'].replace('.','').replace(',',''))
                out_val = float(summary['Tổng dòng tiền ra (VND)'].replace('.','').replace(',',''))
                
                mf_df = pd.DataFrame({
                    'Loại': ['Tiền Vào (Mua chủ động)', 'Tiền Ra (Bán chủ động)'],
                    'Giá Trị': [in_val, out_val],
                    'Color': ['#4CAF50', '#F44336'] # Green, Red
                })
                
                fig_mf = px.bar(mf_df, x='Giá Trị', y='Loại', orientation='h', text_auto='.2s', 
                                color='Loại', color_discrete_map={'Tiền Vào (Mua chủ động)': '#4CAF50', 'Tiền Ra (Bán chủ động)': '#F44336'})
                fig_mf.update_layout(showlegend=False, height=200, margin=dict(l=0, r=0, t=0, b=0))
                st.plotly_chart(fig_mf, width='stretch')
                
            with mf_col2:
                st.metric("Dòng Tiền Vào", summary['Tổng dòng tiền vào (VND)'])
                st.metric("Dòng Tiền Ra", summary['Tổng dòng tiền ra (VND)'])
                
                # Colorize Net Flow
                net_val_str = summary['Dòng tiền ròng (VND)']
                net_val = float(net_val_str.replace('.','').replace(',',''))
                net_color = "normal" if net_val >= 0 else "inverse"
                st.metric("Ròng (Net)", net_val_str, delta=net_val, delta_color=net_color)

            st.markdown("---")
            
            # ROW 2: ORDER STATISTICS (Visualized)
            st.markdown("#### 2. Thống Kê Lệnh (Orders Analysis)")
            
            buy_orders = int(summary['Tổng số lệnh mua'])
            sell_orders = int(summary['Tổng số lệnh bán'])
            total_orders_count = buy_orders + sell_orders
            
            if total_orders_count > 0:
                buy_pct = (buy_orders / total_orders_count) * 100
                sell_pct = (sell_orders / total_orders_count) * 100
                
                # Create a horizontal stacked bar for Orders
                fig_orders = go.Figure()
                
                # Buy Trace
                fig_orders.add_trace(go.Bar(
                    y=['Orders'], x=[buy_orders], orientation='h', name='Mua',
                    marker_color='#4CAF50', text=f"Mua: {buy_orders:,} ({buy_pct:.1f}%)", textposition='auto'
                ))
                
                # Sell Trace
                fig_orders.add_trace(go.Bar(
                    y=['Orders'], x=[sell_orders], orientation='h', name='Bán',
                    marker_color='#F44336', text=f"Bán: {sell_orders:,} ({sell_pct:.1f}%)", textposition='auto'
                ))
                
                fig_orders.update_layout(barmode='stack', height=100, margin=dict(l=0, r=0, t=0, b=0), 
                                         xaxis_visible=False, yaxis_visible=False, showlegend=False)
                
                st.plotly_chart(fig_orders, width='stretch')
            else:
                st.info("Chưa có dữ liệu lệnh.")

            # Avg Volume per Order Stats below the chart
            oc1, oc2 = st.columns(2)
            with oc1:
                 st.metric("KLTB / Lệnh Mua", f"{summary['Khối lượng trung bình lệnh mua']:,.0f}")
            with oc2:
                 st.metric("KLTB / Lệnh Bán", f"{summary['Khối lượng trung bình lệnh bán']:,.0f}")
                
            st.caption(f"ℹ️ Tỷ lệ KLTB Mua/Bán: **{summary['Tỷ lệ khối lượng trung bình mua/bán']:.2f}** ( > 1 là Tốt: Lệnh mua lớn hơn lệnh bán)")

            st.markdown("---")
            
            # ROW 3: PRICE & ADVANCED STATS
            st.markdown("#### 3. Chỉ Số Giá & Kỹ Thuật")
            p_c1, p_c2, p_c3, p_c4 = st.columns(4)
            
            high_price = float(summary['Giá cao nhất'])
            low_price = float(summary['Giá thấp nhất'])
            avg_price = float(summary['Giá trung bình'])
            
            with p_c1:
                h_color = "normal" if high_price >= ref_price else "inverse"
                st.metric("Giá Cao Nhất", f"{high_price:,.0f} ₫", delta=high_price - ref_price, delta_color=h_color)
            with p_c2:
                l_color = "normal" if low_price >= ref_price else "inverse"
                st.metric("Giá Thấp Nhất", f"{low_price:,.0f} ₫", delta=low_price - ref_price, delta_color=l_color)
            with p_c3:
                st.metric("Giá Trung Bình", f"{avg_price:,.0f} ₫")
            with p_c4:
                st.metric("Order/Vol Ratio", f"{summary['Order-to-Volume Ratio (Trung bình)']:.4f}")

        with tab_heatmap:
            st.subheader("Bản Đồ Dòng Tiền Theo Phút")
            st.plotly_chart(create_intraday_heatmap(df, symbol_input), width='stretch')

    except Exception as e:
        st.error(f"Đã xảy ra lỗi: {e}")
        # st.exception(e)
