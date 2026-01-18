"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface ScanItem {
    score: number
    action: "BUY" | "SELL" | "NEUTRAL"
    price: number
    pct_change: number
}

interface PortfolioItem {
    Symbol: string
    Quantity: number
}

export default function SignalAlerts() {
    const [alerts, setAlerts] = useState<Array<{symbol: string, type: string, score: number, msg: string}>>([])
    const [loading, setLoading] = useState(true)

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const checkSignals = async () => {
            // 1. Load Portfolio
            if (typeof window === 'undefined') return
            const stored = localStorage.getItem('brostock_portfolio')
            const portfolio: PortfolioItem[] = stored ? JSON.parse(stored) : []

            if (portfolio.length === 0) {
                setLoading(false)
                return
            }

            // 2. Fetch Market Scan
            try {
                const res = await fetch(`${API_URL}/api/market/scan`)
                if (!res.ok) return
                const scan: Record<string, ScanItem> = await res.json()

                // 3. Match
                const newAlerts = []
                for (const item of portfolio) {
                    const sym = item.Symbol
                    const marketData = scan[sym]
                    
                    if (marketData) {
                        // SELL WARNING
                        if (marketData.action === "SELL") {
                            newAlerts.push({
                                symbol: sym,
                                type: "SELL",
                                score: marketData.score,
                                msg: `Warning: ${sym} has a Strong Sell signal (Score: ${marketData.score}). Consider exiting.`
                            })
                        }
                        // HOLD CONFIRMATION (Optional, maybe just strong buys?)
                        else if (marketData.action === "BUY") {
                             newAlerts.push({
                                symbol: sym,
                                type: "BUY",
                                score: marketData.score,
                                msg: `Good Hold: ${sym} maintains a Strong Buy signal (Score: ${marketData.score}).`
                            })
                        }
                    }
                }
                setAlerts(newAlerts)
            } catch (e) {
                console.error("Signal check failed", e)
            } finally {
                setLoading(false)
            }
        }

        checkSignals()
    }, [API_URL])

    if (loading || alerts.length === 0) return null

    return (
        <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" /> 
                Portfolio Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert, idx) => (
                    <Card key={idx} className={`border-l-4 ${alert.type === 'SELL' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                        <CardContent className="p-4 flex items-start gap-3">
                            {alert.type === 'SELL' ? (
                                <TrendingDown className="text-red-600 mt-1" size={20} />
                            ) : (
                                <TrendingUp className="text-green-600 mt-1" size={20} />
                            )}
                            <div>
                                <p className={`font-bold ${alert.type === 'SELL' ? 'text-red-800' : 'text-green-800'}`}>
                                    {alert.type === 'SELL' ? 'SELL SIGNAL' : 'STRONG TREND'}
                                </p>
                                <p className="text-sm text-gray-700">{alert.msg}</p>
                                <Link href={`/?symbol=${alert.symbol}`} className="text-xs underline mt-1 block text-gray-500 hover:text-gray-800">
                                    View Analysis
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
