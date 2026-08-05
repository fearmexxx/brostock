"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Award, BarChart3, Search, ChevronUp, ChevronDown, Calendar, LineChart, PieChart as PieIcon, Layers } from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const SECTOR_MAP: Record<string, string> = {
  // Ngân hàng (Banks)
  VCB: "Ngân hàng", TCB: "Ngân hàng", BID: "Ngân hàng", CTG: "Ngân hàng", VPB: "Ngân hàng",
  MBB: "Ngân hàng", ACB: "Ngân hàng", STB: "Ngân hàng", HDB: "Ngân hàng", TPB: "Ngân hàng",
  LPB: "Ngân hàng", SHB: "Ngân hàng", MSB: "Ngân hàng", OCB: "Ngân hàng", EIB: "Ngân hàng",
  VIB: "Ngân hàng", SSB: "Ngân hàng", BVB: "Ngân hàng", KLB: "Ngân hàng", ABB: "Ngân hàng",
  
  // Bất động sản (Real Estate)
  VHM: "Bất động sản", VIC: "Bất động sản", VRE: "Bất động sản", KDH: "Bất động sản",
  NLG: "Bất động sản", DXG: "Bất động sản", PDR: "Bất động sản", DIG: "Bất động sản",
  CEO: "Bất động sản", DXS: "Bất động sản", NVL: "Bất động sản", KBC: "Bất động sản",
  ITA: "Bất động sản", SZC: "Bất động sản", HDG: "Bất động sản", TCH: "Bất động sản",
  CRE: "Bất động sản", KHG: "Bất động sản", HQC: "Bất động sản", IJC: "Bất động sản",
  LDG: "Bất động sản", DXH: "Bất động sản", QCG: "Bất động sản",
  
  // Chứng khoán (Securities)
  SSI: "Chứng khoán", VND: "Chứng khoán", HCM: "Chứng khoán", VCI: "Chứng khoán",
  SHS: "Chứng khoán", FTS: "Chứng khoán", CTS: "Chứng khoán", BSI: "Chứng khoán",
  MBS: "Chứng khoán", ORS: "Chứng khoán", VIX: "Chứng khoán", AGR: "Chứng khoán",
  TVS: "Chứng khoán", BVS: "Chứng khoán", SBS: "Chứng khoán", PSI: "Chứng khoán",
  VDS: "Chứng khoán", WSS: "Chứng khoán", APG: "Chứng khoán",
  
  // Thép & Vật liệu (Steel & Materials)
  HPG: "Thép & Vật liệu", HSG: "Thép & Vật liệu", NKG: "Thép & Vật liệu",
  POM: "Thép & Vật liệu", TLH: "Thép & Vật liệu", SMC: "Thép & Vật liệu",
  VGS: "Thép & Vật liệu", HT1: "Thép & Vật liệu", BCC: "Thép & Vật liệu",
  VLB: "Thép & Vật liệu", DHA: "Thép & Vật liệu", KSB: "Thép & Vật liệu",
  
  // Bán lẻ & Tiêu dùng (Retail & Consumer)
  MWG: "Bán lẻ & Tiêu dùng", MSN: "Bán lẻ & Tiêu dùng", VNM: "Bán lẻ & Tiêu dùng",
  PNJ: "Bán lẻ & Tiêu dùng", FRT: "Bán lẻ & Tiêu dùng", SAB: "Bán lẻ & Tiêu dùng",
  DGW: "Bán lẻ & Tiêu dùng", PET: "Bán lẻ & Tiêu dùng", MCH: "Bán lẻ & Tiêu dùng",
  VCF: "Bán lẻ & Tiêu dùng", KDC: "Bán lẻ & Tiêu dùng", VOC: "Bán lẻ & Tiêu dùng",
  TLG: "Bán lẻ & Tiêu dùng", HAX: "Bán lẻ & Tiêu dùng",
  
  // Công nghệ & Viễn thông (Tech & Telecom)
  FPT: "Công nghệ & Viễn thông", CTR: "Công nghệ & Viễn thông",
  FOX: "Công nghệ & Viễn thông", ELC: "Công nghệ & Viễn thông",
  CMG: "Công nghệ & Viễn thông", VGI: "Công nghệ & Viễn thông",
  TTN: "Công nghệ & Viễn thông", ITD: "Công nghệ & Viễn thông",
  
  // Dầu khí & Năng lượng (Oil & Energy)
  GAS: "Dầu khí & Năng lượng", PLX: "Dầu khí & Năng lượng",
  PVD: "Dầu khí & Năng lượng", PVS: "Dầu khí & Năng lượng",
  POW: "Dầu khí & Năng lượng", GEG: "Dầu khí & Năng lượng",
  REE: "Dầu khí & Năng lượng", PC1: "Dầu khí & Năng lượng",
  NT2: "Dầu khí & Năng lượng",
  TV2: "Dầu khí & Năng lượng", TTA: "Dầu khí & Năng lượng",
  PVB: "Dầu khí & Năng lượng", PVC: "Dầu khí & Năng lượng",
  
  // Hóa chất & Phân bón (Chemicals & Fertilizers)
  DPM: "Hóa chất & Phân bón", DCM: "Hóa chất & Phân bón",
  GVR: "Hóa chất & Phân bón", DGC: "Hóa chất & Phân bón",
  CSV: "Hóa chất & Phân bón", PHR: "Hóa chất & Phân bón",
  DPR: "Hóa chất & Phân bón", LAS: "Hóa chất & Phân bón",
  BFC: "Hóa chất & Phân bón", SFG: "Hóa chất & Phân bón",
  
  // Thủy sản & Nông nghiệp (Agriculture & Fishery)
  VHC: "Thủy sản & Nông nghiệp", ANV: "Thủy sản & Nông nghiệp",
  FMC: "Thủy sản & Nông nghiệp", PAN: "Thủy sản & Nông nghiệp",
  BAF: "Thủy sản & Nông nghiệp", DBC: "Thủy sản & Nông nghiệp",
  HAG: "Thủy sản & Nông nghiệp", HNG: "Thủy sản & Nông nghiệp",
  IDI: "Thủy sản & Nông nghiệp", CMX: "Thủy sản & Nông nghiệp",
  MPC: "Thủy sản & Nông nghiệp",
  
  // Đầu tư công & Xây dựng (Construction & Infrastructure)
  VCG: "Đầu tư công & Xây dựng", LCG: "Đầu tư công & Xây dựng",
  HHV: "Đầu tư công & Xây dựng", C4G: "Đầu tư công & Xây dựng",
  FCN: "Đầu tư công & Xây dựng", DPG: "Đầu tư công & Xây dựng",
  HBC: "Đầu tư công & Xây dựng", CTD: "Đầu tư công & Xây dựng",
  HTN: "Đầu tư công & Xây dựng", C32: "Đầu tư công & Xây dựng",
  
  // Vận tải & Cảng biển (Logistics & Ports)
  GMD: "Vận tải & Cảng biển", HAH: "Vận tải & Cảng biển",
  PVT: "Vận tải & Cảng biển", VSC: "Vận tải & Cảng biển",
  VJC: "Vận tải & Cảng biển", HVN: "Vận tải & Cảng biển",
  SGP: "Vận tải & Cảng biển", CLL: "Vận tải & Cảng biển",
  DXP: "Vận tải & Cảng biển"
};

