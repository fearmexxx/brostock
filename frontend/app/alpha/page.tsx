"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Award, BarChart3, Search, ChevronUp, ChevronDown, Calendar, LineChart } from "lucide-react"
import Link from "next/link"

interface AlphaStock {
  symbol: string;
  price: number;
  change: number;
  pct_change: number;
  volume: number;
  signal_score: number;
  signal_label: string;
  prediction_5d_pct: number;
  prediction_label: string;
  action: string;
  target_price: number;
  target_pct: number;
  stop_loss: number;
  stop_loss_pct: number;
  risk_reward_ratio: number;
  risk_score: number;
  risk_label: string;
  alpha_rank_score: number;
  
  // Long-term accumulation fields
  lt_score: number;
  lt_label: string;
  lt_action: string;
  lt_target_price: number;
  lt_target_pct: number;
  lt_stop_loss: number;
  lt_stop_pct: number;
  lt_rr_ratio: number;
}

type SortField = "volume" | "conviction" | "outlook" | "rr_ratio" | "lt_score" | "lt_rr_ratio"

export default function AlphaPage() {
  const [stocks, setStocks] = useState<AlphaStock[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [mode, setMode] = useState<"swing" | "longterm">("swing")
  const [filterAction, setFilterAction] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<SortField>("conviction")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchAlphaData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/market/alpha`)
      const json = await res.json()
      setStocks(json || [])
    } catch (e) {
      console.error("Failed to fetch Alpha list:", e)
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  useEffect(() => {
    fetchAlphaData()
    const interval = setInterval(fetchAlphaData, 60000)
    return () => clearInterval(interval)
  }, [fetchAlphaData])

  // Reset filter when switching modes
  const handleModeChange = (newMode: "swing" | "longterm") => {
    setMode(newMode)
    setFilterAction("ALL")
    setSortBy(newMode === "swing" ? "conviction" : "lt_score")
    setSortOrder("desc")
  }

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null
    return sortOrder === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />
  }

  // Filter and Search Logic
  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (filterAction === "ALL") return true

    if (mode === "swing") {
      if (filterAction === "BUY") return s.action === "BUY" || s.action === "STRONG BUY"
      if (filterAction === "SELL") return s.action === "SELL" || s.action === "STRONG SELL"
      if (filterAction === "HOLD") return s.action === "HOLD"
      if (filterAction === "ALERT") return s.action === "CẢNH BÁO"
    } else {
      if (filterAction === "ACCUMULATE") return s.lt_action === "TÍCH LŨY" || s.lt_action === "TÍCH LŨY MẠNH"
      if (filterAction === "AVOID") return s.lt_action === "TRÁNH"
      if (filterAction === "WATCH") return s.lt_action === "THEO DÕI"
      if (filterAction === "ALERT") return s.lt_action === "CẢNH BÁO"
    }
    return true
  })

  // Sorting Logic
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let valA = 0, valB = 0
    if (sortBy === "volume") { valA = a.volume; valB = b.volume }
    else if (sortBy === "conviction") { valA = a.signal_score; valB = b.signal_score }
    else if (sortBy === "outlook") { valA = a.prediction_5d_pct; valB = b.prediction_5d_pct }
    else if (sortBy === "rr_ratio") { valA = a.risk_reward_ratio; valB = b.risk_reward_ratio }
    else if (sortBy === "lt_score") { valA = a.lt_score; valB = b.lt_score }
    else if (sortBy === "lt_rr_ratio") { valA = a.lt_rr_ratio; valB = b.lt_rr_ratio }
    return sortOrder === "asc" ? valA - valB : valB - valA
  })

  const getActionBadge = (action: string) => {
    switch (action) {
      case "STRONG BUY": return "bg-green-700 text-white ring-2 ring-green-400/50"
      case "BUY": return "bg-green-600 text-white"
      case "STRONG SELL": return "bg-red-700 text-white ring-2 ring-red-400/50"
      case "SELL": return "bg-red-600 text-white"
      case "CẢNH BÁO": return "bg-amber-500 text-black"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case "STRONG BUY": return "MUA MẠNH"
      case "BUY": return "MUA"
      case "STRONG SELL": return "BÁN MẠNH"
      case "SELL": return "BÁN"
      case "CẢNH BÁO": return "CẢNH BÁO"
      default: return "NẮM GIỮ"
    }
  }

  const getLTActionBadge = (action: string) => {
    switch (action) {
      case "TÍCH LŨY MẠNH": return "bg-green-700 text-white ring-2 ring-green-400/50"
      case "TÍCH LŨY": return "bg-green-600 text-white"
      case "TRÁNH": return "bg-red-600 text-white"
      case "CẢNH BÁO": return "bg-amber-500 text-black"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  const getRRColor = (rr: number) => {
    if (rr >= 2) return "text-green-600 font-black"
    if (rr >= 1) return "text-amber-600 font-bold"
    return "text-red-500 font-medium"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-900">
        <p className="text-blue-600 animate-pulse text-lg font-bold">Đang tải danh sách ALPHA (Top 100)...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Award className="text-amber-500" size={28} />
              <h1 className="text-3xl font-black text-gray-900 tracking-wider">BROSTOCK ALPHA v2.5</h1>
            </div>
            <p className="text-gray-500 mt-1">Hệ thống xếp hạng tổng hợp Top 100 cơ hội thị trường Việt Nam (Lợi nhuận ròng đã trừ thuế & phí 0.4%)</p>
          </div>
          
          {/* Mode Switcher */}
          <div className="flex gap-2 bg-gray-200/60 p-1.5 rounded-lg border border-gray-300 shadow-inner">
            <button
              onClick={() => handleModeChange("swing")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all duration-155 uppercase ${
                mode === "swing" 
                  ? "bg-[#1e3a8a] text-white shadow-sm" 
                  : "text-gray-650 hover:bg-gray-100"
              }`}
            >
              <LineChart size={14} />
              Swing Trading (T+15)
            </button>
            <button
              onClick={() => handleModeChange("longterm")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all duration-155 uppercase ${
                mode === "longterm" 
                  ? "bg-[#1e3a8a] text-white shadow-sm" 
                  : "text-gray-650 hover:bg-gray-100"
              }`}
            >
              <Calendar size={14} />
              Tích lũy Dài hạn (3-6M)
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm mã cổ phiếu..."
              className="bg-white border border-gray-300 rounded-md py-2 pl-10 pr-4 text-sm w-full text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Quick Filters - Contextual based on mode */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {mode === "swing" ? (
              [
                { key: "ALL", label: "TẤT CẢ" },
                { key: "BUY", label: "MUA" },
                { key: "SELL", label: "BÁN" },
                { key: "HOLD", label: "NẮM GIỮ" },
                { key: "ALERT", label: "CẢNH BÁO" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterAction(f.key)}
                  className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition ${
                    filterAction === f.key
                      ? "bg-[#1e3a8a] text-white shadow-md"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  {f.label}
                </button>
              ))
            ) : (
              [
                { key: "ALL", label: "TẤT CẢ" },
                { key: "ACCUMULATE", label: "TÍCH LŨY" },
                { key: "WATCH", label: "THEO DÕI" },
                { key: "AVOID", label: "TRÁNH" },
                { key: "ALERT", label: "CẢNH BÁO" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterAction(f.key)}
                  className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition ${
                    filterAction === f.key
                      ? "bg-[#1e3a8a] text-white shadow-md"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  {f.label}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Table Card */}
        <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200 py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                {mode === "swing" 
                  ? "Bảng tín hiệu ALPHA v2.5 — Swing Trading (Mục tiêu 6-10%/tháng)" 
                  : "Bảng tín hiệu ALPHA v2.5 — Đầu tư & Tích lũy dài hạn (Nắm giữ 3-6 tháng)"
                }
              </CardTitle>
              <span className="text-xs text-gray-500 font-mono">Hiển thị {filteredStocks.length} / {stocks.length} mã</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {filteredStocks.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Không tìm thấy mã cổ phiếu nào phù hợp.
              </div>
            ) : mode === "swing" ? (
              /* SWING TRADING TABLE VIEW */
              <table className="w-full text-sm text-left border-collapse text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-center w-10">#</th>
                    <th className="px-3 py-3">Mã</th>
                    <th className="px-3 py-3 text-right">Giá</th>
                    <th className="px-3 py-3 text-right">%</th>
                    <th 
                      className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("volume")}
                    >
                      <div className="flex items-center justify-end gap-1">KL <SortIcon field="volume" /></div>
                    </th>
                    <th 
                      className="px-3 py-3 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("conviction")}
                    >
                      <div className="flex items-center justify-center gap-1">Conviction <SortIcon field="conviction" /></div>
                    </th>
                    <th className="px-3 py-3 text-center">Khuyến nghị</th>
                    <th className="px-3 py-3 text-right text-green-700">Mục tiêu (Net)</th>
                    <th className="px-3 py-3 text-right text-red-700">Cắt lỗ (Net)</th>
                    <th 
                      className="px-3 py-3 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("rr_ratio")}
                    >
                      <div className="flex items-center justify-center gap-1">R:R <SortIcon field="rr_ratio" /></div>
                    </th>
                    <th 
                      className="px-3 py-3 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("outlook")}
                    >
                      <div className="flex items-center justify-center gap-1">5D <SortIcon field="outlook" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedStocks.map((s, index) => (
                    <tr key={s.symbol} className="hover:bg-blue-50/50 transition duration-100">
                      <td className="px-3 py-3 text-center font-mono text-xs text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/?symbol=${s.symbol}`} className="font-extrabold text-blue-900 hover:underline tracking-wider">
                          {s.symbol}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold font-mono text-gray-900 text-xs">
                        {s.price.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs">
                        <span className={`font-bold ${s.pct_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {s.pct_change >= 0 ? "+" : ""}{s.pct_change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-medium text-gray-500 text-xs">
                        {(s.volume / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          s.signal_score >= 25 ? "bg-green-100 text-green-800" :
                          s.signal_score <= -25 ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {s.signal_score > 0 ? "+" : ""}{s.signal_score}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase inline-block shadow-sm tracking-wide ${getActionBadge(s.action)}`}>
                          {getActionLabel(s.action)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs">
                        <div className="text-green-700 font-bold">{(s.target_price * 1000).toLocaleString()}</div>
                        <div className="text-[9px] text-green-500">+{s.target_pct}%</div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs">
                        <div className="text-red-600 font-bold">{(s.stop_loss * 1000).toLocaleString()}</div>
                        <div className="text-[9px] text-red-450">{s.stop_loss_pct}%</div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-mono text-xs ${getRRColor(s.risk_reward_ratio)}`}>
                          {s.risk_reward_ratio.toFixed(1)}:1
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className={`font-bold font-mono text-xs ${
                          s.prediction_5d_pct >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {s.prediction_5d_pct >= 0 ? "+" : ""}{s.prediction_5d_pct.toFixed(2)}%
                        </div>
                        <div className="text-[8px] uppercase tracking-wider text-gray-400">
                          {s.prediction_label === "UPWARD" ? "TĂNG" : s.prediction_label === "DOWNWARD" ? "GIẢM" : "NGANG"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* LONG-TERM ACCUMULATION TABLE VIEW */
              <table className="w-full text-sm text-left border-collapse text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-center w-10">#</th>
                    <th className="px-3 py-3">Mã</th>
                    <th className="px-3 py-3 text-right">Giá</th>
                    <th className="px-3 py-3 text-right">%</th>
                    <th 
                      className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("volume")}
                    >
                      <div className="flex items-center justify-end gap-1">KL <SortIcon field="volume" /></div>
                    </th>
                    <th 
                      className="px-3 py-3 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("lt_score")}
                    >
                      <div className="flex items-center justify-center gap-1">Điểm LT Accum <SortIcon field="lt_score" /></div>
                    </th>
                    <th className="px-3 py-3 text-center">Khuyến nghị LT</th>
                    <th className="px-3 py-3 text-right text-green-700">Mục tiêu LT (Net)</th>
                    <th className="px-3 py-3 text-right text-red-700">Cắt lỗ LT (Net)</th>
                    <th 
                      className="px-3 py-3 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("lt_rr_ratio")}
                    >
                      <div className="flex items-center justify-center gap-1">R:R LT <SortIcon field="lt_rr_ratio" /></div>
                    </th>
                    <th className="px-3 py-3 text-center">Rủi ro (LT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedStocks.map((s, index) => (
                    <tr key={s.symbol} className="hover:bg-blue-50/50 transition duration-100">
                      <td className="px-3 py-3 text-center font-mono text-xs text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/?symbol=${s.symbol}`} className="font-extrabold text-blue-900 hover:underline tracking-wider">
                          {s.symbol}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold font-mono text-gray-900 text-xs">
                        {s.price.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs">
                        <span className={`font-bold ${s.pct_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {s.pct_change >= 0 ? "+" : ""}{s.pct_change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-medium text-gray-500 text-xs">
                        {(s.volume / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          s.lt_score >= 25 ? "bg-green-100 text-green-800" :
                          s.lt_score <= -25 ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {s.lt_score > 0 ? "+" : ""}{s.lt_score}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase inline-block shadow-sm tracking-wide ${getLTActionBadge(s.lt_action)}`}>
                          {s.lt_action}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs">
                        <div className="text-green-700 font-bold">{(s.lt_target_price * 1000).toLocaleString()}</div>
                        <div className="text-[9px] text-green-500">{s.lt_target_pct >= 0 ? "+" : ""}{s.lt_target_pct}%</div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs">
                        <div className="text-red-600 font-bold">{(s.lt_stop_loss * 1000).toLocaleString()}</div>
                        <div className="text-[9px] text-red-400">{s.lt_stop_pct}%</div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`font-mono text-xs ${getRRColor(s.lt_rr_ratio)}`}>
                          {s.lt_rr_ratio.toFixed(1)}:1
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.risk_score > 60 ? "bg-red-100 text-red-700" :
                          s.risk_score > 40 ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {s.risk_label} ({s.risk_score})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
