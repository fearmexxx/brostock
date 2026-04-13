"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCcw } from "lucide-react"
import { Line, Bar, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"

interface StockData {
  symbol: string
  current_price: number
  summary: Record<string, any>
  trend_metrics: {
      signal_score: number
      signal_label: string
      market_regime: string
      adx: number
      factors: {
          trend: number
          momentum: number
          volume: number
          volatility: number
          mean_reversion: number
      }
      risk_score: number
      risk_label: string
      risk_factors: {
          volatility: number
          expansion: number
          drawdown: number
      }
      prediction_5d_pct: number
      prediction_label: string
  }
  intraday_data: Array<{ time: string; close: number; vwap: number; net_flow: number }>
  historical_data: Array<{ time: string; close: number; MA5: number; MA20: number; volume: number }>
}

export function DashboardClient({ data }: { data: StockData | null }) {
  const [stock, setStock] = useState<StockData | null>(data)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<"1D" | "7D" | "30D">("1D")

  const parseVND = (str: string) => {
    if (!str) return 0
    return parseFloat(str.replace(/\./g, '').replace(/,/g, ''))
  }

  const buySellRatio = stock?.summary?.['Tỷ lệ khối lượng trung bình mua/bán']

  // Prepare data based on Time Range
  const getChartData = () => {
    if (!stock) return []
    if (timeRange === "1D") return stock.intraday_data || []
    
    const hist = stock.historical_data || []
    if (timeRange === "7D") return hist.slice(-7)
    if (timeRange === "30D") return hist.slice(-30)
    return hist
  }

  const chartData = getChartData()

  // Handler to refresh data client-side
  const refreshData = async () => {
      if(!stock) return
      setLoading(true)
      try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const res = await fetch(`${API_URL}/api/stock/${stock.symbol}`)
          if(res.ok) {
              const newData = await res.json()
              setStock(newData)
          }
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
  }

  if (!stock) return <p className="text-gray-500">Không có dữ liệu.</p>

  return (
        <>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BroStock Pro</h1>
            <p className="text-gray-500">Phân tích chứng khoán Việt Nam thời gian thực</p>
          </div>
          <div className="flex gap-4">
              <div className="flex bg-white rounded-lg p-1 border">
                  {(["1D", "7D", "30D"] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-1 rounded-md text-sm font-medium transition ${
                            timeRange === range ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                          {range === "1D" ? "1N" : range}
                      </button>
                  ))}
              </div>
              <button 
                onClick={refreshData}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                Làm mới
              </button>
          </div>
        </div>

        {/* Input & Key Stats */}
        <Card className="bg-white border-none shadow-sm">
            <CardContent className="flex items-center gap-6 p-4">
              <div className="border rounded px-3 py-2 font-bold w-32 text-center text-lg bg-gray-50">
                  {stock.symbol}
              </div>
              <span className="text-gray-300 text-2xl">|</span>
              
                 <div className="flex flex-wrap gap-8 w-full">
                    <div>
                        <p className="text-sm text-gray-500">Giá hiện tại</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {stock.current_price.toLocaleString()} ₫
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Dòng tiền ròng (1N)</p>
                        <p className={`text-2xl font-bold ${
                            parseVND(stock.summary['Dòng tiền ròng (VND)']) >= 0 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.summary['Dòng tiền ròng (VND)']}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Dòng tiền Cá mập</p>
                        <p className={`text-2xl font-bold ${
                            parseVND(stock.summary['Dòng tiền Cá mập ròng (VND)']) >= 0 
                            ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {stock.summary['Dòng tiền Cá mập ròng (VND)']}
                        </p>
                    </div>
                 </div>
              
            </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Chart Area (3/4) */}
            <div className="lg:col-span-3 space-y-6">
                <Card className="h-[500px]">
                    <CardHeader>
                        <CardTitle>
                            {timeRange === '1D' ? 'Giá & Dòng tiền trong ngày' : 'Giá & Khối lượng lịch sử'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        {stock && chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            {timeRange === '1D' ? (
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="time" 
                                        tickFormatter={(tick) => {
                                            const date = new Date(tick);
                                            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                                        }}
                                        minTickGap={30}
                                    />
                                    <YAxis yAxisId="left" domain={['auto', 'auto']} />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                        labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                                        formatter={(value: any, name: any) => [
                                            name === 'net_flow' ? value.toLocaleString() : `${value.toLocaleString()} ₫`, 
                                            name === 'close' ? 'Giá' : name === 'vwap' ? 'VWAP' : 'Dòng tiền ròng'
                                        ]}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} name="Giá" />
                                    <Line yAxisId="left" type="monotone" dataKey="vwap" stroke="#f59e0b" strokeWidth={2} dot={false} name="VWAP" connectNulls />
                                    <Bar yAxisId="right" dataKey="net_flow" fill="#82ca9d" name="Dòng tiền ròng" opacity={0.5} />
                                </ComposedChart>
                            ) : (
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="time" 
                                        tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                                    />
                                    <YAxis yAxisId="left" domain={['auto', 'auto']} />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                        formatter={(value: any, name: any) => [
                                            value.toLocaleString(),
                                            name === 'close' ? 'Giá' : name === 'volume' ? 'Khối lượng' : name
                                        ]}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} name="Giá" />
                                    <Line yAxisId="left" type="monotone" dataKey="MA5" stroke="#f59e0b" strokeWidth={1} dot={false} name="MA5" />
                                    <Line yAxisId="left" type="monotone" dataKey="MA20" stroke="#10b981" strokeWidth={1} dot={false} name="MA20" />
                                    <Bar yAxisId="right" dataKey="volume" fill="#94a3b8" name="Khối lượng" opacity={0.3} />
                                </ComposedChart>
                            )}
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                             <p className="text-gray-400">Đang tải biểu đồ...</p>
                          </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Stats Grid (Below Chart) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Smart Money Flow */}
                    <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2">🐋 Dòng tiền Cá mập (Big Flow)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {stock && (
                                <>
                                    {(() => {
                                        const bigIn = parseVND(stock.summary['Dòng tiền Cá mập vào (VND)'] || '0');
                                        const bigOut = parseVND(stock.summary['Dòng tiền Cá mập ra (VND)'] || '0');
                                        const total = bigIn + bigOut;
                                        const inPercent = total > 0 ? (bigIn / total) * 100 : 0;
                                        
                                        return (
                                            <>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Cá mập mua</span>
                                                        <span className="font-bold text-blue-600">{stock.summary['Dòng tiền Cá mập vào (VND)']}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${inPercent}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Cá mập bán</span>
                                                        <span className="font-bold text-orange-600">{stock.summary['Dòng tiền Cá mập ra (VND)']}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: `${100-inPercent}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t flex justify-between">
                                                    <span className="text-sm font-medium">Cá mập ròng</span>
                                                    <span className={`font-black ${parseVND(stock.summary['Dòng tiền Cá mập ròng (VND)']) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                        {stock.summary['Dòng tiền Cá mập ròng (VND)']} ₫
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Money Flow (Retail + Institutional) */}
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Dòng tiền Tổng cộng</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {stock && (
                                <>
                                    {(() => {
                                        const totalIn = parseVND(stock.summary['Tổng dòng tiền vào (VND)'] || '0');
                                        const totalOut = parseVND(stock.summary['Tổng dòng tiền ra (VND)'] || '0');
                                        const total = totalIn + totalOut;
                                        const inPercent = total > 0 ? (totalIn / total) * 100 : 0;
                                        
                                        return (
                                            <>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Tổng mua</span>
                                                        <span className="font-bold text-green-600">{stock.summary['Tổng dòng tiền vào (VND)']}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${inPercent}%` }}></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Tổng bán</span>
                                                        <span className="font-bold text-red-600">{stock.summary['Tổng dòng tiền ra (VND)']}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${100-inPercent}%` }}></div>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Stats */}
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Thống kê lệnh</CardTitle></CardHeader>
                        <CardContent>
                            {stock && (
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Lệnh mua</span>
                                        <span className="font-bold">{stock.summary['Tổng số lệnh mua']}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Lệnh bán</span>
                                        <span className="font-bold">{stock.summary['Tổng số lệnh bán']}</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-gray-600">KL TB/Mua</span>
                                        <span className="font-bold">{Math.round(stock.summary['Khối lượng trung bình lệnh mua']).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Intraday Insights */}
                    <Card className="md:col-span-2 lg:col-span-1">
                        <CardHeader><CardTitle className="text-lg">Thông tin trong ngày</CardTitle></CardHeader>
                        <CardContent>
                            {stock && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Giá cao nhất</p>
                                            <p className="font-bold text-green-600">{stock.summary['Giá cao nhất']?.toLocaleString()} ₫</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Giá thấp nhất</p>
                                            <p className="font-bold text-red-600">{stock.summary['Giá thấp nhất']?.toLocaleString()} ₫</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Giá trung bình</p>
                                            <p className="font-bold text-blue-600">{Math.round(stock.summary['Giá trung bình'] || 0).toLocaleString()} ₫</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Tỷ lệ mất cân bằng</p>
                                            <p className="font-bold">{stock.summary['Imbalance Ratio (Trung bình)']?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Sidebar (1/4) - Signals */}
            <div className="space-y-6">
                {/* Main Signal Card */}
                <Card className="bg-[#1e3a8a] text-white border-none shadow-lg overflow-hidden">
                    <CardHeader className="pb-2 border-b border-blue-800/50">
                        <CardTitle className="text-xs font-bold text-blue-300 uppercase tracking-widest flex justify-between">
                            Tín hiệu BroStock
                            <span>v2.6 Institutional</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <div className="text-6xl font-black tracking-tighter">
                                    {stock.trend_metrics?.signal_score > 0 ? '+' : ''}{stock.trend_metrics?.signal_score?.toFixed(0)}
                                </div>
                                <div className={`mt-2 px-3 py-1 rounded text-xs font-black uppercase inline-block ${
                                    stock.trend_metrics.signal_score >= 40 ? 'bg-green-500 text-white' :
                                    stock.trend_metrics.signal_score <= -40 ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                }`}>
                                    {stock.trend_metrics.signal_label}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-blue-300 uppercase font-bold">Rủi ro</p>
                                <p className={`text-sm font-black ${
                                    stock.trend_metrics.risk_score > 60 ? 'text-red-400' : 
                                    stock.trend_metrics.risk_score < 30 ? 'text-green-400' : 'text-yellow-400'
                                }`}>{stock.trend_metrics.risk_label} ({stock.trend_metrics.risk_score})</p>
                            </div>
                        </div>

                        {/* Factor Analysis (NVDA Style) */}
                        <div className="space-y-4 pt-4 border-t border-blue-800/50">
                            {[
                                { label: 'Xu hướng', val: stock.trend_metrics.factors?.trend, color: 'bg-blue-400' },
                                { label: 'Động lượng', val: stock.trend_metrics.factors?.momentum, color: 'bg-indigo-400' },
                                { label: 'Khối lượng', val: stock.trend_metrics.factors?.volume, color: 'bg-cyan-400' },
                                { label: 'Biến động', val: stock.trend_metrics.factors?.volatility, color: 'bg-emerald-400' },
                                { label: 'Đảo chiều', val: stock.trend_metrics.factors?.mean_reversion, color: 'bg-amber-400' }
                            ].map(f => (
                                <div key={f.label} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-blue-200">
                                        <span>{f.label}</span>
                                        <span>{f.val}</span>
                                    </div>
                                    <div className="w-full bg-blue-950 h-1.5 rounded-full overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full ${f.color} transition-all duration-1000 ease-out`}
                                            style={{ width: `${f.val}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Outlook Card */}
                <Card className="bg-white border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Triển vọng 5 ngày</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <div className="flex items-center justify-between">
                            <div className={`text-4xl font-black ${
                                stock.trend_metrics.prediction_5d_pct >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {stock.trend_metrics.prediction_5d_pct >= 0 ? '+' : ''}{stock.trend_metrics.prediction_5d_pct?.toFixed(2)}%
                            </div>
                            <div className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                stock.trend_metrics.prediction_label === 'UPWARD' ? 'bg-green-100 text-green-700' :
                                stock.trend_metrics.prediction_label === 'DOWNWARD' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                                {stock.trend_metrics.prediction_label}
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3 font-medium border-t pt-2 italic">
                            Dự báo dựa trên Điểm tin cậy & ATR thực tế
                        </p>
                    </CardContent>
                </Card>

                {/* Legend/Info */}
                <Card className="bg-slate-50 border-none">
                    <CardContent className="p-4 text-[10px] text-gray-500 leading-relaxed">
                        <p className="font-bold mb-1 text-gray-700">BroStock Engine v2.6 Institutional</p>
                        Mô hình v2.6 bổ sung: 1. Truy vết "Cá mập" (Smart Money) qua Tick Data. 2. Đánh giá rủi ro đa tầng (Volatility, Expansion, Max Drawdown).
                    </CardContent>
                </Card>
            </div>

        </div>
        </>
  )
}