const SECTOR_COLORS: Record<string, string> = {
  "Ngân hàng": "#1e3a8a",
  "Bất động sản": "#b45309",
  "Chứng khoán": "#2563eb",
  "Thép & Vật liệu": "#475569",
  "Bán lẻ & Tiêu dùng": "#db2777",
  "Công nghệ & Viễn thông": "#0d9488",
  "Dầu khí & Năng lượng": "#ea580c",
  "Hóa chất & Phân bón": "#16a34a",
  "Thủy sản & Nông nghiệp": "#854d0e",
  "Đầu tư công & Xây dựng": "#7c3aed",
  "Vận tải & Cảng biển": "#0284c7",
  "Khác": "#94a3b8"
};


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

  // Swing Backtest fields (T+15)
  bt_win_rate?: number;
  bt_avg_return?: number;
  bt_profit_factor?: number;
  bt_max_drawdown?: number;
  bt_trade_count?: number;
  bt_winning_count?: number;
  real_money_confidence?: number;
  confidence_label?: string;

  // Long-term Backtest fields (T+60)
  lt_bt_win_rate?: number;
  lt_bt_avg_return?: number;
  lt_bt_profit_factor?: number;
  lt_bt_max_drawdown?: number;
  lt_bt_trade_count?: number;
  lt_bt_winning_count?: number;
  lt_real_money_confidence?: number;
  lt_confidence_label?: string;
}

type SortField = "volume" | "conviction" | "outlook" | "rr_ratio" | "lt_score" | "lt_rr_ratio"

