"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, ArrowRight, Activity, TrendingUp, BarChart2, CheckCircle2, AlertTriangle, Info, Clock } from "lucide-react"

interface DerivativeSignal {
  vn30_price: number;
  vn30_open: number;
  vn30_high: number;
  vn30_low: number;
  vn30_volume: number;
  prev_close: number;
  pct_change: number;
  signal_score: number;
  signal_label: string;
  action_vn: string;
  market_regime: string;
  adx: number;
  entry: number;
  target: number;
  stop_loss: number;
  target_points: number;
  stop_points: number;
  rr_ratio: number;
  pnl_target_vnd: number;
  pnl_stop_vnd: number;
  factors: {
    ema_trend: number;
    price_action: number;
    momentum: number;
    volatility: number;
    breadth: number;
    pattern: number;
  };
  indicators: {
    ema9: number;
    ema21: number;
    ema50: number;
    rsi: number;
    macd: number;
    macd_signal: number;
    macd_hist: number;
    atr: number;
    bb_width: number;
  };
  weights: {
    ema_trend: number;
    price_action: number;
    momentum: number;
    volatility: number;
    breadth: number;
    pattern: number;
  };
  date: string;
  timestamp: string;
}

interface DerivativeHistory {
  date: string;
  score: number;
  label: string;
  action_vn: string;
  vn30_price: number;
  pct_change: number;
  entry: number;
  target: number;
  stop_loss: number;
  rr_ratio: number;
  regime: string;
}

