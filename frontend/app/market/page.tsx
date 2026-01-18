"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, TrendingUp, BarChart3, ListOrdered } from "lucide-react"
import Link from "next/link"

interface MarketData {

  indices: Record<string, any>

  top10: {

    gainers: any[]

    losers: any[]

    volume: any[]

  }

  signals: {

    bullish: any[]

    bearish: any[]

  }

  last_updated: string | null

}



export default function MarketPage() {

  const [data, setData] = useState<MarketData | null>(null)

  const [loading, setLoading] = useState(true)

  const [view, setView] = useState<"rankings" | "signals">("rankings")



  const fetchMarketData = async () => {

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        try {

          const res = await fetch(`${API_URL}/api/market/overview`)

      const json = await res.json()

      setData(json)

    } catch (e) {

      console.error(e)

    } finally {

      setLoading(false)

    }

  }



  const triggerUpdate = async () => {

      try {

          await fetch(`${API_URL}/api/market/update`)

          alert("Market update triggered. Please wait a minute for data to populate.")

      } catch (e) {

          console.error(e)

      }

  }



  useEffect(() => {

    fetchMarketData()

    const interval = setInterval(fetchMarketData, 60000) // Update every minute

    return () => clearInterval(interval)

  }, [])



  const getSortedSignals = (signals: any[], order: 'asc' | 'desc') => {
    if (!signals) return [];
    return [...signals].sort((a, b) => {
      return order === 'desc' ? b.trend_strength - a.trend_strength : a.trend_strength - b.trend_strength;
    });
  };

  if (loading && !data) {

    return (

      <div className="flex items-center justify-center min-h-screen">

        <p className="text-gray-500 animate-pulse">Loading Market Data...</p>

      </div>

    )

  }



  return (

    <div className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-7xl mx-auto space-y-8">

        

        <div className="flex justify-between items-end">

            <div>

                <h1 className="text-3xl font-bold text-gray-900">Market Overview</h1>

                <p className="text-gray-500">Real-time indicators and rankings</p>

            </div>

            <div className="text-right space-y-2">

                <button 

                    onClick={triggerUpdate}

                    className="text-xs bg-white border px-3 py-1 rounded hover:bg-gray-50 transition"

                >

                    Trigger Market Update

                </button>

                {data?.last_updated && (

                    <p className="text-[10px] text-gray-400">Last updated: {new Date(data.last_updated).toLocaleTimeString()}</p>

                )}

            </div>

        </div>



        {/* Indices */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {data && data.indices && Object.entries(data.indices).map(([name, info]: [string, any]) => (

                <Card key={name} className="border-none shadow-sm">

                    <CardContent className="p-6">

                        <div className="flex justify-between items-start mb-2">

                            <p className="text-gray-500 font-medium">{name}</p>

                            <span className={`px-2 py-1 rounded text-xs font-bold ${

                                info.pct_change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'

                            }`}>

                                {info.pct_change >= 0 ? '+' : ''}{info.pct_change.toFixed(2)}%

                            </span>

                        </div>

                        <p className="text-3xl font-bold text-gray-900">{info.value.toLocaleString()}</p>

                        <div className="flex items-center gap-1 mt-1">

                            {info.change >= 0 ? <ArrowUp size={14} className="text-green-600" /> : <ArrowDown size={14} className="text-red-600" />}

                            <p className={`text-sm ${info.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>

                                {info.change.toFixed(2)}

                            </p>

                        </div>

                    </CardContent>

                </Card>

            ))}

        </div>



        {/* View Switcher */}

        <div className="flex gap-2 bg-gray-200/50 p-1 rounded-lg w-fit">

            <button 

                onClick={() => setView("rankings")}

                className={`px-6 py-2 rounded-md text-sm font-medium transition ${view === 'rankings' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}

            >

                Rankings

            </button>

            <button 

                onClick={() => setView("signals")}

                className={`px-6 py-2 rounded-md text-sm font-medium transition ${view === 'signals' ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}

            >

                Market Signals

            </button>

        </div>



        {view === "rankings" ? (

            /* Top 10 Tables */

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                

                {/* Gainers */}

                <Card className="border-none shadow-sm">

                    <CardHeader className="flex flex-row items-center gap-2 border-b">

                        <TrendingUp className="text-green-600" size={20} />

                        <CardTitle className="text-lg">Top Gainers</CardTitle>

                    </CardHeader>

                    <CardContent className="p-0">

                        <table className="w-full text-sm text-left">

                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">

                                <tr>

                                    <th className="px-4 py-2">Symbol</th>

                                    <th className="px-4 py-2 text-right">Price</th>

                                    <th className="px-4 py-2 text-right">Change</th>

                                </tr>

                            </thead>

                                                        <tbody>

                                                            {data?.top10?.gainers?.map((s) => (

                                                                <tr key={s.symbol} className="border-b hover:bg-gray-50 transition">

                                                                    <td className="px-4 py-3 font-bold text-blue-900">

                                                                        <Link href={`/?symbol=${s.symbol}`}>{s.symbol}</Link>

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right">

                                                                        <div className="font-medium">{s.price.toLocaleString()}</div>

                                                                        <div className="text-[10px] text-green-600">+{s.change.toLocaleString()} (+{s.pct_change.toFixed(2)}%)</div>

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right text-green-600 font-medium">+{s.pct_change.toFixed(2)}%</td>

                                                                </tr>

                                                            ))}

                                                        </tbody>

                        </table>

                    </CardContent>

                </Card>



                {/* Losers */}

                <Card className="border-none shadow-sm">

                    <CardHeader className="flex flex-row items-center gap-2 border-b">

                        <TrendingUp className="text-red-600 rotate-180" size={20} />

                        <CardTitle className="text-lg">Top Losers</CardTitle>

                    </CardHeader>

                    <CardContent className="p-0">

                        <table className="w-full text-sm text-left">

                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">

                                <tr>

                                    <th className="px-4 py-2">Symbol</th>

                                    <th className="px-4 py-2 text-right">Price</th>

                                    <th className="px-4 py-2 text-right">Change</th>

                                </tr>

                            </thead>

                                                        <tbody>

                                                            {data?.top10?.losers?.map((s) => (

                                                                <tr key={s.symbol} className="border-b hover:bg-gray-50 transition">

                                                                    <td className="px-4 py-3 font-bold text-blue-900">

                                                                        <Link href={`/?symbol=${s.symbol}`}>{s.symbol}</Link>

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right">

                                                                        <div className="font-medium">{s.price.toLocaleString()}</div>

                                                                        <div className="text-[10px] text-red-600">{s.change.toLocaleString()} ({s.pct_change.toFixed(2)}%)</div>

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right text-red-600 font-medium">{s.pct_change.toFixed(2)}%</td>

                                                                </tr>

                                                            ))}

                                                        </tbody>

                        </table>

                    </CardContent>

                </Card>



                {/* Volume */}

                <Card className="border-none shadow-sm">

                    <CardHeader className="flex flex-row items-center gap-2 border-b">

                        <BarChart3 className="text-blue-600" size={20} />

                        <CardTitle className="text-lg">Most Active (Vol)</CardTitle>

                    </CardHeader>

                    <CardContent className="p-0">

                        <table className="w-full text-sm text-left">

                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">

                                <tr>

                                    <th className="px-4 py-2">Symbol</th>

                                    <th className="px-4 py-2 text-right">Volume</th>

                                    <th className="px-4 py-2 text-right">Price</th>

                                </tr>

                            </thead>

                                                        <tbody>

                                                            {data?.top10?.volume?.map((s) => (

                                                                <tr key={s.symbol} className="border-b hover:bg-gray-50 transition">

                                                                    <td className="px-4 py-3 font-bold text-blue-900">

                                                                        <Link href={`/?symbol=${s.symbol}`}>{s.symbol}</Link>

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right text-gray-600 font-medium">{(s.volume / 1000000).toFixed(1)}M</td>

                                                                    <td className="px-4 py-3 text-right">

                                                                        <div className="font-medium">{s.price.toLocaleString()}</div>

                                                                        <div className={`text-[10px] ${s.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>

                                                                            {s.change >= 0 ? '+' : ''}{s.change.toLocaleString()} ({s.pct_change >= 0 ? '+' : ''}{s.pct_change.toFixed(2)}%)

                                                                        </div>

                                                                    </td>

                                                                </tr>

                                                            ))}

                                                        </tbody>

                        </table>

                    </CardContent>

                </Card>

            </div>

        ) : (

            /* Signals View */

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Bullish Signals */}

                <Card className="border-none shadow-sm">

                    <CardHeader className="flex flex-row items-center gap-2 border-b">

                        <TrendingUp className="text-green-600" size={20} />

                        <CardTitle className="text-lg">Top 15 Bullish Signals</CardTitle>

                    </CardHeader>

                    <CardContent className="p-0">

                        <table className="w-full text-sm text-left">

                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">

                                <tr>

                                    <th className="px-4 py-2">Symbol</th>

                                    <th className="px-4 py-2">Signal</th>

                                    <th className="px-4 py-2 text-right">Strength</th>

                                    <th className="px-4 py-2 text-right">Price</th>

                                </tr>

                            </thead>

                                                        <tbody>

                                                            {getSortedSignals(data?.signals?.bullish, 'desc').map((s) => (

                                                                <tr key={s.symbol} className="border-b hover:bg-gray-50 transition">

                                                                    <td className="px-4 py-3 font-bold text-blue-900">

                                                                        <Link href={`/?symbol=${s.symbol}`}>{s.symbol}</Link>

                                                                    </td>

                                                                    <td className="px-4 py-3">

                                                                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">

                                                                            {s.signal_label}

                                                                        </span>

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right font-medium text-green-600">{s.trend_strength.toFixed(1)}%</td>

                                                                    <td className="px-4 py-3 text-right">

                                                                        <div className="font-medium">{s.price.toLocaleString()}</div>

                                                                        <div className={`text-[10px] ${s.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>

                                                                            {s.change >= 0 ? '+' : ''}{s.change.toLocaleString()} ({s.pct_change >= 0 ? '+' : ''}{s.pct_change.toFixed(2)}%)

                                                                        </div>

                                                                    </td>

                                                                </tr>

                                                            ))}

                                                        </tbody>

                        </table>

                    </CardContent>

                </Card>



                {/* Bearish Signals */}

                <Card className="border-none shadow-sm">

                    <CardHeader className="flex flex-row items-center gap-2 border-b">

                        <TrendingUp className="text-red-600 rotate-180" size={20} />

                        <CardTitle className="text-lg">Top 15 Bearish Signals</CardTitle>

                    </CardHeader>

                    <CardContent className="p-0">

                        <table className="w-full text-sm text-left">

                            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">

                                <tr>

                                    <th className="px-4 py-2">Symbol</th>

                                    <th className="px-4 py-2">Signal</th>

                                    <th className="px-4 py-2 text-right">Strength</th>

                                    <th className="px-4 py-2 text-right">Price</th>

                                </tr>

                            </thead>

                                                        <tbody>

                                                            {getSortedSignals(data?.signals?.bearish, 'asc').map((s) => (

                                                                <tr key={s.symbol} className="border-b hover:bg-gray-50 transition">

                                                                    <td className="px-4 py-3 font-bold text-blue-900">

                                                                        <Link href={`/?symbol=${s.symbol}`}>{s.symbol}</Link>

                                                                    </td>

                                                                    <td className="px-4 py-3">

                                                                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">

                                                                            {s.signal_label}

                                                                        </span>

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right font-medium text-red-600">{s.trend_strength.toFixed(1)}%</td>

                                                                    <td className="px-4 py-3 text-right">

                                                                        <div className="font-medium">{s.price.toLocaleString()}</div>

                                                                        <div className={`text-[10px] ${s.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>

                                                                            {s.change >= 0 ? '+' : ''}{s.change.toLocaleString()} ({s.pct_change >= 0 ? '+' : ''}{s.pct_change.toFixed(2)}%)

                                                                        </div>

                                                                    </td>

                                                                </tr>

                                                            ))}

                                                        </tbody>

                        </table>

                    </CardContent>

                </Card>

            </div>

        )}



            </div>



          </div>



        )



      }