const formatVnPrice = (price: number) => {
  if (price === undefined || price === null || isNaN(price)) return "0";
  let p = price;
  while (p > 250000) {
    p = p / 1000;
  }
  return Math.round(p).toLocaleString('vi-VN');
};

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

  const sectorData = (() => {
    const sectorCounts: Record<string, { total: number; buyCount: number; topStock: string; topScore: number }> = {};
    
    stocks.forEach(s => {
      const sector = SECTOR_MAP[s.symbol] || "Khác";
      if (!sectorCounts[sector]) {
        sectorCounts[sector] = { total: 0, buyCount: 0, topStock: "", topScore: -999 };
      }
      
      sectorCounts[sector].total += 1;
      
      const isOpportunity = mode === "swing"
        ? (s.action === "BUY" || s.action === "STRONG BUY")
        : (s.lt_action === "TÍCH LŨY" || s.lt_action === "TÍCH LŨY MẠNH");
        
      if (isOpportunity) {
        sectorCounts[sector].buyCount += 1;
      }
      
      const score = mode === "swing" ? s.signal_score : s.lt_score;
      if (score > sectorCounts[sector].topScore) {
        sectorCounts[sector].topScore = score;
        sectorCounts[sector].topStock = s.symbol;
      }
    });
    
    const chartData = Object.entries(sectorCounts)
      .map(([name, stats]) => ({
        name,
        value: stats.buyCount,
        total: stats.total,
        topStock: stats.topStock,
        topScore: stats.topScore
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
      
    return chartData;
  })();

  const totalOpportunities = sectorData.reduce((sum, item) => sum + item.value, 0);

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

        {/* Sector Analytics Panel */}
        {totalOpportunities > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white border-gray-200 shadow-sm lg:col-span-1">
              <CardHeader className="bg-gray-50 border-b border-gray-200 py-3">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <PieIcon size={16} className="text-blue-600" />
                  Phân bổ cơ hội theo ngành
                </CardTitle>
              </CardHeader>
              <CardContent className="py-6 flex flex-col items-center justify-center min-h-[260px]">
                <div className="w-full h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {sectorData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={SECTOR_COLORS[entry.name] || "#94a3b8"} 
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => {
                          const pct = ((Number(value) / totalOpportunities) * 100).toFixed(1);
                          return [`${value} mã (${pct}%)`, name];
                        }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#1e293b"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">Tổng cộng: <span className="font-bold text-blue-900">{totalOpportunities}</span> cơ hội tích cực</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-sm lg:col-span-2">
              <CardHeader className="bg-gray-50 border-b border-gray-200 py-3">
                <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Layers size={16} className="text-blue-600" />
                  Báo cáo cơ hội chi tiết theo ngành
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto max-h-[260px]">
                <table className="w-full text-xs text-left border-collapse text-gray-700">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[9px] font-bold tracking-wider border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2">Tên Ngành</th>
                      <th className="px-4 py-2 text-center">Số Cơ Hồi</th>
                      <th className="px-4 py-2 text-center">Tỷ Lệ</th>
                      <th className="px-4 py-2">Mã Dẫn Đầu (Alpha)</th>
                      <th className="px-4 py-2 text-center">Điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sectorData.map((item) => {
                      const color = SECTOR_COLORS[item.name] || "#94a3b8";
                      const pct = ((item.value / totalOpportunities) * 100).toFixed(1);
                      return (
                        <tr key={item.name} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-bold flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                            {item.name}
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-gray-900">
                            {item.value} <span className="text-[10px] text-gray-400 font-normal">/ {item.total}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-medium text-gray-500">
                            {pct}%
                          </td>
                          <td className="px-4 py-2.5 font-extrabold text-blue-900">
                            <Link href={`/?symbol=${item.topStock}`} className="hover:underline">
                              {item.topStock}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-green-700">
                            {item.topScore > 0 ? "+" : ""}{item.topScore}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

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
              <table className="w-full text-sm text-left border-collapse text-gray-800">
                <thead className="bg-gray-100/80 text-gray-800 uppercase text-xs font-black tracking-tight border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-1.5 py-2 text-center w-7">#</th>
                    <th className="px-1.5 py-2">Mã</th>
                    <th className="px-1.5 py-2 text-right">Giá</th>
                    <th className="px-1.5 py-2 text-right">%</th>
                    <th 
                      className="px-1.5 py-2 text-right cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("volume")}
                    >
                      <div className="flex items-center justify-end gap-1">KL <SortIcon field="volume" /></div>
                    </th>
                    <th 
                      className="px-1.5 py-2 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("conviction")}
                    >
                      <div className="flex items-center justify-center gap-1">Conviction <SortIcon field="conviction" /></div>
                    </th>
                    <th className="px-1.5 py-2 text-center">Khuyến nghị</th>
                    <th className="px-1.5 py-2 text-right text-green-700">Mục tiêu (Net)</th>
                    <th className="px-1.5 py-2 text-right text-red-700">Cắt lỗ (Net)</th>
                    <th 
                      className="px-1.5 py-2 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("rr_ratio")}
                    >
                      <div className="flex items-center justify-center gap-1">R:R <SortIcon field="rr_ratio" /></div>
                    </th>
                    <th 
                      className="px-1.5 py-2 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("outlook")}
                    >
                      <div className="flex items-center justify-center gap-1">5D <SortIcon field="outlook" /></div>
                    </th>
                    <th className="px-1.5 py-2 text-center text-blue-900">Backtest (T+15)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedStocks.map((s, index) => (
                    <tr key={s.symbol} className="hover:bg-blue-50/60 transition duration-100">
                      <td className="px-1.5 py-1.5 text-center font-mono text-xs text-gray-400 font-semibold">
                        {index + 1}
                      </td>
                      <td className="px-1.5 py-1.5">
                        <Link href={`/?symbol=${s.symbol}`} className="font-black text-base text-blue-950 hover:underline tracking-wider">
                          {s.symbol}
                        </Link>
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-black font-mono text-gray-900 text-base">
                        {formatVnPrice(s.price)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono text-sm">
                        <span className={`font-black ${s.pct_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {s.pct_change >= 0 ? "+" : ""}{s.pct_change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono font-bold text-gray-600 text-xs">
                        {(s.volume / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <div className={`inline-block px-2.5 py-1 rounded font-mono font-black text-sm ${
                          s.signal_score >= 25 ? "bg-green-100 text-green-800" :
                          s.signal_score <= -25 ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {s.signal_score > 0 ? "+" : ""}{s.signal_score}
                        </div>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-black uppercase inline-block shadow-sm tracking-wide ${getActionBadge(s.action)}`}>
                          {getActionLabel(s.action)}
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono">
                        <div className="text-green-700 font-black text-sm">{formatVnPrice(s.target_price)}</div>
                        <div className="text-xs text-green-600 font-extrabold">+{s.target_pct}%</div>
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono">
                        <div className="text-red-600 font-black text-sm">{formatVnPrice(s.stop_loss)}</div>
                        <div className="text-xs text-red-500 font-extrabold">{s.stop_loss_pct}%</div>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <span className={`font-mono font-black text-sm ${getRRColor(s.risk_reward_ratio)}`}>
                          {s.risk_reward_ratio.toFixed(1)}:1
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <div className={`font-black font-mono text-sm ${
                          s.prediction_5d_pct >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {s.prediction_5d_pct >= 0 ? "+" : ""}{s.prediction_5d_pct.toFixed(2)}%
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                          {s.prediction_label === "UPWARD" ? "TĂNG" : s.prediction_label === "DOWNWARD" ? "GIẢM" : "NGANG"}
                        </div>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase inline-block shadow-sm ${
                            (s.real_money_confidence ?? 0) >= 70 ? "bg-emerald-600 text-white ring-1 ring-emerald-400/50" :
                            (s.real_money_confidence ?? 0) >= 50 ? "bg-amber-500 text-black font-black" :
                            "bg-red-500 text-white"
                          }`}>
                            {s.confidence_label || "RỦI RO"} ({s.real_money_confidence ?? 0}đ)
                          </span>
                          <div className="font-mono text-xs text-gray-800 font-bold">
                            Win: <span className="text-emerald-700 font-black">{s.bt_win_rate ?? 0}%</span> ({s.bt_winning_count ?? 0}/{s.bt_trade_count ?? 0})
                          </div>
                          <div className="font-mono text-xs text-gray-600 font-semibold">
                            Lời TB: <span className={(s.bt_avg_return ?? 0) >= 0 ? "text-green-600 font-black" : "text-red-600 font-black"}>
                              {(s.bt_avg_return ?? 0) >= 0 ? "+" : ""}{s.bt_avg_return ?? 0}%
                            </span> | PF: <span className="font-black text-gray-800">{s.bt_profit_factor ?? 0}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* LONG-TERM ACCUMULATION TABLE VIEW */
              <table className="w-full text-sm text-left border-collapse text-gray-800">
                <thead className="bg-gray-100/80 text-gray-800 uppercase text-xs font-black tracking-tight border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-1.5 py-2 text-center w-7">#</th>
                    <th className="px-1.5 py-2">Mã</th>
                    <th className="px-1.5 py-2 text-right">Giá</th>
                    <th className="px-1.5 py-2 text-right">%</th>
                    <th 
                      className="px-1.5 py-2 text-right cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("volume")}
                    >
                      <div className="flex items-center justify-end gap-1">KL <SortIcon field="volume" /></div>
                    </th>
                    <th 
                      className="px-1.5 py-2 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("lt_score")}
                    >
                      <div className="flex items-center justify-center gap-1">Điểm LT Accum <SortIcon field="lt_score" /></div>
                    </th>
                    <th className="px-1.5 py-2 text-center">Khuyến nghị LT</th>
                    <th className="px-1.5 py-2 text-right text-green-700">Mục tiêu LT (Net)</th>
                    <th className="px-1.5 py-2 text-right text-red-700">Cắt lỗ LT (Net)</th>
                    <th 
                      className="px-1.5 py-2 text-center cursor-pointer hover:text-gray-900 transition select-none"
                      onClick={() => handleSort("lt_rr_ratio")}
                    >
                      <div className="flex items-center justify-center gap-1">R:R LT <SortIcon field="lt_rr_ratio" /></div>
                    </th>
                    <th className="px-1.5 py-2 text-center">Rủi ro (LT)</th>
                    <th className="px-1.5 py-2 text-center text-blue-900">Backtest (T+60)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedStocks.map((s, index) => (
                    <tr key={s.symbol} className="hover:bg-blue-50/60 transition duration-100">
                      <td className="px-1.5 py-1.5 text-center font-mono text-xs text-gray-400 font-semibold">
                        {index + 1}
                      </td>
                      <td className="px-1.5 py-1.5">
                        <Link href={`/?symbol=${s.symbol}`} className="font-black text-base text-blue-950 hover:underline tracking-wider">
                          {s.symbol}
                        </Link>
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-black font-mono text-gray-900 text-base">
                        {formatVnPrice(s.price)}
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono text-sm">
                        <span className={`font-black ${s.pct_change >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {s.pct_change >= 0 ? "+" : ""}{s.pct_change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono font-bold text-gray-600 text-xs">
                        {(s.volume / 1000000).toFixed(1)}M
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <div className={`inline-block px-2.5 py-1 rounded font-mono font-black text-sm ${
                          s.lt_score >= 25 ? "bg-green-100 text-green-800" :
                          s.lt_score <= -25 ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {s.lt_score > 0 ? "+" : ""}{s.lt_score}
                        </div>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-black uppercase inline-block shadow-sm tracking-wide ${getLTActionBadge(s.lt_action)}`}>
                          {s.lt_action}
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono">
                        <div className="text-green-700 font-black text-sm">{formatVnPrice(s.lt_target_price)}</div>
                        <div className="text-xs text-green-600 font-extrabold">{s.lt_target_pct >= 0 ? "+" : ""}{s.lt_target_pct}%</div>
                      </td>
                      <td className="px-1.5 py-1.5 text-right font-mono">
                        <div className="text-red-600 font-black text-sm">{formatVnPrice(s.lt_stop_loss)}</div>
                        <div className="text-xs text-red-500 font-extrabold">{s.lt_stop_pct}%</div>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <span className={`font-mono font-black text-sm ${getRRColor(s.lt_rr_ratio)}`}>
                          {s.lt_rr_ratio.toFixed(1)}:1
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                          s.risk_score > 60 ? "bg-red-100 text-red-700" :
                          s.risk_score > 40 ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {s.risk_label} ({s.risk_score})
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase inline-block shadow-sm ${
                            (s.lt_real_money_confidence ?? 0) >= 70 ? "bg-emerald-600 text-white ring-1 ring-emerald-400/50" :
                            (s.lt_real_money_confidence ?? 0) >= 50 ? "bg-amber-500 text-black font-black" :
                            "bg-red-500 text-white"
                          }`}>
                            {s.lt_confidence_label || "RỦI RO"} ({s.lt_real_money_confidence ?? 0}đ)
                          </span>
                          <div className="font-mono text-xs text-gray-800 font-bold">
                            Win: <span className="text-emerald-700 font-black">{s.lt_bt_win_rate ?? 0}%</span> ({s.lt_bt_winning_count ?? 0}/{s.lt_bt_trade_count ?? 0})
                          </div>
                          <div className="font-mono text-xs text-gray-600 font-semibold">
                            Lời TB: <span className={(s.lt_bt_avg_return ?? 0) >= 0 ? "text-green-600 font-black" : "text-red-600 font-black"}>
                              {(s.lt_bt_avg_return ?? 0) >= 0 ? "+" : ""}{s.lt_bt_avg_return ?? 0}%
                            </span> | MaxDD: <span className="font-black text-red-600">{s.lt_bt_max_drawdown ?? 0}%</span>
                          </div>
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
