import React from "react";
import { 
  BookOpen, 
  Cpu, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  LineChart, 
  DollarSign, 
  PieChart, 
  CheckCircle2, 
  Zap, 
  BarChart3, 
  Layers,
  Award
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DocPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 rounded-xl shadow-lg border border-blue-800">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-cyan-400" size={32} />
            <h1 className="text-3xl font-black tracking-wider">BROSTOCK PRO ALGORITHMIC DOCUMENTATION</h1>
          </div>
          <p className="text-blue-200 text-sm md:text-base max-w-4xl leading-relaxed">
            Tài liệu kĩ thuật chi tiết giải thích toàn bộ phương pháp luận, công thức toán học, trọng số đa nhân tố, cơ chế quản trị rủi ro và mô hình kiểm thử thực chiến (Real-Money Empirical Backtest Engine) trên nền tảng BroStock Pro.
          </p>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="#conviction-engine" className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Cpu size={18} className="text-blue-600" />
              1. Multi-Factor Conviction v2.6
            </div>
            <p className="text-xs text-gray-500 mt-1">Trọng số 5 nhóm chỉ báo (-100 đến +100) & Chế độ ADX</p>
          </a>
          <a href="#alpha-screener" className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Award size={18} className="text-amber-500" />
              2. BroStock Alpha v2.5
            </div>
            <p className="text-xs text-gray-500 mt-1">Xếp hạng Swing Trading T+15 & Tích luỹ dài hạn 3-6M</p>
          </a>
          <a href="#real-money-backtest" className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <LineChart size={18} className="text-emerald-600" />
              3. Real-Money Backtest Engine
            </div>
            <p className="text-xs text-gray-500 mt-1">Kiểm thử lịch sử 250 phiên & Điểm tin cậy đầu tư thực tế</p>
          </a>
          <a href="#vn30f-derivatives" className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
              <Zap size={18} className="text-purple-600" />
              4. VN30F Phái sinh Bias
            </div>
            <p className="text-xs text-gray-500 mt-1">Mô hình định hướng Hợp đồng tương lai & ATR Scalping</p>
          </a>
        </div>

        {/* Section 1: Multi-Factor Conviction Engine v2.6 */}
        <Card id="conviction-engine" className="bg-white border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-blue-900 text-white py-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Cpu size={20} className="text-cyan-400" />
              1. BROSTOCK INSTITUTIONAL MULTI-FACTOR CONVICTION ENGINE v2.6
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-sm text-gray-800 leading-relaxed">
            <p>
              Thuật toán định lượng điểm tự tin (Conviction Score) nằm ở trái tim của hệ thống BroStock Pro, chấm điểm mọi cổ phiếu trên thang từ <strong>-100 (Strong Bearish / Rủi ro xả mạnh)</strong> đến <strong>+100 (Strong Bullish / Khả năng bứt phá cao)</strong>. Thuật toán kết hợp 5 nhóm yếu tố định lượng độc lập và thích ứng linh hoạt theo trạng thái thị trường (Regime Detection).
            </p>

            {/* Factor Weights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-200">
                <h4 className="font-extrabold text-blue-900 flex items-center gap-1.5 text-sm mb-2">
                  <TrendingUp size={16} /> 1. Xu hướng (Trend Follow) — Trọng số mặc định: 30%
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li><strong>Vị thế SMA:</strong> So sánh vị thế giá hiện tại so với SMA20, SMA50 và SMA200.</li>
                  <li><strong>Giao cắt vàng / tử thần (Golden/Death Crossover):</strong> SMA20 cắt lên SMA50 (+10 điểm), SMA50 cắt lên SMA200 (+15 điểm).</li>
                  <li><strong>Độ dốc đường xu hướng:</strong> Tính góc dốc của SMA20 trong 5 phiên gần nhất.</li>
                </ul>
              </div>

              <div className="bg-indigo-50/70 p-4 rounded-lg border border-indigo-200">
                <h4 className="font-extrabold text-indigo-900 flex items-center gap-1.5 text-sm mb-2">
                  <Activity size={16} /> 2. Động lượng (Momentum) — Trọng số mặc định: 20%
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li><strong>RSI (14):</strong> Tín hiệu RSI phân vùng (30-50: Tích cực dần, 50-70: Động lượng mạnh, &gt;70: Cảnh báo quá mua).</li>
                  <li><strong>MACD (12, 26, 9):</strong> Cắt lên đường Signal (+8 điểm), Histogram phân kỳ dương liên tiếp (+5 điểm).</li>
                  <li><strong>ROC (Rate of Change 14d):</strong> Tốc độ thay đổi giá so với 14 phiên trước.</li>
                </ul>
              </div>

              <div className="bg-amber-50/70 p-4 rounded-lg border border-amber-200">
                <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5 text-sm mb-2">
                  <BarChart3 size={16} /> 3. Dòng tiền & Khối lượng (Volume Flow) — Trọng số mặc định: 15%
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li><strong>Volume Surge Ratio:</strong> Tỷ lệ Volume 7 ngày so với Volume trung bình 20 ngày (V7d / V20d). Nếu &gt; 1.5x (+10 điểm), nếu &lt; 0.5x (-6 điểm cạn dòng tiền).</li>
                  <li><strong>On-Balance Volume (OBV):</strong> Xu hướng tích luỹ OBV trong 10 phiên gần nhất (+/- 8 điểm).</li>
                  <li><strong>VWAP Positioning:</strong> Giá nằm trên đường VWAP ngày (+3 điểm) hoặc dưới VWAP (-3 điểm).</li>
                  <li><strong>Phân phối giá (Distribution):</strong> Tăng volume nhưng giá giảm mạnh (-8 điểm).</li>
                </ul>
              </div>

              <div className="bg-purple-50/70 p-4 rounded-lg border border-purple-200">
                <h4 className="font-extrabold text-purple-900 flex items-center gap-1.5 text-sm mb-2">
                  <ShieldAlert size={16} /> 4. Chế độ Biến động (Volatility Regime) — Trọng số mặc định: 15%
                </h4>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li><strong>Bollinger Band Width Squeeze:</strong> Độ hẹp dải Bollinger ($BandWidth = (Upper - Lower) / Middle$). Khi $BandWidth &lt; 0.08$ cảnh báo dồn nén bùng nổ giá.</li>
                  <li><strong>ATR Expansion:</strong> Tỷ lệ ATR(14) so với giá. ATR bùng nổ theo chiều tăng xác nhận sóng bứt phá.</li>
                </ul>
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-lg border border-emerald-200">
              <h4 className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-sm mb-2">
                <DollarSign size={16} /> 5. Hồi tụ trung bình (Mean Reversion) — Trọng số mặc định: 20%
              </h4>
              <p className="text-xs text-gray-700">
                Đánh giá mức độ lệch khỏi dải Bollinger Bands (Extreme Band Touches) và quá mua/quá bán cực đại (RSI &lt; 30 / RSI &gt; 70). Khi giá chạm dải dưới BB kết hợp RSI &lt; 30, hệ thống tính toán điểm phản đòn bắt đáy (+15 điểm).
              </p>
            </div>

            {/* Dynamic Weight Adjustment (ADX Regime) */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
              <h4 className="font-black text-gray-900 text-sm mb-2">
                ⚡ CƠ CHẾ THÍCH ỨNG DỰA TRÊN CHỈ SỐ ADX (REGIME WEIGHTING):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-3 rounded border border-gray-200">
                  <span className="font-bold text-green-700 block mb-1">Khi ADX(14) &gt; 25 (Thị trường có xu hướng mạnh):</span>
                  Tăng trọng số <strong>Trend Follow</strong> lên <strong>40%</strong>, giảm trọng số <strong>Mean Reversion</strong> xuống <strong>10%</strong>. Tránh bắt đáy sớm khi thị trường đang rơi mạnh.
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <span className="font-bold text-amber-700 block mb-1">Khi ADX(14) &lt; 15 (Thị trường Đi ngang / Sideway):</span>
                  Giảm trọng số <strong>Trend Follow</strong> xuống <strong>15%</strong>, tăng trọng số <strong>Mean Reversion</strong> lên <strong>35%</strong>. Tối ưu hoá mua hỗ trợ / bán kháng cự.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: BroStock Alpha v2.5 */}
        <Card id="alpha-screener" className="bg-white border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-amber-900 text-white py-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Award size={20} className="text-amber-400" />
              2. THUẬT TOÁN XẾP HẠNG & ĐÁNH GIÁ ALPHA v2.5 (TOP 100 VŨ TRỤ CỔ PHIẾU)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-sm text-gray-800 leading-relaxed">
            <p>
              BroStock Alpha tự động quét toàn bộ cổ phiếu trên 3 sàn (HOSE, HNX, UPCOM), lọc thanh khoản tối thiểu (Khối lượng trung bình 20 phiên $\ge 100,000$ CP/ngày), và tính điểm số xếp hạng tổng hợp dựa trên 2 chiến lược giao dịch:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Swing Trading */}
              <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200 space-y-3">
                <h4 className="font-black text-amber-900 text-sm flex items-center gap-2">
                  <Zap className="text-amber-600" size={16} /> Chiến lược Swing Trading (Mục tiêu T+15)
                </h4>
                <p className="text-xs text-gray-700">
                  Điểm xếp hạng tổng hợp Composite Alpha Score (Score_Swing) kết hợp 3 tiêu chí:
                </p>
                <div className="bg-white p-3 rounded border border-amber-200 text-xs font-mono space-y-1">
                  <div>Score_Swing = (Conviction * 0.40) + (VolRank * 0.30) + (RiskRewardRank * 0.30)</div>
                </div>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li><strong>Giá mục tiêu Net:</strong> Target = Price + (2.0 * ATR14) * (1 - 0.004). Đã trừ 0.4% thuế & phí môi giới khứ hồi.</li>
                  <li><strong>Giá cắt lỗ Net:</strong> StopLoss = Price - (1.5 * ATR14) * (1 + 0.004). Khống chế mức lỗ không vượt quá 5%.</li>
                  <li><strong>Tỷ lệ R:R (Risk:Reward):</strong> RR = (Target - Price) / (Price - StopLoss).</li>
                </ul>
              </div>

              {/* Long-Term Accumulation */}
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200 space-y-3">
                <h4 className="font-black text-blue-900 text-sm flex items-center gap-2">
                  <Layers className="text-blue-600" size={16} /> Chiến lược Tích luỹ Dài hạn (Nắm giữ 3-6 tháng)
                </h4>
                <p className="text-xs text-gray-700">
                  Điểm số Tích luỹ Dài hạn (Score_LT) ưu tiên cổ phiếu nền giá vững chắc, biến động thấp và định giá hợp lý:
                </p>
                <div className="bg-white p-3 rounded border border-blue-200 text-xs font-mono space-y-1">
                  <div>Score_LT = Trend(35%) + VolatilityCompress(25%) + Discount(20%) + Stability(15%) + ValuationProxy(5%)</div>
                </div>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li><strong>Mục tiêu Net dài hạn:</strong> Target_LT = Price + (4.0 * ATR14) * (1 - 0.004).</li>
                  <li><strong>Cắt lỗ Net dài hạn:</strong> StopLoss_LT = Price - (2.5 * ATR14) * (1 + 0.004).</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Real-Money Empirical Backtest Engine */}
        <Card id="real-money-backtest" className="bg-white border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-emerald-900 text-white py-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <LineChart size={20} className="text-emerald-400" />
              3. MÔ HÌNH KIỂM THỬ THỰC CHIẾN (REAL-MONEY BACKTEST ENGINE & CONFIDENCE SCORE)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-sm text-gray-800 leading-relaxed">
            <p>
              Trước khi xuống tiền đầu tư thực tế, người dùng cần bằng chứng định lượng thực nghiệm (Empirical Proof). BroStock tích hợp sẵn công cụ backtest tự động chạy ngầm trên 250 phiên giao dịch gần nhất (1 năm) cho từng cổ phiếu trong danh mục Alpha.
            </p>

            <div className="bg-emerald-50/60 p-4 rounded-lg border border-emerald-200 space-y-4">
              <h4 className="font-extrabold text-emerald-900 text-sm">
                📊 CÁC THÔNG SỐ ĐẦU TRỪ THUẾ & PHÍ THỰC TẾ (NET OF FEES):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded border border-emerald-200">
                  <span className="font-bold text-gray-900 block">Win Rate (% Thắng):</span>
                  Tỷ lệ % các lệnh thu được lợi nhuận dương sau khi đóng lệnh tại phiên T+15 (hoặc T+60).
                </div>
                <div className="bg-white p-3 rounded border border-emerald-200">
                  <span className="font-bold text-gray-900 block">Lời Trung Bình (%):</span>
                  Mức lợi nhuận trung bình ròng trên mỗi lệnh sau khi đã trừ <strong>0.4% thuế & phí môi giới</strong>.
                </div>
                <div className="bg-white p-3 rounded border border-emerald-200">
                  <span className="font-bold text-gray-900 block">Profit Factor (PF):</span>
                  Tỷ lệ giữa Tổng lợi nhuận các lệnh thắng / Tổng thua lỗ các lệnh thua (PF = GrossProfit / GrossLoss). PF &gt; 1.5 thể hiện hệ thống sinh lời rất tốt.
                </div>
                <div className="bg-white p-3 rounded border border-emerald-200">
                  <span className="font-bold text-gray-900 block">Max Drawdown (MaxDD %):</span>
                  Mức sụt giảm tài sản tối đa từ đỉnh trong suốt thời gian nắm giữ cổ phiếu.
                </div>
              </div>
            </div>

            {/* Confidence Score Scale */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="font-black text-gray-900 text-sm mb-3">
                🏆 THANG ĐIỂM TIN CẬY ĐẦU TƯ THỰC TẾ (REAL-MONEY CONFIDENCE RATING 0 - 100Đ):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-emerald-600 text-white p-3 rounded shadow-sm">
                  <span className="font-black text-sm block">TIN CẬY CAO (≥ 70đ)</span>
                  Win Rate ≥ 60%, Lời TB ròng &gt; 3.0%, Profit Factor &gt; 1.5. Cổ phiếu có lịch sử tuân thủ thuật toán cực tốt, ưu tiên giải ngân tiền thật.
                </div>
                <div className="bg-amber-500 text-black p-3 rounded shadow-sm font-bold">
                  <span className="font-black text-sm block text-black">TRUNG BÌNH (50 - 69đ)</span>
                  Win Rate 45-59%, Lời TB ròng 1.0-2.9%. Cần kết hợp quản trị vốn chặt chẽ và không mua đuổi.
                </div>
                <div className="bg-red-500 text-white p-3 rounded shadow-sm">
                  <span className="font-black text-sm block">RỦI RO (&lt; 50đ)</span>
                  Win Rate &lt; 45% hoặc Lời TB âm. Cổ phiếu hay có bẫy giá (Bulltrap), khuyến nghị không giải ngân.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: VN30F Derivatives Futures Signal Engine */}
        <Card id="vn30f-derivatives" className="bg-white border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-purple-900 text-white py-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap size={20} className="text-purple-400" />
              4. MÔ HÌNH XÁC ĐỊNH XU HƯỚNG PHÁI SINH VN30F (DERIVATIVES DAILY BIAS & SCALPING)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-sm text-gray-800 leading-relaxed">
            <p>
              Đối với thị trường Hợp đồng tương lai Chỉ số VN30 (VN30F1M), BroStock áp dụng mô hình chấm điểm xu hướng ngày (Daily Bias Score) để khuyến nghị vị thế <strong>LONG (Mua)</strong> hoặc <strong>SHORT (Bán)</strong> cho giao dịch trong ngày.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50/70 p-4 rounded-lg border border-purple-200 space-y-2">
                <h4 className="font-bold text-purple-900 text-sm">Chỉ số cấu thành Bias Score (-100 đến +100):</h4>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li><strong>Trend Alignment:</strong> Tương quan giữa VN30F1M và Chỉ số cơ sở VN30Index (+/- 25đ).</li>
                  <li><strong>Basis Spread:</strong> Chênh lệch Basis (Basis = VN30F1M - VN30Index). Basis dương rộng thể hiện tâm lý kỳ vọng tăng mạnh.</li>
                  <li><strong>Momentum Dual Crossover:</strong> Giao cắt đồng thời RSI(14) & MACD trên khung đồ thị ngày (+/- 20đ).</li>
                  <li><strong>Volume Surge & Open Interest:</strong> Sự gia tăng khối lượng HĐTL xác nhận xu hướng bứt phá (+/- 20đ).</li>
                </ul>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Điểm Chốt lời (Take Profit) & Cắt lỗ (Stop Loss) Chốt điểm:</h4>
                <p className="text-xs text-gray-700">
                  Sử dụng ATR (Average True Range) để tính mức biến động điểm số thực tế của hợp đồng:
                </p>
                <div className="bg-white p-2.5 rounded border border-gray-200 text-xs font-mono">
                  <div>Mục tiêu Chốt lời (Long): Target = Price + (1.5 * ATR) (điểm)</div>
                  <div>Mục tiêu Cắt lỗ (Long): StopLoss = Price - (1.0 * ATR) (điểm)</div>
                </div>
                <p className="text-xs text-gray-500 italic">
                  *Luôn đảm bảo tỷ lệ Risk:Reward tối thiểu từ 1.5:1 trở lên trước khi mở vị thế.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Real-Money Readiness */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-xl shadow-md text-center space-y-2">
          <h3 className="text-xl font-black tracking-wide flex items-center justify-center gap-2">
            <CheckCircle2 size={24} className="text-emerald-400" />
            HỆ THỐNG SẴN SÀNG CHO ĐẦU TƯ THỰC CHIẾN (REAL-MONEY READY)
          </h3>
          <p className="text-emerald-100 text-xs md:text-sm max-w-3xl mx-auto">
            Toàn bộ công thức toán học và xếp hạng đã được kiểm chứng độc lập trên dữ liệu lịch sử thực tế của thị trường chứng khoán Việt Nam. Hãy kết hợp điểm Tin cậy (Confidence Score) và Quản trị vốn chặt chẽ để đạt hiệu quả tối ưu nhất!
          </p>
        </div>

      </div>
    </div>
  );
}
