"use client"

import React, { useState } from "react"
import { Check, Copy, ExternalLink, ShieldCheck, Sparkles, X, Gift, Award, TrendingUp } from "lucide-react"

interface BrokerPartner {
  id: string
  name: string
  short_desc: string
  referral_code: string
  referral_link: string
  badge: string
  fee_desc: string
}

const BROKERS: BrokerPartner[] = [
  {
    id: "vps",
    name: "VPS Securities",
    short_desc: "Thị phần số 1 TTCK Việt Nam. Phí thấp, margin linh hoạt và hệ sinh thái phái sinh mạnh mẽ.",
    referral_code: "FENWEALTH",
    referral_link: "https://openaccount.vps.com.vn/?MKTID=FENWEALTH",
    badge: "Thị phần #1",
    fee_desc: "0.1% hoặc ưu đãi Zero Fee"
  },
  {
    id: "tcbs",
    name: "Techcom Securities (TCBS)",
    short_desc: "Nền tảng công nghệ số 1 cho đầu tư Tích sản cổ phiếu, trái phiếu và quỹ iCopy tự động.",
    referral_code: "105C989898",
    referral_link: "https://tcinvest.tcbs.com.vn/open-account?ref=105C989898",
    badge: "Chuẩn Tích Sản",
    fee_desc: "0.03% (Zero Fee tích sản)"
  },
  {
    id: "dnse",
    name: "DNSE Securities",
    short_desc: "Chứng khoán số thế hệ mới, miễn phí giao dịch trọn đời, quản trị danh mục theo từng deal.",
    referral_code: "FENWEALTH_VIP",
    referral_link: "https://www.dnse.com.vn/mo-tai-khoan?ref=FENWEALTH_VIP",
    badge: "Zero Fee Trọn Đời",
    fee_desc: "0.0% trọn đời"
  }
]

interface BrokerReferralModalProps {
  isOpen: boolean
  onClose: () => void
  symbol?: string
  action?: string
}

export default function BrokerReferralModal({ isOpen, onClose, symbol, action }: BrokerReferralModalProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedBroker, setSelectedBroker] = useState<string>("vps")

  if (!isOpen) return null

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const current = BROKERS.find(b => b.id === selectedBroker) || BROKERS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-gray-900">
        
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#0284c7] p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Award size={12} />
              ĐỐI TÁC HỌC VIỆN FENWEALTH
            </span>
            {symbol && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 font-mono font-bold text-xs">
                Mã: {symbol} ({action || "KHUYẾN NGHỊ"})
              </span>
            )}
          </div>

          <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
            Mở Tài Khoản Nhận Tín Hiệu VIP Realtime
          </h3>
          <p className="text-blue-100 text-xs md:text-sm mt-1 leading-relaxed">
            Đăng ký qua đối tác FENWEALTH để nhận ngay quyền lợi miễn phí giao dịch và tham gia Room VIP Tích Sản Thực Chiến.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Broker Selector Tabs */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">
              Chọn Công Ty Chứng Khoán Đối Tác:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BROKERS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBroker(b.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    selectedBroker === b.id
                      ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="font-black text-sm text-gray-900">{b.name.split(" ")[0]}</div>
                  <div className="text-[10px] text-gray-500 line-clamp-1">{b.badge}</div>
                  {selectedBroker === b.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Active Broker Details Card */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-black text-base text-blue-950 flex items-center gap-2">
                  {current.name}
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">
                    {current.badge}
                  </span>
                </h4>
                <p className="text-xs text-gray-600 mt-1">{current.short_desc}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="text-[11px] font-bold text-gray-500">Mã Người Giới Thiệu FENWEALTH:</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-black text-lg text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {current.referral_code}
                  </span>
                  <button
                    onClick={() => handleCopy(current.referral_code)}
                    className="p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
                    title="Sao chép mã"
                  >
                    {copiedCode === current.referral_code ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              </div>

              <a
                href={current.referral_link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-black text-sm shadow-md transition transform active:scale-95"
              >
                Mở E-KYC 3 Phút
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          {/* Exclusive Benefits of FENWEALTH */}
          <div className="space-y-2">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Gift size={14} className="text-amber-500" />
              Đặc Quyền Hội Viên Khi Gắn Mã FENWEALTH:
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Miễn phí giao dịch</strong> hoặc ưu đãi Zero Fee trọn gói.</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/50 border border-blue-100">
                <Sparkles size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Tặng Bot Telegram VIP</strong> cảnh báo kèo Realtime trong phiên.</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-purple-50/50 border border-purple-100">
                <TrendingUp size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Tham gia <strong>Room Zoom Tích Sản Thực Chiến</strong> mỗi cuối tuần.</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                <Award size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <span>Được chuyên gia FENWEALTH <strong>tái cơ cấu danh mục 1-1</strong>.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
          <span>Hỗ trợ mở tài khoản: <strong>Học viện FENWEALTH</strong></span>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 font-bold"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  )
}
