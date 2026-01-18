"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCcw } from "lucide-react"
import { Line, Bar, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts"

interface StockData {
  symbol: string
  current_price: number
  summary: Record<string, number>
  trend_metrics: {
      trend_strength?: number
      is_uptrend?: boolean
      annual_volatility?: number
      signal_score?: number
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

  if (!stock) return <p className="text-gray-500">No data loaded.</p>

  return (
        <>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BroStock Pro</h1>
            <p className="text-gray-500">Real-time Vietnam Stock Analysis</p>
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
                          {range}
                      </button>
                  ))}
              </div>
              <button 
                onClick={refreshData}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                Refresh
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
                        <p className="text-sm text-gray-500">Current Price</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {stock.current_price.toLocaleString()} ₫
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Net Flow (1D)</p>
                        <p className={`text-2xl font-bold ${
                            stock.summary['Dòng tiền ròng (VND)'] >= 0 
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.summary['Dòng tiền ròng (VND)']}
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
                            {timeRange === '1D' ? 'Intraday Price & Net Flow' : 'Historical Price & Volume'}
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
                                            name === 'close' ? 'Price' : name === 'vwap' ? 'VWAP' : 'Net Flow'
                                        ]}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} name="Price" />
                                    <Line yAxisId="left" type="monotone" dataKey="vwap" stroke="#f59e0b" strokeWidth={2} dot={false} name="VWAP" connectNulls />
                                    <Bar yAxisId="right" dataKey="net_flow" fill="#82ca9d" name="Net Flow" opacity={0.5} />
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
                                        formatter={(value: any) => value.toLocaleString()}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} name="Price" />
                                    <Line yAxisId="left" type="monotone" dataKey="MA5" stroke="#f59e0b" strokeWidth={1} dot={false} name="MA5" />
                                    <Line yAxisId="left" type="monotone" dataKey="MA20" stroke="#10b981" strokeWidth={1} dot={false} name="MA20" />
                                    <Bar yAxisId="right" dataKey="volume" fill="#94a3b8" name="Volume" opacity={0.3} />
                                </ComposedChart>
                            )}
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                             <p className="text-gray-400">Loading Chart...</p>
                          </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Stats Grid (Below Chart) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Money Flow */}
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Money Flow (Intraday)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {stock && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Inflow (Buy)</span>
                                            <span className="font-bold text-green-600">{stock.summary['Tổng dòng tiền vào (VND)']}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Outflow (Sell)</span>
                                            <span className="font-bold text-red-600">{stock.summary['Tổng dòng tiền ra (VND)']}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '100%' }}></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Stats */}
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Order Statistics</CardTitle></CardHeader>
                        <CardContent>
                            {stock && (
                                <div className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Buy Orders</span>
                                        <span className="font-bold">{stock.summary['Tổng số lệnh mua']}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Sell Orders</span>
                                        <span className="font-bold">{stock.summary['Tổng số lệnh bán']}</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-gray-600">Avg Vol/Buy</span>
                                        <span className="font-bold">{Math.round(stock.summary['Khối lượng trung bình lệnh mua']).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Intraday Insights */}
                    <Card className="md:col-span-2 lg:col-span-1">
                        <CardHeader><CardTitle className="text-lg">Intraday Insights</CardTitle></CardHeader>
                        <CardContent>
                            {stock && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Highest Price</p>
                                            <p className="font-bold text-green-600">{stock.summary['Giá cao nhất']?.toLocaleString()} ₫</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Lowest Price</p>
                                            <p className="font-bold text-red-600">{stock.summary['Giá thấp nhất']?.toLocaleString()} ₫</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Avg Price</p>
                                            <p className="font-bold text-blue-600">{Math.round(stock.summary['Giá trung bình'] || 0).toLocaleString()} ₫</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Imbalance Ratio</p>
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
                <Card className="bg-blue-50 border-blue-100">
                    <CardHeader>
                        <CardTitle className="text-blue-900">⚡ Signals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {stock && stock.trend_metrics && stock.trend_metrics.trend_strength !== undefined ? (
                            <>
                                {/* Trend Indicator */}
                                <div className={`p-4 rounded-lg text-center text-white ${
                                    stock.trend_metrics.is_uptrend ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                    <h3 className="text-xl font-bold">
                                        {stock.trend_metrics.is_uptrend ? 'BULLISH 🐂' : 'BEARISH 🐻'}
                                    </h3>
                                    <p className="text-sm opacity-90">Trend Strength: {stock.trend_metrics.trend_strength?.toFixed(1) || '0.0'}%</p>
                                </div>

                                {/* Volatility */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Annual Volatility</p>
                                    <p className="text-xl font-bold text-gray-800">
                                        {stock.trend_metrics.annual_volatility?.toFixed(1)}%
                                    </p>
                                </div>

                                {/* Buy/Sell Ratio */}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Buy/Sell Vol Ratio</p>
                                    <p className="text-xl font-bold text-gray-800">
                                        {buySellRatio?.toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-400">{"(>1 means Strong Buying)"}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-400 text-sm">No Signal Data</p>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
        </>
  )
}