export default function DerivativesPage() {
  const [data, setData] = useState<{ signal: DerivativeSignal | null, history: DerivativeHistory[] }>({ signal: null, history: [] })
  const [loading, setLoading] = useState(true)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/derivatives/signal`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error("Failed to fetch derivatives signal:", e)
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-spin text-blue-600" size={48} />
          <p className="text-blue-600 font-bold tracking-widest uppercase">Initializing VN30F Engine...</p>
        </div>
      </div>
    )
  }

  const { signal, history } = data

  if (!signal || !signal.vn30_price) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800">
        <p className="text-gray-500">Không có dữ liệu tín hiệu phái sinh.</p>
      </div>
    )
  }

  const isLong = signal.signal_score >= 0;
  const isStrong = Math.abs(signal.signal_score) >= 60;
  const isNeutral = Math.abs(signal.signal_score) < 25;

  const scoreColor = isNeutral ? "text-gray-500" : isLong ? "text-emerald-600" : "text-rose-600";
  const bgGradient = isNeutral 
    ? "from-gray-50 to-gray-100" 
    : isLong 
      ? isStrong ? "from-emerald-50 to-gray-50" : "from-emerald-50/50 to-gray-50"
      : isStrong ? "from-rose-50 to-gray-50" : "from-rose-50/50 to-gray-50";
      
  const actionBorder = isNeutral ? "border-gray-200" : isLong ? "border-emerald-200" : "border-rose-200";
  const actionShadow = isNeutral ? "shadow-md" : isLong ? "shadow-lg shadow-emerald-100" : "shadow-lg shadow-rose-100";

  // Calculate gauge rotation (0 to 180 degrees)
  // -100 = 0deg, 0 = 90deg, 100 = 180deg
  const gaugeRotation = ((signal.signal_score + 100) / 200) * 180;

  return (
    <div className={`min-h-[calc(100vh-64px)] bg-gray-50 text-gray-800 p-4 md:p-8 font-sans bg-gradient-to-br ${bgGradient}`}>
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                <Activity className="text-blue-600" size={28} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">VN30F SIGNAL <span className="text-blue-600 text-sm font-bold align-top ml-1">PRO</span></h1>
            </div>
            <p className="text-gray-500 mt-2 text-sm font-medium tracking-wide">Mô hình tín hiệu xu hướng trong ngày dựa trên phân tích lượng tử VN30 Index</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-gray-900">{signal.vn30_price.toLocaleString()}</span>
              <span className={`text-xl font-bold flex items-center ${signal.pct_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {signal.pct_change >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                {Math.abs(signal.pct_change).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1">
              <Clock size={12} /> Cập nhật: {new Date(signal.timestamp).toLocaleTimeString('vi-VN')} ({signal.date})
            </p>
          </div>
        </div>

        {/* Top Row: Gauge & Action Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Signal Score Gauge */}
          <Card className="bg-white border-gray-200 shadow-md lg:col-span-1 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <BarChart2 size={120} className="text-blue-900" />
            </div>
            <CardContent className="p-8 text-center flex flex-col items-center z-10">
              <h3 className="text-sm uppercase tracking-[0.2em] text-gray-500 font-bold mb-6">Bias Score Hiện Tại</h3>
              
              {/* Semi-circle Gauge */}
              <div className="relative w-48 h-24 overflow-hidden mb-2">
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-gray-100"></div>
                {/* Gradient Arc */}
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[16px] border-transparent border-t-rose-500 border-l-emerald-500 opacity-90 transform -rotate-45"></div>
                {/* Needle */}
                <div 
                  className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-800 origin-bottom rounded-t-full transition-transform duration-1000 ease-out shadow-sm"
                  style={{ transform: `translateX(-50%) rotate(${gaugeRotation - 90}deg)` }}
                >
                  <div className="absolute -bottom-2 -left-1.5 w-4 h-4 bg-gray-800 rounded-full"></div>
                </div>
              </div>
              
              <div className="flex justify-between w-56 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 mb-6">
                <span className="text-rose-500">-100</span>
                <span>0</span>
                <span className="text-emerald-500">+100</span>
              </div>
              
              <div className={`text-6xl font-black tabular-nums tracking-tighter ${scoreColor}`}>
                {signal.signal_score > 0 ? "+" : ""}{signal.signal_score}
              </div>
              <div className="mt-2 text-sm font-bold tracking-widest text-gray-600 uppercase">
                {signal.signal_label}
              </div>
            </CardContent>
          </Card>

          {/* Execution Panel */}
          <Card className={`bg-white border ${actionBorder} ${actionShadow} lg:col-span-2 relative overflow-hidden`}>
            {/* Background Glow */}
            <div className={`absolute -inset-20 blur-3xl opacity-10 rounded-full pointer-events-none ${isLong ? 'bg-emerald-300' : 'bg-rose-300'} ${isNeutral ? 'hidden' : ''}`}></div>
            
            <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-gray-500 font-bold">Khuyến Nghị Lệnh</h3>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full text-xs font-mono text-gray-600 border border-gray-200">
                    <TrendingUp size={12} className="text-gray-400"/>
                    Trạng thái TT: <span className="text-gray-900 font-bold">{signal.market_regime}</span> (ADX: {signal.adx})
                  </div>
                </div>
                
                <div className={`text-4xl md:text-5xl font-black uppercase tracking-tight mt-4 ${scoreColor}`}>
                  {signal.action_vn}
                </div>
              </div>

              {isNeutral ? (
                <div className="mt-8 flex items-center gap-4 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <Info className="text-gray-500" size={32} />
                  <p className="text-gray-600 font-medium">Thị trường không có xu hướng rõ ràng. Khuyến nghị đứng ngoài quan sát để bảo toàn vốn.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  {/* Entry */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col justify-center">
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Vùng Khớp Lệnh</span>
                    <span className="text-3xl font-bold text-gray-900 font-mono">{signal.entry.toFixed(1)}</span>
                    <span className="text-xs text-gray-500 mt-1">Dựa trên giá VN30 hiện tại</span>
                  </div>
                  
                  {/* Target */}
                  <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                    <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">Mục Tiêu (Target)</span>
                    <span className="text-3xl font-bold text-emerald-700 font-mono">{signal.target.toFixed(1)}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">+{signal.target_points.toFixed(1)} đ</span>
                      <span className="text-xs text-gray-600">~{signal.pnl_target_vnd.toLocaleString()} đ/HĐ</span>
                    </div>
                  </div>

                  {/* Stop Loss */}
                  <div className="bg-rose-50 p-5 rounded-xl border border-rose-100 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-rose-500"></div>
                    <span className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">Cắt Lỗ (Stop)</span>
                    <span className="text-3xl font-bold text-rose-700 font-mono">{signal.stop_loss.toFixed(1)}</span>
                    <div className="flex justify-between items-end mt-1">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">-{signal.stop_points.toFixed(1)} đ</span>
                         <span className="text-xs text-gray-600">~{signal.pnl_stop_vnd.toLocaleString()} đ/HĐ</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {!isNeutral && (
                <div className="mt-4 flex justify-end">
                  <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tỷ lệ Risk:Reward</span>
                    <span className={`text-lg font-black font-mono ${signal.rr_ratio >= 1.5 ? 'text-emerald-600' : 'text-amber-600'}`}>{signal.rr_ratio.toFixed(2)} : 1</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Factors Breakdown */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-blue-500" /> Phân Tích Đa Yếu Tố (Multi-Factor Breakdown)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "EMA Trend", score: signal.factors.ema_trend, weight: signal.weights.ema_trend, sub: `E9: ${signal.indicators.ema9} | E21: ${signal.indicators.ema21}` },
              { name: "Price Action", score: signal.factors.price_action, weight: signal.weights.price_action, sub: "VWAP & Gap" },
              { name: "Momentum", score: signal.factors.momentum, weight: signal.weights.momentum, sub: `RSI: ${signal.indicators.rsi} | MACD: ${signal.indicators.macd}` },
              { name: "Volatility", score: signal.factors.volatility, weight: signal.weights.volatility, sub: `ATR: ${signal.indicators.atr} | BBw: ${signal.indicators.bb_width}` },
              { name: "Mkt Breadth", score: signal.factors.breadth, weight: signal.weights.breadth, sub: "A/D Ratio" },
              { name: "Pattern", score: signal.factors.pattern, weight: signal.weights.pattern, sub: "Multi-day candles" },
            ].map(f => (
              <div key={f.name} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                {/* Progress Bar Background */}
                <div 
                  className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${f.score >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${f.score}%` }}
                ></div>
                
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{f.name}</span>
                  <span className="text-[10px] font-mono text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">{(f.weight * 100).toFixed(0)}% wgt</span>
                </div>
                <div className="text-2xl font-black font-mono text-gray-900 mb-1">
                  {f.score}
                </div>
                <div className="text-[10px] text-gray-500 font-mono truncate">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* History Table */}
        {history && history.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader className="border-b border-gray-100 py-4 bg-gray-50">
              <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">Lịch Sử Tín Hiệu (7 Ngày)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">Ngày</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4">Tín Hiệu</th>
                    <th className="px-6 py-4 text-right">VN30 Close</th>
                    <th className="px-6 py-4 text-center">Trend Regime</th>
                    <th className="px-6 py-4 text-right">Target</th>
                    <th className="px-6 py-4 text-right">Stop</th>
                    <th className="px-6 py-4 text-center">R:R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.slice().reverse().map((h) => (
                    <tr key={h.date} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">{h.date}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          h.score >= 25 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          h.score <= -25 ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                          {h.score > 0 ? "+" : ""}{h.score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-xs uppercase tracking-wide text-gray-800">{h.action_vn}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-700">
                        {h.vn30_price.toFixed(1)}
                        <span className={`ml-2 text-[10px] font-bold ${h.pct_change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {h.pct_change >= 0 ? '+' : ''}{h.pct_change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-gray-500">{h.regime}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-emerald-600 font-bold">{h.target > 0 ? h.target.toFixed(1) : '-'}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-rose-600 font-bold">{h.stop_loss > 0 ? h.stop_loss.toFixed(1) : '-'}</td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-gray-500">{h.rr_ratio > 0 ? `${h.rr_ratio}:1` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
