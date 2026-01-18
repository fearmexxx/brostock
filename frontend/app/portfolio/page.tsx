"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Trash2 } from "lucide-react"

interface PortfolioItem {
  Symbol: string
  Quantity: number
  "Avg Price": number
  "Total Cost": number
  "Current Price"?: number
  "Market Value"?: number
  "P/L (VND)"?: number
  "P/L (%)"?: number
  "Signal"?: string // BUY, SELL, NEUTRAL
  "Score"?: number
}

// Helper to save to LocalStorage
const savePortfolio = (data: PortfolioItem[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('brostock_portfolio', JSON.stringify(data))
    }
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Trade Form State
  const [symbol, setSymbol] = useState("TCB")
  const [qty, setQty] = useState(100)
  const [price, setPrice] = useState(0)
  const [type, setType] = useState("BUY")
  const [tradeMsg, setTradeMsg] = useState("")

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // 1. Load Portfolio from LocalStorage on mount
  useEffect(() => {
    const loadData = async () => {
        if (typeof window === 'undefined') return

        const stored = localStorage.getItem('brostock_portfolio')
        let localData: PortfolioItem[] = stored ? JSON.parse(stored) : []
        
        if (localData.length === 0) {
            setPortfolio([])
            setLoading(false)
            return
        }

        // 2. Optimized Fetch: Get Market Scan First (Bulk Price + Signals)
        let marketScan: Record<string, any> = {}
        try {
            const res = await fetch(`${API_URL}/api/market/scan`)
            if (res.ok) {
                marketScan = await res.json()
            }
        } catch (e) {
            console.error("Failed to fetch market scan", e)
        }

        // 3. Update Portfolio with Price & Signal
        // If symbol is not in scan (e.g. less popular stock), fallback to individual fetch
        
        const updated = await Promise.all(localData.map(async (item) => {
            const sym = item.Symbol
            let currentPrice = item["Avg Price"]
            let signal = "NEUTRAL"
            let score = 0

            // Try Scan Data first
            if (marketScan[sym]) {
                currentPrice = marketScan[sym].price
                signal = marketScan[sym].action
                score = marketScan[sym].score
            } else {
                // Fallback: Fetch individual stock data
                try {
                    const res = await fetch(`${API_URL}/api/stock/${sym}`)
                    if (res.ok) {
                        const json = await res.json()
                        currentPrice = json.current_price
                        // Extract signal from trend_metrics if available
                        const metrics = json.trend_metrics || {}
                        score = metrics.signal_score || 0
                        if (score >= 5) signal = "BUY"
                        else if (score <= -2) signal = "SELL"
                        else signal = "NEUTRAL"
                    }
                } catch (e) {
                    console.error(`Fallback fetch failed for ${sym}`, e)
                }
            }

            const marketValue = item.Quantity * currentPrice
            const pl = marketValue - item["Total Cost"]
            const plPct = item["Total Cost"] ? (pl / item["Total Cost"] * 100) : 0

            return {
                ...item,
                "Current Price": currentPrice,
                "Market Value": marketValue,
                "P/L (VND)": pl,
                "P/L (%)": plPct,
                "Signal": signal,
                "Score": score
            }
        }))

        setPortfolio(updated)
        setLoading(false)
    }

    loadData()
  }, []) // Run once on mount

  const handleTrade = () => {
      setTradeMsg("")
      if (!symbol || qty <= 0 || price <= 0) {
          setTradeMsg("❌ Invalid input. Please check Symbol, Qty, and Price.")
          return
      }
      
      const tradeSymbol = symbol.toUpperCase()
      let newPortfolio = [...portfolio]
      const existingIdx = newPortfolio.findIndex(i => i.Symbol === tradeSymbol)

      if (type === "BUY") {
          const cost = qty * price
          if (existingIdx >= 0) {
              // Average Up/Down
              const existing = newPortfolio[existingIdx]
              const totalQty = existing.Quantity + qty
              const totalCost = existing["Total Cost"] + cost
              const avgPrice = totalCost / totalQty
              
              newPortfolio[existingIdx] = {
                  ...existing,
                  Quantity: totalQty,
                  "Total Cost": totalCost,
                  "Avg Price": avgPrice
              }
          } else {
              // New Position
              newPortfolio.push({
                  Symbol: tradeSymbol,
                  Quantity: qty,
                  "Avg Price": price,
                  "Total Cost": cost
              })
          }
          setTradeMsg(`✅ Bought ${qty} ${tradeSymbol} @ ${price.toLocaleString()}`)

      } else {
          // SELL
          if (existingIdx === -1 || newPortfolio[existingIdx].Quantity < qty) {
              setTradeMsg("❌ Insufficient holdings to sell.")
              return
          }
          
          const existing = newPortfolio[existingIdx]
          const remainingQty = existing.Quantity - qty
          
          if (remainingQty === 0) {
              // Remove position
              newPortfolio.splice(existingIdx, 1)
          } else {
              // Reduce position (Avg Price stays same, Cost Basis reduces proportionally)
              const newCost = remainingQty * existing["Avg Price"]
              newPortfolio[existingIdx] = {
                  ...existing,
                  Quantity: remainingQty,
                  "Total Cost": newCost
              }
          }
           setTradeMsg(`✅ Sold ${qty} ${tradeSymbol} @ ${price.toLocaleString()}`)
      }

      // Update State & LocalStorage
      // Re-calculate P/L immediately with current input price as proxy for current price
      // (or keep old current price if available)
      newPortfolio = newPortfolio.map(item => {
          const curPrice = item["Current Price"] || price // Use last known or trade price
          return {
              ...item,
              "Current Price": curPrice,
              "Market Value": item.Quantity * curPrice,
              "P/L (VND)": (item.Quantity * curPrice) - item["Total Cost"],
              "P/L (%)": item["Total Cost"] ? ((item.Quantity * curPrice) - item["Total Cost"]) / item["Total Cost"] * 100 : 0
          }
      })

      setPortfolio(newPortfolio)
      savePortfolio(newPortfolio)
  }

  const clearPortfolio = () => {
      if(confirm("Are you sure you want to clear your entire portfolio?")) {
          setPortfolio([])
          savePortfolio([])
      }
  }

  // Derived Totals
  const totalNAV = portfolio.reduce((acc, item) => acc + (item["Market Value"] || 0), 0)
  const totalCost = portfolio.reduce((acc, item) => acc + item["Total Cost"], 0)
  const totalPL = totalNAV - totalCost
  const totalPLPct = totalCost ? (totalPL / totalCost) * 100 : 0

  if (loading) return <div className="p-10 text-center text-gray-500">Loading Portfolio...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
         
         <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <Briefcase className="text-blue-900" size={32} />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Portfolio (Local)</h1>
                    <p className="text-sm text-gray-500">Data saved to browser storage</p>
                </div>
             </div>
             <button onClick={clearPortfolio} className="text-red-500 text-sm flex items-center gap-1 hover:bg-red-50 p-2 rounded">
                 <Trash2 size={16} /> Clear Data
             </button>
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card>
                 <CardContent className="p-6">
                     <p className="text-gray-500 text-sm">Total Asset Value (NAV)</p>
                     <p className="text-3xl font-bold text-blue-900">{totalNAV.toLocaleString()} ₫</p>
                 </CardContent>
             </Card>
             <Card>
                 <CardContent className="p-6">
                     <p className="text-gray-500 text-sm">Total Invested</p>
                     <p className="text-3xl font-bold text-gray-700">{totalCost.toLocaleString()} ₫</p>
                 </CardContent>
             </Card>
             <Card>
                 <CardContent className="p-6">
                     <p className="text-gray-500 text-sm">Total Profit/Loss</p>
                     <div className={`flex items-end gap-2 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <p className="text-3xl font-bold">{totalPL.toLocaleString()} ₫</p>
                        <span className="mb-1 font-medium">({totalPLPct.toFixed(2)}%)</span>
                     </div>
                 </CardContent>
             </Card>
         </div>

         {/* Trade Section */}
         <Card>
             <CardHeader>
                 <CardTitle>Place New Order (Simulate)</CardTitle>
             </CardHeader>
             <CardContent>
                 <div className="flex flex-wrap gap-4 items-end">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                         <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} className="border p-2 rounded w-24 font-bold" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                         <select value={type} onChange={e => setType(e.target.value)} className="border p-2 rounded">
                             <option value="BUY">BUY</option>
                             <option value="SELL">SELL</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                         <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value))} className="border p-2 rounded w-32" step="100" />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Price (VND)</label>
                         <input 
                            type="number" 
                            value={price} 
                            onChange={e => setPrice(parseFloat(e.target.value))} 
                            className="border p-2 rounded w-32" 
                            step="100" 
                            placeholder="e.g. 20500"
                         />
                     </div>
                     <button onClick={handleTrade} className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 transition">
                         Submit Order
                     </button>
                 </div>
                 {tradeMsg && <p className="mt-4 text-sm font-medium">{tradeMsg}</p>}
             </CardContent>
         </Card>

         {/* Holdings Table */}
         <Card>
             <CardHeader>
                 <CardTitle>Current Holdings</CardTitle>
             </CardHeader>
             <CardContent>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                             <tr>
                                 <th className="px-6 py-3">Symbol</th>
                                 <th className="px-6 py-3">Signal</th>
                                 <th className="px-6 py-3">Qty</th>
                                 <th className="px-6 py-3">Avg Price</th>
                                 <th className="px-6 py-3">Current Price</th>
                                 <th className="px-6 py-3">Market Value</th>
                                 <th className="px-6 py-3">P/L</th>
                             </tr>
                         </thead>
                         <tbody>
                             {portfolio.map((item) => (
                                 <tr key={item.Symbol} className="bg-white border-b hover:bg-gray-50">
                                     <td className="px-6 py-4 font-bold text-blue-900">{item.Symbol}</td>
                                     <td className="px-6 py-4">
                                         {item.Signal === 'BUY' && (
                                             <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">BUY</span>
                                         )}
                                         {item.Signal === 'SELL' && (
                                             <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">SELL</span>
                                         )}
                                         {item.Signal === 'NEUTRAL' && (
                                             <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">HOLD</span>
                                         )}
                                     </td>
                                     <td className="px-6 py-4">{item.Quantity.toLocaleString()}</td>
                                     <td className="px-6 py-4">{item["Avg Price"].toLocaleString()}</td>
                                     <td className="px-6 py-4">{item["Current Price"]?.toLocaleString()}</td>
                                     <td className="px-6 py-4 font-medium">{item["Market Value"]?.toLocaleString()}</td>
                                     <td className={`px-6 py-4 ${ (item["P/L (VND)"] || 0) >= 0 ? 'text-green-600' : 'text-red-600' }`}>
                                         {item["P/L (VND)"]?.toLocaleString()} <br/>
                                         <span className="text-xs">({item["P/L (%)"]?.toFixed(2)}%)</span>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                     {portfolio.length === 0 && <div className="text-center p-8 text-gray-500">No holdings found. Start trading to see data here.</div>}
                 </div>
             </CardContent>
         </Card>

      </div>
    </div>
  )
}
