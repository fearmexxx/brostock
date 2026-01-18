"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FlaskConical, Play, AlertCircle } from "lucide-react"

export default function BacktestPage() {
  const [symbol, setSymbol] = useState("TCB")
  const [startDate, setStartDate] = useState("2021-01-01")
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const runBacktest = async () => {
      setLoading(true)
      setError("")
      setResult(null)
      
      try {
          const res = await fetch(`${API_URL}/api/backtest`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  symbol: symbol.toUpperCase(),
                  start_date: startDate,
                  end_date: endDate,
                  initial_capital: 100000000
              })
          })
          
          const data = await res.json()
          
          if (!res.ok) {
              throw new Error(data.detail || "Backtest failed")
          }
          
          setResult(data)
      } catch (e: any) {
          setError(e.message)
      } finally {
          setLoading(false)
      }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center gap-3">
            <FlaskConical className="text-purple-600" size={32} />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Strategy Backtester</h1>
                <p className="text-sm text-gray-500">Test the "BroStock v2.0" algo on historical data</p>
            </div>
        </div>

        {/* Controls */}
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-wrap gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                        <input 
                            value={symbol} 
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            className="border p-2 rounded w-32 font-bold uppercase" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border p-2 rounded" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border p-2 rounded" 
                        />
                    </div>
                    <button 
                        onClick={runBacktest} 
                        disabled={loading}
                        className="bg-purple-700 text-white px-6 py-2 rounded hover:bg-purple-800 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "Running..." : <><Play size={16} /> Run Backtest</>}
                    </button>
                </div>
                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Results */}
        {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-500 text-sm">Total Return</p>
                            <p className={`text-2xl font-bold ${result.total_return_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {result.total_return_pct >= 0 ? '+' : ''}{result.total_return_pct.toFixed(2)}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-500 text-sm">Win Rate</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {result.win_rate.toFixed(2)}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-500 text-sm">Max Drawdown</p>
                            <p className="text-2xl font-bold text-red-600">
                                {result.max_drawdown_pct.toFixed(2)}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-500 text-sm">Total Trades</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {result.total_trades}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Equity Curve</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={result.equity_curve}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 12}} 
                                    tickFormatter={(val) => new Date(val).toLocaleDateString()}
                                    minTickGap={50}
                                />
                                <YAxis 
                                    domain={['auto', 'auto']} 
                                    tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`}
                                />
                                <Tooltip 
                                    formatter={(val: number) => [`${val.toLocaleString()} VND`, "Equity"]}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#7c3aed" 
                                    strokeWidth={2} 
                                    dot={false} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Trade Log */}
                <Card>
                    <CardHeader>
                        <CardTitle>Trade History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2 text-right">Price</th>
                                        <th className="px-4 py-2 text-right">Shares</th>
                                        <th className="px-4 py-2 text-right">Value</th>
                                        <th className="px-4 py-2 text-right">P/L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.trades.map((t: any, idx: number) => (
                                        <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-2">{t.date}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right">{t.price.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right">{t.shares}</td>
                                            <td className="px-4 py-2 text-right">{t.value.toLocaleString()}</td>
                                            <td className={`px-4 py-2 text-right font-medium ${t.p_l > 0 ? 'text-green-600' : t.p_l < 0 ? 'text-red-600' : ''}`}>
                                                {t.p_l ? `${t.p_l.toLocaleString()} (${t.p_l_pct.toFixed(2)}%)` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

            </div>
        )}
      </div>
    </div>
  )
}
