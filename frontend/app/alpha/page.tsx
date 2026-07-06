"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Award, TrendingUp, BarChart3, Search } from "lucide-react"
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
  action: "BUY" | "SELL" | "HOLD";
}

export default function AlphaPage() {
  const [stocks, setStocks] = useState<AlphaStock[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterAction, setFilterAction] = useState<"ALL" | "BUY" | "SELL" | "HOLD">("ALL")
  const [sortBy, setSortBy] = useState<"volume" | "conviction" | "outlook">("volume")
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

  const handleSort = (field: "volume" | "conviction" | "outlook") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  // Filter and Search Logic
  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterAction === "ALL" || s.action === filterAction
    return matchesSearch && matchesFilter
  })

  // Sorting Logic
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let valA = 0
    let valB = 0
    if (sortBy === "volume") {
      valA = a.volume
      valB = b.volume
    } else if (sortBy === "conviction") {
      valA = a.signal_score
      valB = b.signal_score
    } else if (sortBy === "outlook") {
      valA = a.prediction_5d_pct
      valB = b.prediction_5d_pct
    }
    return sortOrder === "asc" ? valA - valB : valB - valA
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-900">
        <p className="text-blue-600 animate-pulse text-lg font-bold">Đang tải danh sách ALPHA (Top 100)...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header HUD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Award className="text-amber-500" size={28} />
              <h1 className="text-3xl font-black text-gray-900 tracking-wider">BROSTOCK ALPHA</h1>
            </div>
            <p className="text-gray-500 mt-1">Hệ thống xếp hạng Top 100 cổ phiếu hàng đầu theo Thanh khoản & Vốn hóa kèm Tín hiệu Giao dịch Tự động</p>
          </div>
          <div className="text-left md:text-right text-[11px] text-gray-400 font-mono">
            {stocks.length > 0 && (
              <p>Hệ thống tự động cập nhật mỗi 60 giây</p>
            )}
          </div>
        </div>

        {/* Action Controls HUD */}
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          {/* Search Box */}
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

          {/* Quick Filters */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            {(["ALL", "BUY", "SELL", "HOLD"] as const).map(act => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition ${
                  filterAction === act
                    ? "bg-[#1e3a8a] text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 shadow-sm"
                }`}
              >
                {act === "ALL" ? "TẤT CẢ" : act === "BUY" ? "MUA" : act === "SELL" ? "BÁN" : "NẮM GIỮ"}
              </button>
            ))}
          </div>
        </div>

        {/* Alpha List Card */}
        <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
          <CardHeader className="bg-gray-50 border-b border-gray-200 py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                Bảng tín hiệu ALPHA xếp hạng thanh khoản hàng đầu
              </CardTitle>
              <span className="text-xs text-gray-500 font-mono">Hiển thị {filteredStocks.length} trên 100 mã</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {filteredStocks.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Không tìm thấy mã cổ phiếu nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3.5 text-center w-12">Hạng</th>
                    <th className="px-6 py-3.5">Mã</th>
                    <th className="px-6 py-3.5 text-right">Giá (VND)</th>
                    <th className="px-6 py-3.5 text-right">Thay đổi</th>
                    <th 
                      className="px-6 py-3.5 text-right cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("volume")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Khối lượng
                        {sortBy === "volume" && (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3.5 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("conviction")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Điểm Conviction
                        {sortBy === "conviction" && (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                      </div>
                    </th>
                    <th className="px-6 py-3.5 text-center">Khuyến nghị</th>
                    <th 
                      className="px-6 py-3.5 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("outlook")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Triển vọng 5D
                        {sortBy === "outlook" && (sortOrder === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {sortedStocks.map((s, index) => (
                    <tr key={s.symbol} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 text-center font-mono text-xs text-gray-450">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/?symbol=${s.symbol}`} className="font-extrabold text-blue-900 hover:underline text-md tracking-wider">
                          {s.symbol}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold font-mono text-gray-900">
                        {s.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        <div className={`flex items-center justify-end gap-1 font-bold ${
                          s.pct_change >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {s.pct_change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          <span>{s.pct_change >= 0 ? "+" : ""}{s.pct_change.toFixed(2)}%</span>
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {s.change >= 0 ? "+" : ""}{s.change.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-gray-650">
                        {(s.volume / 1000000).toFixed(2)}M
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-gray-100 text-gray-700">
                          {s.signal_score > 0 ? "+" : ""}{s.signal_score}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-black uppercase inline-block shadow-sm tracking-wide ${
                          s.action === "BUY" ? "bg-green-600 text-white" :
                          s.action === "SELL" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"
                        }`}>
                          {s.action === "BUY" ? "MUA" : s.action === "SELL" ? "BÁN" : "NẮM GIỮ"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`font-bold font-mono text-xs ${
                          s.prediction_5d_pct >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {s.prediction_5d_pct >= 0 ? "+" : ""}{s.prediction_5d_pct.toFixed(2)}%
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-gray-400">
                          {s.prediction_label === "UPWARD" ? "TĂNG" : s.prediction_label === "DOWNWARD" ? "GIẢM" : "ĐI NGANG"}
                        </div>
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
