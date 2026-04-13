"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react"

interface MarketStats {
    indices: Record<string, { value: number; change: number; pct_change: number }>;
    market_stats?: {
        breadth: { advancing: number; declining: number; unchanged: number };
        total_volume: number;
    };
}

export function GlobalHUD() {
    const [stats, setStats] = useState<MarketStats | null>(null)
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/market/overview`)
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (e) {
            console.error("HUD Fetch Error", e)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 60000) // 1 minute
        return () => clearInterval(interval)
    }, [])

    if (!stats) return null

    const breadth = stats.market_stats?.breadth || { advancing: 0, declining: 0, unchanged: 0 }
    const total = (breadth.advancing + breadth.declining + breadth.unchanged) || 1
    const advPct = (breadth.advancing / total) * 100
    const decPct = (breadth.declining / total) * 100

    return (
        <div className="sticky top-0 z-50 w-full bg-[#0f172a] text-white border-b border-slate-700 shadow-xl overflow-x-auto no-scrollbar">
            <div className="max-w-[1600px] mx-auto flex items-center h-12 px-4 gap-8 min-w-max">
                
                {/* Indices Section */}
                <div className="flex items-center gap-6 border-r border-slate-700 pr-6">
                    {Object.entries(stats.indices || {}).map(([name, data]) => (
                        <div key={name} className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{name}</span>
                            <span className="text-sm font-black">{data.value.toLocaleString('de-DE', {minimumFractionDigits: 2})}</span>
                            <span className={`text-[10px] font-bold flex items-center ${data.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {data.change >= 0 ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                                {data.pct_change.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>

                {/* Market Breadth Section */}
                <div className="flex items-center gap-4 border-r border-slate-700 pr-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Độ rộng</span>
                    <div className="flex w-32 h-1.5 rounded-full overflow-hidden bg-slate-800">
                        <div className="bg-green-500 h-full" style={{ width: `${advPct}%` }}></div>
                        <div className="bg-slate-500 h-full" style={{ width: `${(breadth.unchanged/total)*100}%` }}></div>
                        <div className="bg-red-500 h-full" style={{ width: `${decPct}%` }}></div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-black">
                        <span className="text-green-400 flex items-center gap-0.5"><TrendingUp size={10}/> {breadth.advancing}</span>
                        <span className="text-slate-400 flex items-center gap-0.5"><Minus size={10}/> {breadth.unchanged}</span>
                        <span className="text-red-400 flex items-center gap-0.5"><TrendingDown size={10}/> {breadth.declining}</span>
                    </div>
                </div>

                {/* Liquidity Section */}
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Khối lượng</span>
                    <span className="text-sm font-black text-blue-100">
                        {(stats.market_stats?.total_volume || 0).toLocaleString()} <span className="text-[10px] text-slate-500 ml-1">CP</span>
                    </span>
                </div>

            </div>
        </div>
    )
}
